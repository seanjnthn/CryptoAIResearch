import "server-only";

import type {
  OnchainValuationData,
  OnchainValuationState,
} from "@/types/crypto";

const COIN_METRICS_BASE_URL = "https://community-api.coinmetrics.io/v4";
const UNAVAILABLE_MESSAGE = "MVRV unavailable for this asset or data source.";
const PROVIDER_LIMITED_MESSAGE =
  "MVRV unavailable with current Coin Metrics Community access.";
const assetMapping: Record<string, string> = {
  bitcoin: "btc",
  ethereum: "eth",
  solana: "sol",
  sui: "sui",
  ripple: "xrp",
  bittensor: "tao",
};

const metricAttempts = [
  {
    metrics: ["CapMVRVCur", "CapRealUSD", "CapMrktCurUSD"],
    metricField: "CapMVRVCur",
    metricLabel: "Current MVRV",
    realizedCapField: "CapRealUSD",
    marketCapField: "CapMrktCurUSD",
  },
  {
    metrics: ["CapMVRVFF", "CapRealUSD", "CapMrktFFUSD"],
    metricField: "CapMVRVFF",
    metricLabel: "Free-float MVRV",
    realizedCapField: "CapRealUSD",
    marketCapField: "CapMrktFFUSD",
  },
  {
    metrics: ["CapRealUSD", "CapMrktCurUSD"],
    metricField: null,
    metricLabel: "Approximate MVRV",
    realizedCapField: "CapRealUSD",
    marketCapField: "CapMrktCurUSD",
  },
] as const;

type MetricAttempt = (typeof metricAttempts)[number];
type CoinMetricsRow = Record<string, string | number | null | undefined> & {
  asset?: string;
  time?: string;
};

interface CoinMetricsResponse {
  data?: CoinMetricsRow[];
}

interface AttemptResult {
  result?: OnchainValuationData;
  attemptedUrl: string;
  upstreamStatus: number | null;
  upstreamMessage: string | null;
}

function parseMetric(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function classifyValuation(mvrv: number | null): OnchainValuationState {
  if (mvrv === null) {
    return "Unavailable";
  }

  if (mvrv < 1) {
    return "Undervalued/Capitulation Zone";
  }

  if (mvrv < 2) {
    return "Neutral";
  }

  if (mvrv < 3.5) {
    return "Elevated";
  }

  return "Overheated";
}

function createBaseResponse(
  coinId: string,
  asset: string | null,
  overrides: Partial<OnchainValuationData> = {},
): OnchainValuationData {
  return {
    sourceAvailable: false,
    provider: "coinmetrics",
    coinId,
    asset,
    attemptedUrl: null,
    upstreamStatus: null,
    upstreamMessage: null,
    availableMetricsTried: [],
    metricLabel: null,
    time: null,
    mvrv: null,
    realizedCapUsd: null,
    marketCapUsd: null,
    valuationState: "Unavailable",
    notes: [
      "MVRV availability depends on Coin Metrics coverage for the selected asset.",
      "MVRV is cycle context only and is not a standalone trading signal.",
    ],
    message: UNAVAILABLE_MESSAGE,
    error: false,
    ...overrides,
  };
}

function getContextNotes(valuationState: OnchainValuationState) {
  const notes = [
    "MVRV compares market capitalization with realized capitalization.",
    "Thresholds are simplified and are most useful for long-cycle context, not short-term timing.",
    "MVRV is contextual only and is not a standalone trading signal.",
  ];

  if (valuationState === "Undervalued/Capitulation Zone") {
    notes.push(
      "MVRV below 1 can reflect a broad unrealized loss or capitulation backdrop.",
    );
  }

  if (valuationState === "Elevated" || valuationState === "Overheated") {
    notes.push(
      "Higher MVRV can reflect a larger unrealized profit backdrop and possible distribution risk.",
    );
  }

  return notes;
}

function buildAttemptUrl(asset: string, metrics: readonly string[]) {
  const search = new URLSearchParams({
    assets: asset,
    metrics: metrics.join(","),
    frequency: "1d",
    limit_per_asset: "1",
    page_size: "1",
    paging_from: "end",
  });

  return `${COIN_METRICS_BASE_URL}/timeseries/asset-metrics?${search.toString()}`;
}

async function tryMetricSet(
  coinId: string,
  asset: string,
  attempt: MetricAttempt,
  triedMetrics: string[],
): Promise<AttemptResult> {
  const attemptedUrl = buildAttemptUrl(asset, attempt.metrics);
  let response: Response;

  try {
    response = await fetch(attemptedUrl, { cache: "no-store" });
  } catch {
    return {
      attemptedUrl,
      upstreamStatus: null,
      upstreamMessage: "Coin Metrics request could not be completed.",
    };
  }

  const responseBody = await response.text();

  if (!responseBody.trim()) {
    return {
      attemptedUrl,
      upstreamStatus: response.status,
      upstreamMessage: "Coin Metrics returned an empty response body.",
    };
  }

  let responseData: CoinMetricsResponse;

  try {
    responseData = JSON.parse(responseBody) as CoinMetricsResponse;
  } catch {
    return {
      attemptedUrl,
      upstreamStatus: response.status,
      upstreamMessage: "Coin Metrics returned a non-JSON response.",
    };
  }

  if (!response.ok) {
    const upstreamMessage =
      typeof (responseData as { error?: { message?: unknown } }).error?.message ===
      "string"
        ? (responseData as { error: { message: string } }).error.message
        : `Coin Metrics request failed with status ${response.status}.`;

    return { attemptedUrl, upstreamStatus: response.status, upstreamMessage };
  }

  if (!Array.isArray(responseData.data) || responseData.data.length === 0) {
    return {
      attemptedUrl,
      upstreamStatus: response.status,
      upstreamMessage:
        "Coin Metrics returned no data for the requested asset/metrics.",
    };
  }

  const latest = responseData.data[0];
  const realizedCapUsd = parseMetric(latest[attempt.realizedCapField]);
  const marketCapUsd = parseMetric(latest[attempt.marketCapField]);
  const metricValue =
    attempt.metricField === null ? null : parseMetric(latest[attempt.metricField]);
  const approximateMvrv =
    attempt.metricField === null &&
    realizedCapUsd !== null &&
    realizedCapUsd > 0 &&
    marketCapUsd !== null
      ? marketCapUsd / realizedCapUsd
      : null;
  const mvrv = metricValue ?? approximateMvrv;

  if (mvrv === null) {
    return {
      attemptedUrl,
      upstreamStatus: response.status,
      upstreamMessage: "Coin Metrics returned data without a usable MVRV value.",
    };
  }

  const valuationState = classifyValuation(mvrv);

  return {
    attemptedUrl,
    upstreamStatus: response.status,
    upstreamMessage: null,
    result: createBaseResponse(coinId, latest.asset ?? asset, {
      sourceAvailable: true,
      attemptedUrl,
      upstreamStatus: response.status,
      availableMetricsTried: triedMetrics,
      metricLabel: attempt.metricLabel,
      time: latest.time ?? null,
      mvrv,
      realizedCapUsd,
      marketCapUsd,
      valuationState,
      notes: getContextNotes(valuationState),
      message: "MVRV valuation context loaded from Coin Metrics.",
      error: false,
    }),
  };
}

export function createOnchainErrorResponse(
  coinId: string,
  message: string,
): OnchainValuationData {
  return createBaseResponse(coinId, null, {
    upstreamMessage: message,
    notes: [message, "MVRV is cycle context only and is not a standalone trading signal."],
    message,
    error: true,
  });
}

export async function getOnchainValuation(
  coinId: string,
): Promise<OnchainValuationData> {
  const normalizedCoinId = coinId.toLowerCase();
  const asset = assetMapping[normalizedCoinId] ?? null;

  if (!asset) {
    return createBaseResponse(normalizedCoinId, null);
  }

  const triedMetrics: string[] = [];
  let lastAttempt: AttemptResult | null = null;

  for (const attempt of metricAttempts) {
    const metricSet = attempt.metrics.join(",");
    triedMetrics.push(metricSet);
    const attemptResult = await tryMetricSet(
      normalizedCoinId,
      asset,
      attempt,
      [...triedMetrics],
    );

    if (attemptResult.result) {
      return attemptResult.result;
    }

    lastAttempt = attemptResult;

  }

  if (lastAttempt?.upstreamStatus !== 200 || lastAttempt?.upstreamMessage) {
    console.warn("Coin Metrics MVRV data unavailable", {
      coinId: normalizedCoinId,
      asset,
      upstreamStatus: lastAttempt?.upstreamStatus ?? null,
      upstreamMessage: lastAttempt?.upstreamMessage ?? null,
    });
  }

  if (lastAttempt?.upstreamStatus === 403) {
    return createBaseResponse(normalizedCoinId, asset, {
      attemptedUrl: lastAttempt.attemptedUrl,
      upstreamStatus: lastAttempt.upstreamStatus,
      upstreamMessage: lastAttempt.upstreamMessage,
      availableMetricsTried: triedMetrics,
      notes: [
        "MVRV requires realized-cap data.",
        "The provider returned 403 for the requested metric.",
        "This panel is treated as optional context and not included as a standalone signal.",
      ],
      message: PROVIDER_LIMITED_MESSAGE,
      error: false,
    });
  }

  return createBaseResponse(normalizedCoinId, asset, {
    attemptedUrl: lastAttempt?.attemptedUrl ?? null,
    upstreamStatus: lastAttempt?.upstreamStatus ?? null,
    upstreamMessage: lastAttempt?.upstreamMessage ?? null,
    availableMetricsTried: triedMetrics,
    message: lastAttempt?.upstreamMessage ?? UNAVAILABLE_MESSAGE,
    error: Boolean(
      lastAttempt?.upstreamMessage &&
        lastAttempt.upstreamMessage !==
          "Coin Metrics returned no data for the requested asset/metrics." &&
        lastAttempt.upstreamMessage !==
          "Coin Metrics returned data without a usable MVRV value.",
    ),
  });
}
