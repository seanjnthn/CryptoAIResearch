"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import type {
  CompositeResearchLabel,
  ContextVerdict,
  MarketVerdict,
  MacroRegime,
  NewsSentimentLabel,
  OnchainValuationState,
  WatchlistCoin,
} from "@/types/crypto";

export interface CompareTableRow {
  coin: WatchlistCoin;
  isLoading: boolean;
  error: string | null;
  price: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  volumeToMarketCap: number | null;
  realizedVolatility: number | null;
  tvlChange30d: number | null;
  macroRegime: MacroRegime | "N/A";
  newsSentiment: NewsSentimentLabel | "N/A";
  mvrvState: OnchainValuationState | "N/A";
  marketScore: number | null;
  marketVerdict: MarketVerdict | null;
  contextScore: number | null;
  contextVerdict: ContextVerdict | null;
  compositeView: CompositeResearchLabel | null;
}

interface CompareTableProps {
  rows: CompareTableRow[];
}

function formatCurrency(value: number | null) {
  if (value === null) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatPercent(value: number | null, digits = 2) {
  if (value === null) return "N/A";
  return `${value.toFixed(digits)}%`;
}

function formatRatio(value: number | null) {
  if (value === null) return "N/A";
  return value.toFixed(4);
}

function getBadgeStyle(label: string | null) {
  if (!label || label === "N/A" || label === "Unavailable") {
    return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }

  if (
    ["Strong", "Constructive", "Supportive", "Risk-on", "Positive"].includes(label)
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (
    ["Mixed", "Caution", "Elevated", "Risk-off", "Negative", "Risky"].includes(
      label,
    )
  ) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (["High Risk", "Weak", "Overheated"].includes(label)) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }

  return "border-slate-500/20 bg-slate-500/10 text-slate-300";
}

function Badge({ label }: { label: string | null }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${getBadgeStyle(
        label,
      )}`}
    >
      {label ?? "N/A"}
    </span>
  );
}

export default function CompareTable({ rows }: CompareTableProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Side-by-Side Context
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Compare selected assets</h2>
        <p className="mt-1 text-sm text-slate-400">
          Values that cannot be loaded are shown as N/A so one failed source does not
          break the whole comparison.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-3 py-3">Coin</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">24H %</th>
              <th className="px-3 py-3">7D %</th>
              <th className="px-3 py-3">30D %</th>
              <th className="px-3 py-3">Vol / MCap</th>
              <th className="px-3 py-3">30D Volatility</th>
              <th className="px-3 py-3">DeFi TVL 30D</th>
              <th className="px-3 py-3">Macro</th>
              <th className="px-3 py-3">News</th>
              <th className="px-3 py-3">MVRV</th>
              <th className="px-3 py-3">Market Score</th>
              <th className="px-3 py-3">Context Score</th>
              <th className="px-3 py-3">Composite</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.coin.coinId} className="border-b border-slate-800/70 last:border-0">
                <td className="px-3 py-4">
                  <div>
                    <p className="font-semibold text-slate-100">{row.coin.symbol}</p>
                    <p className="text-xs text-slate-500">{row.coin.name}</p>
                    {row.isLoading && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-300">
                        <LoaderCircle className="animate-spin" size={13} />
                        Loading
                      </p>
                    )}
                    {row.error && !row.isLoading && (
                      <p className="mt-2 flex max-w-44 items-start gap-1.5 text-xs leading-5 text-amber-300">
                        <TriangleAlert className="mt-0.5 shrink-0" size={13} />
                        {row.error}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 text-slate-300">{formatCurrency(row.price)}</td>
                <td className="px-3 py-4 text-slate-300">{formatPercent(row.change24h)}</td>
                <td className="px-3 py-4 text-slate-300">{formatPercent(row.change7d)}</td>
                <td className="px-3 py-4 text-slate-300">{formatPercent(row.change30d)}</td>
                <td className="px-3 py-4 text-slate-300">
                  {formatRatio(row.volumeToMarketCap)}
                </td>
                <td className="px-3 py-4 text-slate-300">
                  {formatPercent(row.realizedVolatility)}
                </td>
                <td className="px-3 py-4 text-slate-300">
                  {formatPercent(row.tvlChange30d)}
                </td>
                <td className="px-3 py-4">
                  <Badge label={row.macroRegime} />
                </td>
                <td className="px-3 py-4">
                  <Badge label={row.newsSentiment} />
                </td>
                <td className="px-3 py-4">
                  <Badge label={row.mvrvState} />
                </td>
                <td className="px-3 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">
                      {row.marketScore === null ? "N/A" : `${row.marketScore}/100`}
                    </p>
                    <Badge label={row.marketVerdict} />
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">
                      {row.contextScore === null ? "N/A" : `${row.contextScore}/100`}
                    </p>
                    <Badge label={row.contextVerdict} />
                  </div>
                </td>
                <td className="px-3 py-4">
                  <Badge label={row.compositeView} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-xs font-medium text-amber-300">
        Comparison mode is for research context only and is not a ranking or
        buy/sell signal.
      </p>
    </section>
  );
}
