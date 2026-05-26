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

export type MacroRegime =
  | "Risk-on"
  | "Neutral"
  | "Risk-off"
  | "Mixed"
  | "Unavailable";

export interface MacroSentimentData {
  sourceAvailable: boolean;
  totalCryptoMarketCap?: number;
  totalCryptoVolume?: number;
  btcDominance?: number;
  ethDominance?: number;
  marketCapChange24h?: number;
  fearGreedValue?: number;
  fearGreedClassification?: string;
  fearGreedTimestamp?: string;
  regime: MacroRegime;
  notes: string[];
  error?: boolean;
  message?: string;
}

export type OnchainValuationState =
  | "Undervalued/Capitulation Zone"
  | "Neutral"
  | "Elevated"
  | "Overheated"
  | "Unavailable";

export interface OnchainValuationData {
  sourceAvailable: boolean;
  provider: "coinmetrics";
  coinId: string;
  asset: string | null;
  attemptedUrl: string | null;
  upstreamStatus: number | null;
  upstreamMessage: string | null;
  availableMetricsTried: string[];
  metricLabel: string | null;
  time: string | null;
  mvrv: number | null;
  realizedCapUsd: number | null;
  marketCapUsd: number | null;
  valuationState: OnchainValuationState;
  notes: string[];
  message: string;
  error: boolean;
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
  macroData: MacroSentimentData;
  onchainData: OnchainValuationData;
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
