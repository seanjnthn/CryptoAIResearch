import "server-only";

import type { HistoricalChartPoint, MarketData } from "@/types/crypto";

const DEMO_BASE_URL = "https://api.coingecko.com/api/v3";
const PRO_BASE_URL = "https://pro-api.coingecko.com/api/v3";
const PLACEHOLDER_API_KEYS = new Set([
  "your_key_here",
  "your_real_coingecko_key",
  "your_coingecko_demo_key_here",
  "demo",
  "actual_key_here",
]);

type CoinGeckoPlan = "demo" | "pro";

interface CoinGeckoMarketResponse {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
  price_change_percentage_24h?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  ath?: number | null;
  ath_change_percentage?: number | null;
}

interface CoinGeckoChartResponse {
  prices?: Array<[number, number]>;
  market_caps?: Array<[number, number]>;
  total_volumes?: Array<[number, number]>;
}

export class CoinGeckoError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super("CoinGecko request failed");
    this.name = "CoinGeckoError";
    this.status = status;
    this.detail = detail;
  }
}

function isUsableApiKey(apiKey: string | undefined): apiKey is string {
  if (!apiKey) {
    return false;
  }

  const normalizedKey = apiKey.trim().toLowerCase();

  return (
    normalizedKey.length > 0 &&
    !PLACEHOLDER_API_KEYS.has(normalizedKey) &&
    !normalizedKey.startsWith("your_")
  );
}

function getCoinGeckoConfig() {
  const configuredPlan = process.env.COINGECKO_API_PLAN?.trim().toLowerCase();
  const plan: CoinGeckoPlan = configuredPlan === "pro" ? "pro" : "demo";
  const apiKey = process.env.COINGECKO_API_KEY?.trim();

  return {
    baseUrl: plan === "pro" ? PRO_BASE_URL : DEMO_BASE_URL,
    headers: isUsableApiKey(apiKey)
      ? { [plan === "pro" ? "x-cg-pro-api-key" : "x-cg-demo-api-key"]: apiKey }
      : undefined,
  };
}

function getFailureDetail(status: number) {
  if (status === 401) {
    return "Invalid or unauthorized CoinGecko API key.";
  }

  if (status === 403) {
    return "CoinGecko access forbidden.";
  }

  if (status === 404) {
    return "Coin not found or unavailable.";
  }

  if (status === 429) {
    return "CoinGecko rate limit reached. Please wait or reduce requests.";
  }

  if (status === 502 || status === 503) {
    return "CoinGecko service temporarily unavailable.";
  }

  return "CoinGecko request failed.";
}

async function requestCoinGecko<T>(path: string): Promise<T> {
  const config = getCoinGeckoConfig();
  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      headers: config.headers,
      cache: "no-store",
    });
  } catch {
    throw new CoinGeckoError(502, getFailureDetail(502));
  }

  if (!response.ok) {
    throw new CoinGeckoError(response.status, getFailureDetail(response.status));
  }

  return response.json() as Promise<T>;
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function getCoinMarketData(coinId: string): Promise<MarketData> {
  const search = new URLSearchParams({
    vs_currency: "usd",
    ids: coinId,
    price_change_percentage: "24h,7d,30d",
  });
  const results = await requestCoinGecko<CoinGeckoMarketResponse[]>(
    `/coins/markets?${search.toString()}`,
  );
  const coin = results[0];

  if (!coin) {
    throw new CoinGeckoError(404, getFailureDetail(404));
  }

  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image,
    currentPrice: safeNumber(coin.current_price),
    marketCap: safeNumber(coin.market_cap),
    totalVolume: safeNumber(coin.total_volume),
    priceChangePercentage24h: safeNumber(coin.price_change_percentage_24h),
    priceChangePercentage7d: safeNumber(coin.price_change_percentage_7d_in_currency),
    priceChangePercentage30d: safeNumber(coin.price_change_percentage_30d_in_currency),
    ath: safeNumber(coin.ath),
    athChangePercentage: safeNumber(coin.ath_change_percentage),
  };
}

export async function getCoinHistoricalChart(
  coinId: string,
  days: number,
): Promise<HistoricalChartPoint[]> {
  const search = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
  });
  const data = await requestCoinGecko<CoinGeckoChartResponse>(
    `/coins/${encodeURIComponent(coinId)}/market_chart?${search.toString()}`,
  );

  return (data.prices ?? []).map(([timestamp, price], index) => ({
    date: new Date(timestamp).toISOString(),
    price: safeNumber(price),
    marketCap: safeNumber(data.market_caps?.[index]?.[1]),
    volume: safeNumber(data.total_volumes?.[index]?.[1]),
  }));
}
