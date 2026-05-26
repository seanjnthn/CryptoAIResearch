"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { coins, watchlist } from "@/lib/watchlist";
import type {
  CoinSymbol,
  DefiFundamentalsData,
  MarketApiError,
  MarketApiResponse,
} from "@/types/crypto";

function isMarketApiError(
  data: MarketApiResponse | MarketApiError,
): data is MarketApiError {
  return "error" in data && data.error === true;
}

export default function Home() {
  const [selectedCoin, setSelectedCoin] = useState<CoinSymbol>("BTC");
  const [marketData, setMarketData] = useState<MarketApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<MarketApiError | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [defiData, setDefiData] = useState<DefiFundamentalsData | null>(null);
  const [isDefiLoading, setIsDefiLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const latestRequestId = useRef(0);
  const latestDefiRequestId = useRef(0);
  const coin = watchlist[selectedCoin];
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
            coins={coins}
            selectedCoin={selectedCoin}
            onSelectCoin={(nextCoin) => {
              if (nextCoin !== selectedCoin) {
                setSelectedCoin(nextCoin);
              }
            }}
          />
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
