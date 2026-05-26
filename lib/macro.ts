import "server-only";

import { requestCoinGecko } from "@/lib/coingecko";
import type { MacroRegime, MacroSentimentData } from "@/types/crypto";

const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1&format=json";
const STRONG_MARKET_MOVE = 2;

interface CoinGeckoGlobalResponse {
  data?: {
    total_market_cap?: { usd?: number | null };
    total_volume?: { usd?: number | null };
    market_cap_percentage?: {
      btc?: number | null;
      eth?: number | null;
    };
    market_cap_change_percentage_24h_usd?: number | null;
  };
}

interface FearGreedResponse {
  data?: Array<{
    value?: string;
    value_classification?: string;
    timestamp?: string;
  }>;
}

interface GlobalMetrics {
  totalCryptoMarketCap?: number;
  totalCryptoVolume?: number;
  btcDominance?: number;
  ethDominance?: number;
  marketCapChange24h?: number;
}

interface SentimentMetrics {
  fearGreedValue?: number;
  fearGreedClassification?: string;
  fearGreedTimestamp?: string;
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseNumber(value: string | undefined) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

async function getGlobalMetrics(): Promise<GlobalMetrics> {
  const response = await requestCoinGecko<CoinGeckoGlobalResponse>("/global");
  const data = response.data;

  return {
    totalCryptoMarketCap: numberOrUndefined(data?.total_market_cap?.usd),
    totalCryptoVolume: numberOrUndefined(data?.total_volume?.usd),
    btcDominance: numberOrUndefined(data?.market_cap_percentage?.btc),
    ethDominance: numberOrUndefined(data?.market_cap_percentage?.eth),
    marketCapChange24h: numberOrUndefined(
      data?.market_cap_change_percentage_24h_usd,
    ),
  };
}

async function getFearGreedMetrics(): Promise<SentimentMetrics> {
  const response = await fetch(FEAR_GREED_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Alternative.me request returned status ${response.status}.`);
  }

  const responseData = (await response.json()) as FearGreedResponse;
  const currentReading = responseData.data?.[0];
  const fearGreedValue = parseNumber(currentReading?.value);
  const timestamp = parseNumber(currentReading?.timestamp);

  if (fearGreedValue === undefined) {
    throw new Error("Alternative.me returned no current Fear & Greed reading.");
  }

  return {
    fearGreedValue,
    fearGreedClassification: currentReading?.value_classification,
    fearGreedTimestamp:
      timestamp === undefined ? undefined : new Date(timestamp * 1000).toISOString(),
  };
}

function hasGlobalMetrics(metrics: GlobalMetrics) {
  return Object.values(metrics).some((value) => value !== undefined);
}

function determineRegime(
  marketCapChange24h: number | undefined,
  fearGreedValue: number | undefined,
  notes: string[],
): MacroRegime {
  const stronglyPositive =
    marketCapChange24h !== undefined && marketCapChange24h >= STRONG_MARKET_MOVE;
  const stronglyNegative =
    marketCapChange24h !== undefined && marketCapChange24h <= -STRONG_MARKET_MOVE;
  const extremeFear = fearGreedValue !== undefined && fearGreedValue <= 25;
  const extremeGreed = fearGreedValue !== undefined && fearGreedValue >= 75;

  if (extremeGreed) {
    notes.push("Fear & Greed indicates elevated greed; sentiment may be overheated.");
  }

  if (extremeFear) {
    notes.push("Fear & Greed indicates elevated fear; sentiment may reflect market stress.");
  }

  if (stronglyPositive) {
    notes.push("Total crypto market cap has moved strongly higher over the last 24 hours.");
  }

  if (stronglyNegative) {
    notes.push("Total crypto market cap has moved strongly lower over the last 24 hours.");
  }

  if (
    (stronglyPositive && extremeFear) ||
    (stronglyNegative && extremeGreed)
  ) {
    notes.push("Market direction and sentiment signals conflict, so context is mixed.");
    return "Mixed";
  }

  if (stronglyNegative || extremeFear) {
    return "Risk-off";
  }

  if (
    stronglyPositive &&
    fearGreedValue !== undefined &&
    !extremeFear &&
    !extremeGreed
  ) {
    return "Risk-on";
  }

  if (extremeGreed) {
    return "Mixed";
  }

  if (marketCapChange24h === undefined && fearGreedValue === undefined) {
    return "Unavailable";
  }

  if (stronglyPositive && fearGreedValue === undefined) {
    notes.push("Sentiment data is missing, so a risk-on label is not assigned.");
  }

  return "Neutral";
}

export async function getMacroSentimentContext(): Promise<MacroSentimentData> {
  const notes: string[] = [];
  const [globalResult, sentimentResult] = await Promise.allSettled([
    getGlobalMetrics(),
    getFearGreedMetrics(),
  ]);

  const globalMetrics =
    globalResult.status === "fulfilled" ? globalResult.value : {};
  const sentimentMetrics =
    sentimentResult.status === "fulfilled" ? sentimentResult.value : {};

  if (globalResult.status === "rejected") {
    console.error("CoinGecko global macro request failed", {
      message:
        globalResult.reason instanceof Error
          ? globalResult.reason.message
          : "Unknown CoinGecko global error",
    });
    notes.push("Global crypto market metrics are temporarily unavailable.");
  }

  if (sentimentResult.status === "rejected") {
    console.error("Alternative.me Fear & Greed request failed", {
      message:
        sentimentResult.reason instanceof Error
          ? sentimentResult.reason.message
          : "Unknown sentiment data error",
    });
    notes.push("Fear & Greed sentiment data is temporarily unavailable.");
  }

  const sourceAvailable =
    hasGlobalMetrics(globalMetrics) ||
    sentimentMetrics.fearGreedValue !== undefined;
  const regime = determineRegime(
    globalMetrics.marketCapChange24h,
    sentimentMetrics.fearGreedValue,
    notes,
  );

  if (sourceAvailable && notes.length === 0) {
    notes.push("Macro and sentiment readings are contextual inputs, not trade signals.");
  }

  return {
    sourceAvailable,
    ...globalMetrics,
    ...sentimentMetrics,
    regime,
    notes,
    ...(sourceAvailable
      ? {}
      : {
          error: true,
          message: "Macro and sentiment context is temporarily unavailable.",
        }),
  };
}
