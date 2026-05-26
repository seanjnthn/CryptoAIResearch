import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Layers3 } from "lucide-react";
import type { MarketData } from "@/types/crypto";

interface MarketSnapshotProps {
  market: MarketData;
}

function formatPrice(price: number) {
  if (price < 10) {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  }

  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatCompactValue(value: number) {
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export default function MarketSnapshot({ market }: MarketSnapshotProps) {
  const changeIsPositive = market.priceChangePercentage24h >= 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Market Snapshot
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {market.name} <span className="text-slate-400">({market.symbol})</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Live price and liquidity context</p>
        </div>
        <Activity className="text-cyan-300" size={21} />
      </div>

      <div className="mb-6 flex items-end gap-3">
        <p className="text-3xl font-bold text-white">{formatPrice(market.currentPrice)}</p>
        <p
          className={`mb-1 flex items-center text-sm font-semibold ${
            changeIsPositive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {changeIsPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(market.priceChangePercentage24h).toFixed(2)}% 24h
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <SnapshotItem
          icon={<Layers3 size={15} />}
          label="Market cap"
          value={formatCompactValue(market.marketCap)}
        />
        <SnapshotItem
          icon={<BarChart3 size={15} />}
          label="Volume"
          value={formatCompactValue(market.totalVolume)}
        />
        <SnapshotItem icon={<Activity size={15} />} label="ATH" value={formatPrice(market.ath)} />
      </div>
    </section>
  );
}

interface SnapshotItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SnapshotItem({ icon, label, value }: SnapshotItemProps) {
  return (
    <div className="rounded-xl bg-slate-950/70 p-3">
      <div className="mb-2 text-slate-500">{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-200">{value}</p>
    </div>
  );
}
