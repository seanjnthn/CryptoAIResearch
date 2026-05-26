import { CircleMinus, Globe2, LoaderCircle } from "lucide-react";
import type { MacroRegime, MacroSentimentData } from "@/types/crypto";

interface MacroSentimentPanelProps {
  data: MacroSentimentData | null;
  isLoading: boolean;
}

function formatCompactCurrency(value: number | undefined) {
  if (value === undefined) {
    return "Unavailable";
  }

  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatPercentage(value: number | undefined) {
  if (value === undefined) {
    return "Unavailable";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getChangeStyle(value: number | undefined) {
  if (value === undefined) return "text-slate-400";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-200";
}

function getRegimeStyle(regime: MacroRegime) {
  if (regime === "Risk-on") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (regime === "Risk-off") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (regime === "Mixed") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }

  return "border-slate-700 bg-slate-950/50 text-slate-300";
}

export default function MacroSentimentPanel({
  data,
  isLoading,
}: MacroSentimentPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6 lg:col-span-2">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Macro &amp; Sentiment Context
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Broader crypto risk backdrop
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            CoinGecko global market totals and Alternative.me Fear &amp; Greed
          </p>
        </div>
        <Globe2 className="shrink-0 text-violet-300" size={22} />
      </div>

      {isLoading && (
        <div className="flex min-h-28 items-center gap-3 text-sm text-slate-400">
          <LoaderCircle className="animate-spin text-violet-300" size={18} />
          Loading macro and sentiment context...
        </div>
      )}

      {!isLoading && data?.sourceAvailable && (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs text-slate-500">Macro regime</p>
              <p className="mt-1 text-sm text-slate-400">
                Simple contextual classification, not a market forecast
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getRegimeStyle(data.regime)}`}
            >
              {data.regime}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              label="Total market cap"
              value={formatCompactCurrency(data.totalCryptoMarketCap)}
            />
            <Metric
              label="24h market cap change"
              value={formatPercentage(data.marketCapChange24h)}
              valueClassName={getChangeStyle(data.marketCapChange24h)}
            />
            <Metric
              label="BTC dominance"
              value={
                data.btcDominance === undefined
                  ? "Unavailable"
                  : `${data.btcDominance.toFixed(2)}%`
              }
            />
            <Metric
              label="Total volume"
              value={formatCompactCurrency(data.totalCryptoVolume)}
            />
            <Metric
              label="Fear & Greed"
              value={
                data.fearGreedValue === undefined
                  ? "Unavailable"
                  : `${data.fearGreedValue} - ${data.fearGreedClassification ?? "Unclassified"}`
              }
            />
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Context Notes
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {data.notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!isLoading && (!data || !data.sourceAvailable) && (
        <div className="flex min-h-28 items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-400">
          <CircleMinus className="mt-1 shrink-0 text-slate-500" size={17} />
          <div>
            <p className="font-medium text-slate-300">
              Macro context temporarily unavailable
            </p>
            <p className="mt-1">
              {data?.message ??
                "Macro and sentiment context could not be loaded right now."}
            </p>
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Macro and sentiment indicators provide context only and are not standalone
        trading signals. Fear &amp; Greed data source: Alternative.me.
      </p>
    </section>
  );
}

interface MetricProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function Metric({
  label,
  value,
  valueClassName = "text-slate-100",
}: MetricProps) {
  return (
    <div className="rounded-xl bg-slate-950/70 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}
