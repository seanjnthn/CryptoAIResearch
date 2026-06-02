"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, LoaderCircle, ShieldAlert } from "lucide-react";
import CompareCoinSelector from "@/components/CompareCoinSelector";
import CompareTable, { type CompareTableRow } from "@/components/CompareTable";
import { calculateRealizedVolatility } from "@/lib/analytics";
import { calculateResearchScore } from "@/lib/scoring";
import {
  CUSTOM_WATCHLIST_STORAGE_KEY,
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

interface CompareCoinState {
  coin: WatchlistCoin;
  marketData: MarketApiResponse | null;
  defiData: DefiFundamentalsData | null;
  onchainData: OnchainValuationData | null;
  newsData: NewsSentimentData | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_COMPARE_COIN_IDS = ["bitcoin", "ethereum", "solana"];

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

function getUnavailableMacro(): MacroSentimentData {
  return {
    sourceAvailable: false,
    regime: "Unavailable",
    notes: ["Macro and sentiment context is temporarily unavailable."],
    message: "Macro and sentiment context is temporarily unavailable.",
    error: true,
  };
}

async function fetchOptionalJson<T>(url: string, signal: AbortSignal) {
  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchCompareCoin(
  coin: WatchlistCoin,
  signal: AbortSignal,
): Promise<CompareCoinState> {
  try {
    const marketResponse = await fetch(
      `/api/market?coinId=${encodeURIComponent(coin.coinId)}&days=30`,
      { signal },
    );
    const marketData = (await marketResponse.json()) as
      | MarketApiResponse
      | MarketApiError;

    if (!marketResponse.ok || isMarketApiError(marketData)) {
      return {
        coin,
        marketData: null,
        defiData: null,
        onchainData: null,
        newsData: null,
        isLoading: false,
        error: isMarketApiError(marketData)
          ? marketData.detail
          : "Market data unavailable.",
      };
    }

    const newsParams = new URLSearchParams({
      coinId: coin.coinId,
      symbol: coin.symbol,
      name: coin.name,
    });

    const [defiData, onchainData, newsData] = await Promise.all([
      fetchOptionalJson<DefiFundamentalsData>(
        `/api/defi?coinId=${encodeURIComponent(coin.coinId)}`,
        signal,
      ),
      fetchOptionalJson<OnchainValuationData>(
        `/api/onchain?coinId=${encodeURIComponent(coin.coinId)}`,
        signal,
      ),
      fetchOptionalJson<NewsSentimentData>(`/api/news?${newsParams.toString()}`, signal),
    ]);

    return {
      coin,
      marketData,
      defiData,
      onchainData,
      newsData,
      isLoading: false,
      error: null,
    };
  } catch {
    return {
      coin,
      marketData: null,
      defiData: null,
      onchainData: null,
      newsData: null,
      isLoading: false,
      error: "Comparison data unavailable.",
    };
  }
}

export default function ComparePage() {
  const [customCoins, setCustomCoins] = useState<WatchlistCoin[]>([]);
  const [selectedCoinIds, setSelectedCoinIds] = useState(DEFAULT_COMPARE_COIN_IDS);
  const [macroData, setMacroData] = useState<MacroSentimentData | null>(null);
  const [isMacroLoading, setIsMacroLoading] = useState(true);
  const [coinStates, setCoinStates] = useState<Record<string, CompareCoinState>>(
    {},
  );
  const latestRequestId = useRef(0);

  const allCoins = useMemo(
    () => [...defaultWatchlist, ...customCoins],
    [customCoins],
  );
  const selectedCoins = useMemo(
    () =>
      selectedCoinIds
        .map((coinId) => allCoins.find((coin) => coin.coinId === coinId))
        .filter((coin): coin is WatchlistCoin => Boolean(coin)),
    [allCoins, selectedCoinIds],
  );
  const selectedKey = selectedCoinIds.join("|");

  useEffect(() => {
    const defaultCoinIds = new Set(defaultWatchlist.map((coin) => coin.coinId));

    try {
      const savedCoins = JSON.parse(
        window.localStorage.getItem(CUSTOM_WATCHLIST_STORAGE_KEY) ?? "[]",
      ) as unknown;
      const uniqueIds = new Set<string>();
      const storedCoins = Array.isArray(savedCoins)
        ? savedCoins
            .filter(isStoredCustomCoin)
            .filter((coin) => !defaultCoinIds.has(coin.coinId))
            .filter((coin) => {
              if (uniqueIds.has(coin.coinId)) {
                return false;
              }

              uniqueIds.add(coin.coinId);
              return true;
            })
            .map((coin) => ({ ...coin, isCustom: true }))
        : [];

      setCustomCoins(storedCoins);
    } catch {
      window.localStorage.removeItem(CUSTOM_WATCHLIST_STORAGE_KEY);
    }
  }, []);

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
          setMacroData(getUnavailableMacro());
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

  useEffect(() => {
    const controller = new AbortController();
    const requestId = latestRequestId.current + 1;

    latestRequestId.current = requestId;

    setCoinStates((currentStates) => {
      const nextStates: Record<string, CompareCoinState> = {};

      selectedCoins.forEach((coin) => {
        nextStates[coin.coinId] = {
          coin,
          marketData: currentStates[coin.coinId]?.marketData ?? null,
          defiData: currentStates[coin.coinId]?.defiData ?? null,
          onchainData: currentStates[coin.coinId]?.onchainData ?? null,
          newsData: currentStates[coin.coinId]?.newsData ?? null,
          isLoading: true,
          error: null,
        };
      });

      return nextStates;
    });

    selectedCoins.forEach((coin) => {
      fetchCompareCoin(coin, controller.signal).then((result) => {
        if (controller.signal.aborted || requestId !== latestRequestId.current) {
          return;
        }

        setCoinStates((currentStates) => ({
          ...currentStates,
          [coin.coinId]: result,
        }));
      });
    });

    return () => controller.abort();
  }, [selectedCoins, selectedKey]);

  function handleToggleCoin(coinId: string) {
    setSelectedCoinIds((currentCoinIds) => {
      if (currentCoinIds.includes(coinId)) {
        if (currentCoinIds.length <= 2) {
          return currentCoinIds;
        }

        return currentCoinIds.filter((selectedCoinId) => selectedCoinId !== coinId);
      }

      if (currentCoinIds.length >= 5) {
        return currentCoinIds;
      }

      return [...currentCoinIds, coinId];
    });
  }

  const rows = useMemo<CompareTableRow[]>(() => {
    const globalMacroData = macroData ?? getUnavailableMacro();

    return selectedCoins.map((coin) => {
      const state = coinStates[coin.coinId];
      const marketData = state?.marketData ?? null;
      const market = marketData?.market ?? null;
      const realizedVolatility = marketData
        ? calculateRealizedVolatility(marketData.chart)
        : null;

      if (!market) {
        return {
          coin,
          isLoading: state?.isLoading ?? true,
          error: state?.error ?? null,
          price: null,
          change24h: null,
          change7d: null,
          change30d: null,
          volumeToMarketCap: null,
          realizedVolatility: null,
          tvlChange30d: null,
          macroRegime: globalMacroData.regime,
          newsSentiment: state?.newsData?.sentimentLabel ?? "N/A",
          mvrvState: state?.onchainData?.valuationState ?? "N/A",
          marketScore: null,
          marketVerdict: null,
          contextScore: null,
          contextVerdict: null,
          compositeView: null,
        };
      }

      const score = calculateResearchScore(
        {
          change24h: market.priceChangePercentage24h,
          change7d: market.priceChangePercentage7d,
          change30d: market.priceChangePercentage30d,
          volumeToMarketCap:
            market.marketCap > 0 ? market.totalVolume / market.marketCap : 0,
          volatility30d: realizedVolatility ?? 60,
          athDrawdown: market.athChangePercentage,
          tvlChange30d: state?.defiData?.sourceAvailable
            ? state.defiData.tvlChange30d
            : undefined,
        },
        {
          macroData: globalMacroData,
          newsData: state?.newsData ?? null,
          onchainData: state?.onchainData ?? null,
        },
      );

      return {
        coin,
        isLoading: state?.isLoading ?? false,
        error: state?.error ?? null,
        price: market.currentPrice,
        change24h: market.priceChangePercentage24h,
        change7d: market.priceChangePercentage7d,
        change30d: market.priceChangePercentage30d,
        volumeToMarketCap:
          market.marketCap > 0 ? market.totalVolume / market.marketCap : null,
        realizedVolatility,
        tvlChange30d: state?.defiData?.sourceAvailable
          ? state.defiData.tvlChange30d ?? null
          : null,
        macroRegime: globalMacroData.regime,
        newsSentiment: state?.newsData?.sentimentLabel ?? "N/A",
        mvrvState: state?.onchainData?.valuationState ?? "N/A",
        marketScore: score.marketScore.totalScore,
        marketVerdict: score.marketScore.verdict,
        contextScore: score.contextScore.totalScore,
        contextVerdict: score.contextScore.verdict,
        compositeView: score.compositeView.label,
      };
    });
  }, [coinStates, macroData, selectedCoins]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#12253a_0%,_#070b14_43%)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header className="mb-8 mt-8 border-b border-slate-800/80 pb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Compare Mode
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Compare Coins
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Review selected assets side by side using the same market data,
            fundamentals, context panels, and Research Score v2 framework already used
            on the main dashboard.
          </p>
        </header>

        <div className="mb-7 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
          <ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={18} />
          <p>
            Comparison mode is for side-by-side research context only. It is not a
            ranking recommendation, price prediction, or standalone trading signal.
          </p>
        </div>

        <div className="grid gap-5">
          <CompareCoinSelector
            coins={allCoins}
            selectedCoinIds={selectedCoinIds}
            onToggleCoin={handleToggleCoin}
          />

          {isMacroLoading && (
            <section className="flex items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm text-slate-300">
              <LoaderCircle className="animate-spin text-cyan-300" size={18} />
              Loading global macro context once for the comparison table.
            </section>
          )}

          <CompareTable rows={rows} />

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-1 shrink-0 text-cyan-300" size={20} />
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  How this page fetches data
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Macro data is fetched once because it is global. Market, DeFi,
                  on-chain, and news context are fetched only for the selected assets.
                  If one asset fails, its row shows unavailable values while the other
                  rows remain visible.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
