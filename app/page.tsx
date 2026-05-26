"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, ShieldAlert, TriangleAlert } from "lucide-react";
import AiSummary from "@/components/AiSummary";
import CoinSelector from "@/components/CoinSelector";
import DefiFundamentals from "@/components/DefiFundamentals";
import MarketSnapshot from "@/components/MarketSnapshot";
import PriceChart from "@/components/PriceChart";
import ScoreCard from "@/components/ScoreCard";
import { calculateRealizedVolatility } from "@/lib/analytics";
import { calculateResearchScore } from "@/lib/scoring";
import {
  CUSTOM_WATCHLIST_STORAGE_KEY,
  DEFAULT_COIN_ID,
  defaultWatchlist,
} from "@/lib/watchlist";
import type {
  DefiFundamentalsData,
  MarketApiError,
  MarketApiResponse,
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
  const [refreshKey, setRefreshKey] = useState(0);
  const latestRequestId = useRef(0);
  const latestDefiRequestId = useRef(0);
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
  const researchScore = useMemo(() => {
    if (!marketData) {
      return null;
    }

    const market = marketData.market;
    const score = calculateResearchScore({
      change24h: market.priceChangePercentage24h,
      change7d: market.priceChangePercentage7d,
      change30d: market.priceChangePercentage30d,
      volumeToMarketCap: market.marketCap > 0 ? market.totalVolume / market.marketCap : 0,
      volatility30d: realizedVolatility ?? 60,
      athDrawdown: market.athChangePercentage,
      tvlChange30d:
        market.id === coin.coinId && defiData?.sourceAvailable
          ? defiData.tvlChange30d
          : undefined,
    });

    return {
      ...score,
      notes:
        realizedVolatility === null
          ? [
              ...score.notes,
              "Realized volatility is unavailable, so a neutral volatility score is used.",
            ]
          : score.notes,
    };
  }, [coin.coinId, defiData, marketData, realizedVolatility]);

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
        const response = await fetch(`/api/market?coinId=${coin.coinId}&days=30`, {
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#12253a_0%,_#070b14_43%)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-slate-800/80 pb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Research Workspace
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Crypto AI Research Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Review live market context, realized volatility, DeFi fundamentals, and
            on-demand structured AI summaries in one focused workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-slate-400">
            {["CoinGecko market data", "DeFiLlama TVL context", "Gemini structured summary"].map(
              (source) => (
                <span key={source} className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5">
                  {source}
                </span>
              ),
            )}
          </div>
          <Link
            href="/methodology"
            className="mt-6 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
          >
            Methodology &amp; User Guide
          </Link>
        </header>

        <div className="mb-7 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
          <ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={18} />
          <p>
            Research assistant only, not financial advice. Outputs provide market context
            and are not a standalone trading signal.
          </p>
        </div>

        <section className="mb-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Research Universe
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">Select an asset</h2>
              <p className="mt-1 text-sm text-slate-400">
                Load one asset at a time to keep external requests measured and reliable.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={isLoading}
              className="shrink-0 rounded-xl border border-slate-700 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh market data
            </button>
          </div>
          <CoinSelector
            coins={allCoins}
            selectedCoinId={coin.coinId}
            onSelectCoin={(nextCoinId) => {
              if (nextCoinId !== coin.coinId) {
                setSelectedCoinId(nextCoinId);
              }
            }}
            onRemoveCoin={handleRemoveCustomCoin}
          />
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h3 className="text-sm font-semibold text-slate-100">Add custom coin</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 sm:max-w-xs disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isAddingCoin}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingCoin && <LoaderCircle className="animate-spin" size={16} />}
                {isAddingCoin ? "Checking..." : "Add Coin"}
              </button>
            </form>
            {customCoinMessage && (
              <p className="mt-3 text-sm text-emerald-300">{customCoinMessage}</p>
            )}
            {customCoinError && (
              <p className="mt-3 text-sm text-rose-300">{customCoinError}</p>
            )}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          {isLoading && !marketData && (
            <section className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-slate-300 lg:col-span-2">
              <LoaderCircle className="animate-spin text-cyan-300" size={20} />
              Loading live CoinGecko market data for {coin.name}...
            </section>
          )}

          {isLoading && marketData && (
            <section className="flex items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm text-slate-300 lg:col-span-2">
              <LoaderCircle className="animate-spin text-cyan-300" size={18} />
              Refreshing {coin.name} market data. The last successful result remains visible.
            </section>
          )}

          {warning && !isLoading && (
            <section className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100 lg:col-span-2">
              <TriangleAlert className="mt-0.5 shrink-0 text-amber-300" size={18} />
              <div>
                <p className="font-medium">Using cached market context</p>
                <p className="mt-1 text-amber-100/80">{warning}</p>
              </div>
            </section>
          )}

          {error && !isLoading && (
            <section className="flex flex-col items-start gap-4 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 lg:col-span-2 sm:flex-row sm:items-center">
              <TriangleAlert className="text-rose-300" size={24} />
              <div className="flex-1 space-y-1 text-sm text-slate-300">
                <p className="font-medium text-rose-100">Market data update unavailable</p>
                <p>
                  Market data failed to load. Status: {error.status || "Network"}. Reason:{" "}
                  {error.detail}
                </p>
                {marketData && (
                  <p className="text-slate-400">
                    Showing the last successfully loaded market data below.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Try again
              </button>
            </section>
          )}

          {marketData && researchScore && (
            <>
              <MarketSnapshot market={marketData.market} />
              <ScoreCard score={researchScore} realizedVolatility={realizedVolatility} />
              <PriceChart symbol={marketData.market.symbol} data={marketData.chart} />
            </>
          )}

          <DefiFundamentals data={defiData} isLoading={isDefiLoading} />
          <AiSummary
            coin={coin}
            marketData={currentMarket}
            scoring={currentMarket ? researchScore : null}
            defiData={defiData}
            realizedVolatility={currentMarket ? realizedVolatility : null}
            canGenerate={Boolean(currentMarket && researchScore && defiData && !isDefiLoading)}
          />
        </div>

        <footer className="pt-10 text-center text-xs leading-6 text-slate-500">
          Market and chart data from CoinGecko. DeFi TVL data from DeFiLlama. AI summaries
          generate on demand from available structured data. Research assistant only.
        </footer>
      </div>
    </main>
  );
}
