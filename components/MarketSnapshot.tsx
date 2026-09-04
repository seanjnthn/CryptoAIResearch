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
    <section className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 p-5 shadow-xl shadow-black/5 sm:p-6 card-hover backdrop-blur-xl glass-card">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-cyan-600" size={18} />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-600">
              Market Snapshot
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {market.name} <span className="text-slate-500">({market.symbol.toUpperCase()})</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">Live price and liquidity context</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center icon-container">
          <Activity className="text-cyan-600" size={24} />
        </div>
      </div>

      <div className="mb-6 flex items-end gap-4">
        <p className="text-4xl font-bold text-slate-900">{formatPrice(market.currentPrice)}</p>
        <div
          className={`mb-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
            changeIsPositive 
              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-400/30" 
              : "bg-rose-500/10 text-rose-700 border border-rose-400/30"
          }`}
        >
          {changeIsPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          {Math.abs(market.priceChangePercentage24h).toFixed(2)}%
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <SnapshotItem
          icon={<Layers3 size={16} />}
          label="Market Cap"
          value={formatCompactValue(market.marketCap)}
          gradient="from-emerald-500/10 to-cyan-500/10"
        />
        <SnapshotItem
          icon={<BarChart3 size={16} />}
          label="24H Volume"
          value={formatCompactValue(market.totalVolume)}
          gradient="from-blue-500/10 to-violet-500/10"
        />
        <SnapshotItem 
          icon={<Activity size={16} />} 
          label="All-Time High" 
          value={formatPrice(market.ath)}
          gradient="from-amber-500/10 to-orange-500/10"
        />
      </div>
    </section>
  );
}

interface SnapshotItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient?: string;
}

function SnapshotItem({ icon, label, value, gradient = "from-slate-500/10 to-slate-500/5" }: SnapshotItemProps) {
  return (
    <div className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4 border border-white/50 transition-all hover:border-white/70 glass-card`}>
      <div className="mb-2 flex items-center gap-2 text-slate-600 group-hover:text-slate-800 transition-colors">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
