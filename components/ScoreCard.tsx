import { CircleAlert, Gauge } from "lucide-react";
import type { ScoringResult } from "@/types/crypto";

interface ScoreCardProps {
  score: ScoringResult;
  realizedVolatility: number | null;
}

function getVerdictStyle(verdict: ScoringResult["verdict"]) {
  if (verdict === "Strong" || verdict === "Constructive") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (verdict === "Neutral") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-400/10 text-rose-300";
}

export default function ScoreCard({ score, realizedVolatility }: ScoreCardProps) {
  const scoreBreakdown = [
    {
      label: "Trend",
      description: "Recent price momentum",
      value: score.trendScore,
      maximum: 30,
    },
    {
      label: "Liquidity",
      description: "Volume relative to market cap",
      value: score.liquidityScore,
      maximum: 20,
    },
    {
      label: "Volatility",
      description: "Realized 30D annualized volatility",
      value: score.volatilityScore,
      maximum: 15,
    },
    {
      label: "Drawdown",
      description: "Distance from all-time high with trend context",
      value: score.drawdownScore,
      maximum: 15,
    },
    {
      label: "Fundamental",
      description: "DeFi TVL trend if available",
      value: score.fundamentalScore,
      maximum: 20,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Research Score
          </p>
          <h2 className="mt-2 text-lg font-semibold">Structured score breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">Transparent research inputs, scored out of 100</p>
        </div>
        <Gauge className="text-violet-300" size={21} />
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl bg-slate-950/70 p-4">
        <div>
          <p className="text-xs text-slate-500">Total score</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {score.totalScore}
            <span className="text-lg font-medium text-slate-500">/100</span>
          </p>
        </div>
        <p
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getVerdictStyle(score.verdict)}`}
        >
          {score.verdict}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {scoreBreakdown.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-200">{metric.label}</span>
              <span className="text-slate-400">
                {metric.value}/{metric.maximum}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                style={{ width: `${(metric.value / metric.maximum) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
        <p className="text-xs text-slate-500">30D realized volatility annualized</p>
        <p className="mt-1 text-lg font-semibold text-slate-100">
          {realizedVolatility === null ? "Unavailable" : `${realizedVolatility.toFixed(2)}%`}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Research notes</h3>
        <div className="space-y-2">
          {score.notes.map((note) => (
            <p key={note} className="flex items-start gap-2 text-xs leading-5 text-slate-400">
              <CircleAlert className="mt-0.5 shrink-0 text-slate-500" size={14} />
              {note}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-amber-300">
        Research score only — not financial advice.
      </p>
    </section>
  );
}
