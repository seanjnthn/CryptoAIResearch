import { CircleMinus, LoaderCircle, Scale } from "lucide-react";
import type {
  OnchainValuationData,
  OnchainValuationState,
} from "@/types/crypto";

interface OnchainValuationProps {
  data: OnchainValuationData | null;
  isLoading: boolean;
}

function formatCompactCurrency(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function getValuationStyle(state: OnchainValuationState) {
  if (state === "Undervalued/Capitulation Zone") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-200";
  }

  if (state === "Elevated") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }

  if (state === "Overheated") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-slate-700 bg-slate-950/50 text-slate-300";
}

export default function OnchainValuation({
  data,
  isLoading,
}: OnchainValuationProps) {
  const isProviderLimited =
    !data?.sourceAvailable &&
    (data?.upstreamStatus === 403 ||
      data?.upstreamMessage?.includes("not available with supplied credentials"));

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            On-chain Valuation
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">MVRV cycle context</h2>
          <p className="mt-1 text-sm text-slate-500">
            Market value relative to realized value
          </p>
        </div>
        <Scale className="shrink-0 text-blue-300" size={22} />
      </div>

      {isLoading && (
        <div className="flex min-h-28 items-center gap-3 text-sm text-slate-400">
          <LoaderCircle className="animate-spin text-blue-300" size={18} />
          Loading on-chain valuation context...
        </div>
      )}

      {!isLoading && data?.sourceAvailable && data.mvrv !== null && (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs text-slate-500">MVRV ratio</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {data.mvrv.toFixed(2)}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getValuationStyle(data.valuationState)}`}
            >
              {data.valuationState}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Realized cap"
              value={formatCompactCurrency(data.realizedCapUsd)}
            />
            <Metric
              label="Market cap"
              value={formatCompactCurrency(data.marketCapUsd)}
            />
            <Metric label="Provider" value="Coin Metrics Community API" />
            <Metric
              label="MVRV metric"
              value={data.metricLabel ?? "Unavailable"}
            />
            <Metric
              label="Observation time"
              value={
                data.time
                  ? new Date(data.time).toLocaleDateString()
                  : "Unavailable"
              }
            />
          </div>

          <ul className="mt-5 space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
            {data.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {!isLoading && (!data || !data.sourceAvailable) && (
        <div className="flex min-h-28 items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-400">
          <CircleMinus className="mt-1 shrink-0 text-slate-500" size={17} />
          <div>
            <p className="font-medium text-slate-300">
              {isProviderLimited
                ? "On-chain valuation data is unavailable with the current data provider access."
                : "No on-chain valuation context for this asset"}
            </p>
            {isProviderLimited ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                MVRV requires realized-cap data, which may require paid or
                expanded provider access.
              </p>
            ) : (
              <p className="mt-1">
                {data?.message ?? "MVRV unavailable for this asset or data source."}
              </p>
            )}
            {data?.upstreamStatus !== null &&
              data?.upstreamStatus !== undefined && (
                <p className="mt-2 text-xs text-slate-500">
                  Provider status: {data.upstreamStatus}
                </p>
              )}
            {data?.metricLabel && (
              <p className="mt-2 text-xs text-slate-500">
                Metric: {data.metricLabel}
              </p>
            )}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        MVRV provides valuation and cycle context only. It is not a standalone
        trading signal.
      </p>
    </section>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl bg-slate-950/70 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
