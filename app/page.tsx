"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, ShieldAlert, TriangleAlert, BrainCircuit, Layers3, BookOpen, Target, PlusCircle, CheckCircle, AlertCircle } from "lucide-react";
import AiSummary from "@/components/AiSummary";
import CoinSelector from "@/components/CoinSelector";
import DefiFundamentals from "@/components/DefiFundamentals";
import MacroSentimentPanel from "@/components/MacroSentimentPanel";
import MarketSnapshot from "@/components/MarketSnapshot";
import NewsSentimentPanel from "@/components/NewsSentimentPanel";
import OnchainValuation from "@/components/OnchainValuation";
import PriceChart from "@/components/PriceChart";
import ScoreCard from "@/components/ScoreCard";
import TechnicalOutlook from "@/components/TechnicalOutlook";
import { calculateRealizedVolatility } from "@/lib/analytics";
import { generateScenarioForecast } from "@/lib/forecast";
import { calculateResearchScore } from "@/lib/scoring";
import { calculateTechnicalMetrics } from "@/lib/technical";
import {
  CUSTOM_WATCHLIST_STORAGE_KEY,
  DEFAULT_COIN_ID,
  defaultWatchlist,
} from "@/lib/watchlist";
import type {
  DefiFundamentalsData,
  MacroSentimentData,
  MarketApiError,
  MarketApiResponse,
  NewsSentimentData,
  OnchainValuationData,
  WatchlistCoin,
} from "@/types/crypto";

function isMarketApiError(
  data: MarketApiResponse | MarketApiError,
): data is MarketApiError {
  return "error" in data && data.error === true;
}

function isStoredCustomCoin(value: unknown): value is WatchlistCoin {
  if (!value || typeof value !== "object") {
    return false;
  }

  const coin = value as Partial<WatchlistCoin>;

  return (
    typeof coin.coinId === "string" &&
    /^[a-z0-9-]+$/.test(coin.coinId) &&
    typeof coin.symbol === "string" &&
    coin.symbol.length > 0 &&
    typeof coin.name === "string" &&
    coin.name.length > 0
  );
}

export default function Home() {
  const [selectedCoinId, setSelectedCoinId] = useState(DEFAULT_COIN_ID);
  const [customCoins, setCustomCoins] = useState<WatchlistCoin[]>([]);
  const [hasLoadedCustomCoins, setHasLoadedCustomCoins] = useState(false);
  const [customCoinInput, setCustomCoinInput] = useState("");
  const [customCoinMessage, setCustomCoinMessage] = useState<string | null>(null);
  const [customCoinError, setCustomCoinError] = useState<string | null>(null);
  const [isAddingCoin, setIsAddingCoin] = useState(false);
  const [marketData, setMarketData] = useState<MarketApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<MarketApiError | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [defiData, setDefiData] = useState<DefiFundamentalsData | null>(null);
  const [isDefiLoading, setIsDefiLoading] = useState(true);
  const [macroData, setMacroData] = useState<MacroSentimentData | null>(null);
  const [isMacroLoading, setIsMacroLoading] = useState(true);
  const [onchainData, setOnchainData] = useState<OnchainValuationData | null>(
    null,
  );
  const [isOnchainLoading, setIsOnchainLoading] = useState(true);
  const [newsData, setNewsData] = useState<NewsSentimentData | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const latestRequestId = useRef(0);
  const latestDefiRequestId = useRef(0);
  const latestOnchainRequestId = useRef(0);
  const latestNewsRequestId = useRef(0);
  const allCoins = useMemo(
    () => [...defaultWatchlist, ...customCoins],
    [customCoins],
  );
  const coin =
    allCoins.find((watchlistCoin) => watchlistCoin.coinId === selectedCoinId) ??
    defaultWatchlist[0];
  const currentMarket =
    marketData?.market.id === coin.coinId ? marketData.market : null;
  const realizedVolatility = useMemo(
    () => (marketData ? calculateRealizedVolatility(marketData.chart) : null),
    [marketData],
  );
  const technicalMetrics = useMemo(
    () => (marketData ? calculateTechnicalMetrics(marketData.chart) : null),
    [marketData],
  );
  const researchScore = useMemo(() => {
    if (!marketData) {
      return null;
    }

    const market = marketData.market;
    const score = calculateResearchScore(
      {
        change24h: market.priceChangePercentage24h,
        change7d: market.priceChangePercentage7d,
        change30d: market.priceChangePercentage30d,
        volumeToMarketCap:
          market.marketCap > 0 ? market.totalVolume / market.marketCap : 0,
        volatility30d: realizedVolatility ?? 60,
        athDrawdown: market.athChangePercentage,
        tvlChange30d:
          market.id === coin.coinId && defiData?.sourceAvailable
            ? defiData.tvlChange30d
            : undefined,
      },
      {
        macroData,
        newsData,
        onchainData,
      },
    );

    return {
      ...score,
      marketScore:
        realizedVolatility === null
          ? {
              ...score.marketScore,
              notes: [
                ...score.marketScore.notes,
                "Realized volatility is unavailable, so a neutral volatility score is used.",
              ],
            }
          : score.marketScore,
    };
  }, [
    coin.coinId,
    defiData,
    macroData,
    marketData,
    newsData,
    onchainData,
    realizedVolatility,
  ]);
  const technicalOutlook = useMemo(() => {
    if (!currentMarket || !researchScore || !technicalMetrics) {
      return null;
    }

    return {
      metrics: technicalMetrics,
      forecast: generateScenarioForecast({
        currentPrice: currentMarket.currentPrice,
        ema20: technicalMetrics.ema20,
        ema50: technicalMetrics.ema50,
        ema200: technicalMetrics.ema200,
        rsi14: technicalMetrics.rsi14,
        macd: technicalMetrics.macd,
        support: technicalMetrics.nearestSupport,
        resistance: technicalMetrics.nearestResistance,
        averageDailyMovePercent: technicalMetrics.averageDailyMovePercent,
        estimated7dMovePercent: technicalMetrics.estimated7dMovePercent,
        estimated30dMovePercent: technicalMetrics.estimated30dMovePercent,
        volumeTrend: technicalMetrics.volumeTrend,
        marketScore: researchScore.marketScore,
        contextScore: researchScore.contextScore,
      }),
    };
  }, [currentMarket, researchScore, technicalMetrics]);

  useEffect(() => {
    const defaultCoinIds = new Set(defaultWatchlist.map((watchlistCoin) => watchlistCoin.coinId));

    try {
      const savedCoins = JSON.parse(
        window.localStorage.getItem(CUSTOM_WATCHLIST_STORAGE_KEY) ?? "[]",
      ) as unknown;
      const uniqueIds = new Set<string>();
      const storedCoins = Array.isArray(savedCoins)
        ? savedCoins
            .filter(isStoredCustomCoin)
            .filter((savedCoin) => !defaultCoinIds.has(savedCoin.coinId))
            .filter((savedCoin) => {
              if (uniqueIds.has(savedCoin.coinId)) {
                return false;
              }

              uniqueIds.add(savedCoin.coinId);
              return true;
            })
            .map((savedCoin) => ({ ...savedCoin, isCustom: true }))
        : [];

      setCustomCoins(storedCoins);
    } catch {
      window.localStorage.removeItem(CUSTOM_WATCHLIST_STORAGE_KEY);
    } finally {
      setHasLoadedCustomCoins(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCustomCoins) {
      return;
    }

    try {
      window.localStorage.setItem(
        CUSTOM_WATCHLIST_STORAGE_KEY,
        JSON.stringify(
          customCoins.map(({ coinId, symbol, name }) => ({ coinId, symbol, name })),
        ),
      );
    } catch {
      setCustomCoinError("Unable to save custom coins in this browser.");
    }
  }, [customCoins, hasLoadedCustomCoins]);

  async function handleAddCustomCoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestedCoinId = customCoinInput.trim().toLowerCase();

    setCustomCoinError(null);
    setCustomCoinMessage(null);

    if (!requestedCoinId || !/^[a-z0-9-]+$/.test(requestedCoinId)) {
      setCustomCoinError("Coin not found. Please check the CoinGecko ID.");
      return;
    }

    if (allCoins.some((watchlistCoin) => watchlistCoin.coinId === requestedCoinId)) {
      setCustomCoinMessage("This coin is already in your watchlist.");
      return;
    }

    setIsAddingCoin(true);

    try {
      const response = await fetch(
        `/api/market?coinId=${encodeURIComponent(requestedCoinId)}&days=30`,
      );
      const data = (await response.json()) as MarketApiResponse | MarketApiError;

      if (!response.ok || isMarketApiError(data)) {
        if (response.status === 404) {
          setCustomCoinError("Coin not found. Please check the CoinGecko ID.");
        } else {
          setCustomCoinError(
            "Unable to validate this coin right now. Please try again shortly.",
          );
        }
        return;
      }

      if (allCoins.some((watchlistCoin) => watchlistCoin.coinId === data.market.id)) {
        setCustomCoinMessage("This coin is already in your watchlist.");
        return;
      }

      setCustomCoins((currentCoins) => [
        ...currentCoins,
        {
          coinId: data.market.id,
          symbol: data.market.symbol,
          name: data.market.name,
          isCustom: true,
        },
      ]);
      setCustomCoinInput("");
      setCustomCoinMessage(`${data.market.name} added to your local watchlist.`);
    } catch {
      setCustomCoinError(
        "Unable to validate this coin right now. Please try again shortly.",
      );
    } finally {
      setIsAddingCoin(false);
    }
  }

  function handleRemoveCustomCoin(coinId: string) {
    const removedCoin = customCoins.find((customCoin) => customCoin.coinId === coinId);

    setCustomCoins((currentCoins) =>
      currentCoins.filter((customCoin) => customCoin.coinId !== coinId),
    );

    if (selectedCoinId === coinId) {
      setOnchainData(null);
      setIsOnchainLoading(true);
      setSelectedCoinId(DEFAULT_COIN_ID);
    }

    setCustomCoinError(null);
    setCustomCoinMessage(
      removedCoin
        ? `${removedCoin.name} removed from your local watchlist.`
        : "Custom coin removed from your local watchlist.",
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;

    latestRequestId.current = requestId;

    async function fetchMarketData() {
      setIsLoading(true);
      setError(null);
      setWarning(null);

      try {
        const response = await fetch(`/api/market?coinId=${coin.coinId}&days=90`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as MarketApiResponse | MarketApiError;

        if (controller.signal.aborted || requestId !== latestRequestId.current) {
          return;
        }

        if (!response.ok || isMarketApiError(data)) {
          setError(
            isMarketApiError(data)
              ? data
              : {
                  error: true,
                  message: "CoinGecko request failed",
                  status: response.status,
                  detail: "Rate limited or unavailable",
                },
          );
          return;
        }

        setMarketData(data);
        setWarning(data.warning ?? null);
      } catch {
        if (controller.signal.aborted || requestId !== latestRequestId.current) {
          return;
        }

        setError({
          error: true,
          message: "Connection request failed",
          status: 0,
          detail: "Unable to reach the market data service",
        });
      } finally {
        if (!controller.signal.aborted && requestId === latestRequestId.current) {
          setIsLoading(false);
        }
      }
    }

    fetchMarketData();

    return () => controller.abort();
  }, [coin.coinId, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestDefiRequestId.current + 1;

    latestDefiRequestId.current = requestId;

    async function fetchDefiFundamentals() {
      setIsDefiLoading(true);
      setDefiData(null);

      try {
        const response = await fetch(`/api/defi?coinId=${coin.coinId}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as DefiFundamentalsData;

        if (controller.signal.aborted || requestId !== latestDefiRequestId.current) {
          return;
        }

        setDefiData(data);
      } catch {
        if (controller.signal.aborted || requestId !== latestDefiRequestId.current) {
          return;
        }

        setDefiData({
          sourceAvailable: false,
          label: coin.coinId,
          message: "DeFi fundamentals temporarily unavailable.",
          error: true,
        });
      } finally {
        if (!controller.signal.aborted && requestId === latestDefiRequestId.current) {
          setIsDefiLoading(false);
        }
      }
    }

    fetchDefiFundamentals();

    return () => controller.abort();
  }, [coin.coinId]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestNewsRequestId.current + 1;

    latestNewsRequestId.current = requestId;

    async function fetchNewsContext() {
      setIsNewsLoading(true);
      setNewsData(null);

      const search = new URLSearchParams({
        coinId: coin.coinId,
        symbol: coin.symbol,
        name: coin.name,
      });

      try {
        const response = await fetch(`/api/news?${search.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as NewsSentimentData;

        if (controller.signal.aborted || requestId !== latestNewsRequestId.current) {
          return;
        }

        setNewsData(data);
      } catch {
        if (controller.signal.aborted || requestId !== latestNewsRequestId.current) {
          return;
        }

        setNewsData({
          sourceAvailable: false,
          provider: "gdelt",
          query: "",
          attemptedUrls: [],
          upstreamStatus: null,
          upstreamMessage: "News request failed.",
          rawResultCount: 0,
          articles: [],
          sentimentLabel: "Unavailable",
          positiveCount: 0,
          negativeCount: 0,
          notes: ["Headline sentiment is heuristic and may be noisy."],
          message: "Recent headline context is temporarily unavailable.",
          error: true,
        });
      } finally {
        if (!controller.signal.aborted && requestId === latestNewsRequestId.current) {
          setIsNewsLoading(false);
        }
      }
    }

    fetchNewsContext();

    return () => controller.abort();
  }, [coin.coinId, coin.name, coin.symbol]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestOnchainRequestId.current + 1;

    latestOnchainRequestId.current = requestId;

    async function fetchOnchainValuation() {
      setIsOnchainLoading(true);
      setOnchainData(null);

      try {
        const response = await fetch(`/api/onchain?coinId=${coin.coinId}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as OnchainValuationData;

        if (controller.signal.aborted || requestId !== latestOnchainRequestId.current) {
          return;
        }

        setOnchainData(data);
      } catch {
        if (controller.signal.aborted || requestId !== latestOnchainRequestId.current) {
          return;
        }

        setOnchainData({
          sourceAvailable: false,
          provider: "coinmetrics",
          coinId: coin.coinId,
          asset: null,
          attemptedUrl: null,
          upstreamStatus: null,
          upstreamMessage: "On-chain valuation request failed.",
          availableMetricsTried: [],
          metricLabel: null,
          time: null,
          mvrv: null,
          realizedCapUsd: null,
          marketCapUsd: null,
          valuationState: "Unavailable",
          notes: ["MVRV is cycle context only and is not a standalone trading signal."],
          message: "MVRV unavailable for this asset or data source.",
          error: true,
        });
      } finally {
        if (!controller.signal.aborted && requestId === latestOnchainRequestId.current) {
          setIsOnchainLoading(false);
        }
      }
    }

    fetchOnchainValuation();

    return () => controller.abort();
  }, [coin.coinId]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMacroContext() {
      setIsMacroLoading(true);

      try {
        const response = await fetch("/api/macro", {
          signal: controller.signal,
        });
        const data = (await response.json()) as MacroSentimentData;

        if (!controller.signal.aborted) {
          setMacroData(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setMacroData({
            sourceAvailable: false,
            regime: "Unavailable",
            notes: ["Macro and sentiment context is temporarily unavailable."],
            message: "Macro and sentiment context is temporarily unavailable.",
            error: true,
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsMacroLoading(false);
        }
      }
    }

    fetchMacroContext();

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f5f7fa] via-[#e4e8ec] to-[#d9dee3] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header Section */}
        <header className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 blur-3xl -z-10" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-white/40">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 icon-container">
                  <BrainCircuit className="text-white" size={24} />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.3em] gradient-text-cyan">
                  Research Workspace
                </p>
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                <span className="gradient-text">Crypto AI Research</span>
                <br />
                <span className="text-slate-700">Dashboard</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Professional-grade market intelligence platform combining live data, 
                on-chain analytics, sentiment analysis, and AI-powered insights.
              </p>
              
              {/* Data Sources Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { name: "CoinGecko", color: "from-emerald-500 to-teal-500" },
                  { name: "DeFiLlama", color: "from-blue-500 to-indigo-500" },
                  { name: "Alternative.me", color: "from-purple-500 to-violet-500" },
                  { name: "GDELT", color: "from-orange-500 to-amber-500" },
                  { name: "Coin Metrics", color: "from-pink-500 to-rose-500" },
                  { name: "Gemini AI", color: "from-cyan-500 to-blue-500" },
                ].map((source) => (
                  <span 
                    key={source.name} 
                    className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${source.color} bg-opacity-10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-md`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    {source.name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 lg:flex-col">
              <Link
                href="/compare"
                className="group inline-flex items-center gap-2 rounded-xl border border-purple-400/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-5 py-3 text-sm font-semibold text-purple-700 transition-all hover:border-purple-300/50 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-lg hover:shadow-purple-500/20 card-hover glass-card"
              >
                <Layers3 size={18} />
                Compare Coins
              </Link>
              <Link
                href="/methodology"
                className="group inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-5 py-3 text-sm font-semibold text-cyan-700 transition-all hover:border-cyan-300/50 hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-lg hover:shadow-cyan-500/20 card-hover glass-card"
              >
                <BookOpen size={18} />
                Methodology Guide
              </Link>
            </div>
          </div>
        </header>

        {/* Disclaimer Banner */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-orange-400/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5 p-5 text-sm leading-6 text-orange-800 glass-card glow-orange">
          <ShieldAlert className="mt-0.5 shrink-0 text-orange-600" size={20} />
          <div>
            <p className="font-semibold text-orange-700">Important Disclaimer</p>
            <p className="mt-1 text-orange-600/80">
              This is a research assistant tool only, not financial advice. All outputs provide market context
              and analytical insights — they are not standalone trading signals or investment recommendations.
            </p>
          </div>
        </div>

        {/* Asset Selection Panel */}
        <section className="mb-8 rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 p-5 sm:p-6 glow-blue backdrop-blur-xl glass-card">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-cyan-600" size={18} />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-600">
                  Research Universe
                </p>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Select an Asset</h2>
              <p className="mt-1 text-sm text-slate-600">
                Load one asset at a time to keep external requests measured and reliable.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={isLoading}
              className="group shrink-0 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:border-cyan-300/50 hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 card-hover glass-card"
            >
              <LoaderCircle className={`transition-transform ${isLoading ? 'animate-spin' : ''}`} size={18} />
              Refresh Data
            </button>
          </div>
          <CoinSelector
            coins={allCoins}
            selectedCoinId={coin.coinId}
            onSelectCoin={(nextCoinId) => {
              if (nextCoinId !== coin.coinId) {
                setOnchainData(null);
                setIsOnchainLoading(true);
                setSelectedCoinId(nextCoinId);
              }
            }}
            onRemoveCoin={handleRemoveCustomCoin}
          />
          <div className="mt-6 border-t border-white/40 pt-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PlusCircle className="text-emerald-600" size={16} />
              Add Custom Coin
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Use the CoinGecko coin ID, not ticker symbol. For example: chainlink,
              aave, or render-token.
            </p>
            <form
              onSubmit={handleAddCustomCoin}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <label htmlFor="custom-coin-id" className="sr-only">
                CoinGecko coin ID
              </label>
              <input
                id="custom-coin-id"
                type="text"
                value={customCoinInput}
                onChange={(event) => setCustomCoinInput(event.target.value)}
                placeholder="chainlink"
                disabled={isAddingCoin}
                className="w-full rounded-xl border border-white/50 bg-white/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:max-w-xs disabled:cursor-not-allowed disabled:opacity-60 glass-panel"
              />
              <button
                type="submit"
                disabled={isAddingCoin}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:border-cyan-300/50 hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 card-hover glass-card"
              >
                {isAddingCoin && <LoaderCircle className="animate-spin" size={16} />}
                {isAddingCoin ? "Checking..." : "Add Coin"}
              </button>
            </form>
            {customCoinMessage && (
              <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle size={16} />
                {customCoinMessage}
              </p>
            )}
            {customCoinError && (
              <p className="mt-3 flex items-center gap-2 text-sm text-rose-700">
                <AlertCircle size={16} />
                {customCoinError}
              </p>
            )}
          </div>
        </section>

        {/* Dashboard Grid - Main Content */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Loading States */}
          {isLoading && !marketData && (
            <section className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 p-5 text-slate-600 lg:col-span-2 backdrop-blur-xl glass-card">
              <LoaderCircle className="animate-spin text-cyan-600" size={20} />
              <span>Loading live market data for <span className="font-semibold text-cyan-700">{coin.name}</span>...</span>
            </section>
          )}

          {isLoading && marketData && (
            <section className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 p-4 text-sm text-slate-600 lg:col-span-2 backdrop-blur-xl glass-card">
              <LoaderCircle className="animate-spin text-cyan-600" size={18} />
              Refreshing {coin.name} market data. Last successful result remains visible.
            </section>
          )}

          {warning && !isLoading && (
            <section className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-4 text-sm text-amber-800 lg:col-span-2 backdrop-blur-xl glass-card">
              <TriangleAlert className="mt-0.5 shrink-0 text-amber-600" size={18} />
              <div>
                <p className="font-medium text-amber-700">Using cached market context</p>
                <p className="mt-1 text-amber-600/80">{warning}</p>
              </div>
            </section>
          )}

          {error && !isLoading && (
            <section className="flex flex-col items-start gap-4 rounded-2xl border border-rose-400/20 bg-gradient-to-r from-rose-500/5 to-orange-500/5 p-5 lg:col-span-2 sm:flex-row sm:items-center backdrop-blur-xl glass-card">
              <TriangleAlert className="text-rose-600" size={24} />
              <div className="flex-1 space-y-1 text-sm text-slate-600">
                <p className="font-medium text-rose-700">Market data update unavailable</p>
                <p>
                  Market data failed to load. Status: {error.status || "Network"}. Reason:{" "}
                  {error.detail}
                </p>
                {marketData && (
                  <p className="text-slate-500">
                    Showing the last successfully loaded market data below.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="rounded-xl border border-white/50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 glass-card card-hover"
              >
                Try again
              </button>
            </section>
          )}

          {/* Main Dashboard Panels */}
          {marketData && researchScore && (
            <>
              <MarketSnapshot market={marketData.market} />
              <ScoreCard score={researchScore} realizedVolatility={realizedVolatility} />
              <PriceChart symbol={marketData.market.symbol} data={marketData.chart} />
              <TechnicalOutlook data={technicalOutlook} />
            </>
          )}

          {/* Context Panels */}
          <MacroSentimentPanel data={macroData} isLoading={isMacroLoading} />
          <NewsSentimentPanel data={newsData} isLoading={isNewsLoading} />
          <DefiFundamentals data={defiData} isLoading={isDefiLoading} />
          <OnchainValuation data={onchainData} isLoading={isOnchainLoading} />
          
          {/* AI Summary Panel - Full Width */}
          <div className="lg:col-span-2">
            <AiSummary
              coin={coin}
              marketData={currentMarket}
              scoring={currentMarket ? researchScore : null}
              defiData={defiData}
              macroData={macroData}
              onchainData={onchainData}
              newsData={newsData}
              technicalOutlook={technicalOutlook}
              realizedVolatility={currentMarket ? realizedVolatility : null}
              canGenerate={Boolean(
                currentMarket &&
                  researchScore &&
                  technicalOutlook &&
                  defiData &&
                  macroData &&
                  !isDefiLoading &&
                  !isMacroLoading,
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/40 pt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              CoinGecko
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              DeFiLlama
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Alternative.me
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              GDELT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
              Coin Metrics
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Gemini AI
            </span>
          </div>
          <p className="text-xs leading-6 text-slate-500">
            Research assistant tool only. All data is for informational purposes and should not be 
            considered as financial advice or investment recommendations.
          </p>
        </footer>
      </div>
    </main>
  );
}
