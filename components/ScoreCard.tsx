import { CircleAlert, Gauge, Layers3 } from "lucide-react";
import type {
  CompositeResearchLabel,
  ContextVerdict,
  MarketVerdict,
  ScoringResult,
} from "@/types/crypto";

interface ScoreCardProps {
  score: ScoringResult;
  realizedVolatility: number | null;
}

function getMarketVerdictStyle(verdict: MarketVerdict) {
  if (verdict === "Strong" || verdict === "Constructive") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (verdict === "Neutral") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-400/10 text-rose-300";
}

function getContextVerdictStyle(verdict: ContextVerdict) {
  if (verdict === "Supportive") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (verdict === "Neutral" || verdict === "Unavailable") {
    return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }

  if (verdict === "Mixed") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-400/10 text-rose-300";
}

function getCompositeStyle(label: CompositeResearchLabel) {
  if (label === "Constructive") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (label === "Neutral") {
    return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }

  if (label === "Mixed" || label === "Caution") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-400/10 text-rose-300";
}

function ScoreMetric({
  label,
  description,
  value,
  maximum,
}: {
  label: string;
  description: string;
  value: number;
  maximum: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="text-slate-400">
          {value}/{maximum}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
          style={{ width: `${(value / maximum) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function NotesList({ notes }: { notes: string[] }) {
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <p key={note} className="flex items-start gap-2 text-xs leading-5 text-slate-400">
          <CircleAlert className="mt-0.5 shrink-0 text-slate-500" size={14} />
          {note}
        </p>
      ))}
    </div>
  );
}

export default function ScoreCard({ score, realizedVolatility }: ScoreCardProps) {
  const marketBreakdown = [
    {
      label: "Trend",
      description: "Recent price momentum",
      value: score.marketScore.trendScore,
      maximum: 30,
    },
    {
      label: "Liquidity",
      description: "Volume relative to market cap",
      value: score.marketScore.liquidityScore,
      maximum: 20,
    },
    {
      label: "Volatility",
      description: "Realized 30D annualized volatility",
      value: score.marketScore.volatilityScore,
      maximum: 15,
    },
    {
      label: "Drawdown",
      description: "Distance from all-time high with trend context",
      value: score.marketScore.drawdownScore,
      maximum: 15,
    },
    {
      label: "Fundamental",
      description: "DeFi TVL trend if available",
      value: score.marketScore.fundamentalScore,
      maximum: 20,
    },
  ];

  const contextBreakdown = [
    {
      label: "Macro",
      description: "Crypto market regime and broad risk backdrop",
      value: score.contextScore.macroScore,
      maximum: 35,
    },
    {
      label: "Fear & Greed",
      description: "Sentiment extremes treated as possible risk",
      value: score.contextScore.fearGreedScore,
      maximum: 25,
    },
    {
      label: "News",
      description: "Heuristic headline sentiment, weighted lightly",
      value: score.contextScore.newsScore,
      maximum: 20,
    },
    {
      label: "On-chain",
      description: "MVRV valuation context if provider data is available",
      value: score.contextScore.onchainScore,
      maximum: 20,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Research Score v2
          </p>
          <h2 className="mt-2 text-lg font-semibold">Market score plus context score</h2>
          <p className="mt-1 text-sm text-slate-500">
            Separates direct market structure from broader research context.
          </p>
        </div>
        <Gauge className="text-violet-300" size={21} />
      </div>

      <div className="mb-6 rounded-xl border border-violet-400/15 bg-violet-400/5 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers3 className="text-violet-300" size={18} />
            <p className="text-sm font-semibold text-slate-100">Composite Research View</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCompositeStyle(
              score.compositeView.label,
            )}`}
          >
            {score.compositeView.label}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-400">{score.compositeView.explanation}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-950/70 p-4">
            <div>
              <p className="text-xs text-slate-500">Market score</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {score.marketScore.totalScore}
                <span className="text-lg font-medium text-slate-500">/100</span>
              </p>
            </div>
            <p
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getMarketVerdictStyle(
                score.marketScore.verdict,
              )}`}
            >
              {score.marketScore.verdict}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {marketBreakdown.map((metric) => (
              <ScoreMetric key={metric.label} {...metric} />
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <p className="text-xs text-slate-500">30D realized volatility annualized</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">
              {realizedVolatility === null ? "Unavailable" : `${realizedVolatility.toFixed(2)}%`}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">Market notes</h3>
            <NotesList notes={score.marketScore.notes} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-950/70 p-4">
            <div>
              <p className="text-xs text-slate-500">Context score</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {score.contextScore.totalScore}
                <span className="text-lg font-medium text-slate-500">/100</span>
              </p>
            </div>
            <p
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getContextVerdictStyle(
                score.contextScore.verdict,
              )}`}
            >
              {score.contextScore.verdict}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {contextBreakdown.map((metric) => (
              <ScoreMetric key={metric.label} {...metric} />
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">Context notes</h3>
            <NotesList notes={score.contextScore.notes} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-amber-300">
        Scores are simplified research aids. They are not financial advice, price
        predictions, or buy/sell signals.
      </p>
    </section>
  );
}
