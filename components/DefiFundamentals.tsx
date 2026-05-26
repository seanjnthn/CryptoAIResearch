import { CircleMinus, Database, LoaderCircle, TriangleAlert } from "lucide-react";
import type { DefiFundamentalsData } from "@/types/crypto";

interface DefiFundamentalsProps {
  data: DefiFundamentalsData | null;
  isLoading: boolean;
}

function formatCompactCurrency(value: number) {
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatChange(value: number | undefined) {
  if (value === undefined) {
    return "Unavailable";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getChangeStyle(value: number | undefined) {
  if (value === undefined) return "text-slate-400";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-300";
}

export default function DefiFundamentals({
  data,
  isLoading,
}: DefiFundamentalsProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            DeFi Fundamentals
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">Total value locked</h2>
          <p className="mt-1 text-sm text-slate-500">On-chain liquidity context where applicable</p>
        </div>
        <Database className="text-emerald-300" size={21} />
      </div>

      {isLoading && (
        <div className="flex min-h-28 items-center gap-3 text-sm text-slate-400">
          <LoaderCircle className="animate-spin text-emerald-300" size={18} />
          Loading DeFi fundamentals...
        </div>
      )}

      {!isLoading && data?.sourceAvailable && data.tvl !== undefined && (
        <>
          <div className="mb-5 rounded-xl bg-slate-950/70 p-4">
            <p className="text-xs text-slate-500">{data.label} TVL</p>
            <p className="mt-1 text-3xl font-bold text-white">
              {formatCompactCurrency(data.tvl)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "1d change", value: data.tvlChange1d },
              { label: "7d change", value: data.tvlChange7d },
              { label: "30d change", value: data.tvlChange30d },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-950/70 p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`mt-2 text-sm font-semibold ${getChangeStyle(item.value)}`}>
                  {formatChange(item.value)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && (!data || !data.sourceAvailable) && (
        <div
          className={`flex min-h-28 items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${
            data?.error
              ? "border-amber-300/15 bg-amber-300/5 text-slate-300"
              : "border-slate-800 bg-slate-950/40 text-slate-400"
          }`}
        >
          {data?.error ? (
            <TriangleAlert className="mt-1 shrink-0 text-amber-300" size={17} />
          ) : (
            <CircleMinus className="mt-1 shrink-0 text-slate-500" size={17} />
          )}
          <div>
            <p className="font-medium text-slate-300">
              {data?.error ? "DeFi data temporarily unavailable" : "No DeFi context for this asset"}
            </p>
            <p className="mt-1">
              {data?.message ??
                "DeFi fundamentals unavailable or not relevant for this asset."}
            </p>
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        DeFi fundamentals are only one research input and may not apply to every asset.
      </p>
    </section>
  );
}
