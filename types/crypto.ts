export interface HistoricalChartPoint {
  date: string;
  price: number;
  marketCap?: number;
  volume?: number;
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  currentPrice: number;
  marketCap: number;
  totalVolume: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  ath: number;
  athChangePercentage: number;
}

export interface MarketApiResponse {
  market: MarketData;
  chart: HistoricalChartPoint[];
  stale?: boolean;
  warning?: string;
}

export interface MarketApiError {
  error: true;
  message: string;
  status: number;
  detail: string;
}

export interface DefiFundamentalsData {
  sourceAvailable: boolean;
  label: string;
  tvl?: number;
  tvlChange1d?: number;
  tvlChange7d?: number;
  tvlChange30d?: number;
  message?: string;
  error?: boolean;
}

export interface AiSummaryRequest {
  coin: {
    id: string;
    symbol: string;
    name: string;
  };
  marketData: {
    currentPrice: number;
    marketCap: number;
    totalVolume: number;
    priceChangePercentage24h: number;
    priceChangePercentage7d: number;
    priceChangePercentage30d: number;
    ath: number;
    athChangePercentage: number;
    volatility30d: number | null;
  };
  scoring: ScoringResult;
  defiData: DefiFundamentalsData;
}

export interface AiSummaryResponse {
  summary: string;
  generatedAt: string;
  provider: "gemini";
  model: string;
}

export interface AiSummaryError {
  error: true;
  code?: string;
  message: string;
}

export interface ScoringInput {
  change24h: number;
  change7d: number;
  change30d: number;
  volumeToMarketCap: number;
  volatility30d: number;
  athDrawdown: number;
  tvlChange30d?: number;
}

export type ResearchVerdict =
  | "Strong"
  | "Constructive"
  | "Neutral"
  | "Weak"
  | "High Risk";

export interface ScoringResult {
  totalScore: number;
  trendScore: number;
  liquidityScore: number;
  volatilityScore: number;
  drawdownScore: number;
  fundamentalScore: number;
  verdict: ResearchVerdict;
  notes: string[];
}

export interface WatchlistCoin {
  coinId: string;
  symbol: string;
  name: string;
  isCustom?: boolean;
}
