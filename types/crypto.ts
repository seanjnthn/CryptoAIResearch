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

export type NewsSentimentLabel =
  | "Positive"
  | "Neutral"
  | "Negative"
  | "Mixed"
  | "Unavailable";

export interface NewsArticle {
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  language: string | null;
  domain: string | null;
}

export interface NewsSentimentData {
  sourceAvailable: boolean;
  provider: "gdelt";
  query: string;
  attemptedUrls: string[];
  upstreamStatus: number | null;
  upstreamMessage: string | null;
  rawResultCount: number;
  articles: NewsArticle[];
  sentimentLabel: NewsSentimentLabel;
  positiveCount: number;
  negativeCount: number;
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
  newsData: NewsSentimentData;
  technicalOutlook: TechnicalOutlookData;
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

export interface MarketScoreInput {
  change24h: number;
  change7d: number;
  change30d: number;
  volumeToMarketCap: number;
  volatility30d: number;
  athDrawdown: number;
  tvlChange30d?: number;
}

export interface ContextScoreInput {
  macroData?: MacroSentimentData | null;
  newsData?: NewsSentimentData | null;
  onchainData?: OnchainValuationData | null;
}

export type MarketVerdict =
  | "Strong"
  | "Constructive"
  | "Neutral"
  | "Weak"
  | "High Risk";

export interface MarketScoreResult {
  totalScore: number;
  trendScore: number;
  liquidityScore: number;
  volatilityScore: number;
  drawdownScore: number;
  fundamentalScore: number;
  verdict: MarketVerdict;
  notes: string[];
}

export type ContextVerdict =
  | "Supportive"
  | "Neutral"
  | "Mixed"
  | "Risky"
  | "Unavailable";

export interface ContextScoreResult {
  totalScore: number;
  macroScore: number;
  fearGreedScore: number;
  newsScore: number;
  onchainScore: number;
  verdict: ContextVerdict;
  notes: string[];
}

export type CompositeResearchLabel =
  | "Constructive"
  | "Neutral"
  | "Mixed"
  | "Caution"
  | "High Risk";

export interface CompositeResearchView {
  label: CompositeResearchLabel;
  explanation: string;
}

export interface ScoringResult {
  marketScore: MarketScoreResult;
  contextScore: ContextScoreResult;
  compositeView: CompositeResearchView;
}

export interface TechnicalMacd {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export type VolumeTrend = "rising" | "falling" | "flat" | "unavailable";

export interface TechnicalMetrics {
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  macd: TechnicalMacd | null;
  averageDailyMovePercent: number | null;
  estimated7dMovePercent: number | null;
  estimated30dMovePercent: number | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
  volumeTrend: VolumeTrend;
  notes: string[];
}

export type TechnicalOutlookLabel =
  | "Bullish bias"
  | "Neutral / range-bound"
  | "Bearish bias"
  | "Mixed / volatile";

export type TechnicalConfidence = "Low" | "Medium" | "High";

export interface ScenarioRange {
  rangeLow: number;
  rangeHigh: number;
  condition: string;
}

export interface ScenarioForecast {
  outlookLabel: TechnicalOutlookLabel;
  confidence: TechnicalConfidence;
  trendSummary: string;
  momentumSummary: string;
  volatilitySummary: string;
  supportResistanceSummary: string;
  bullScenario: ScenarioRange;
  baseScenario: ScenarioRange;
  bearScenario: ScenarioRange;
  invalidationLevel?: number;
  notes: string[];
}

export interface TechnicalOutlookData {
  metrics: TechnicalMetrics;
  forecast: ScenarioForecast;
}

export interface WatchlistCoin {
  coinId: string;
  symbol: string;
  name: string;
  isCustom?: boolean;
}
