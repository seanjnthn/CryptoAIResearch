import { CircleAlert, Gauge, Layers3, FileText, AlertTriangle } from "lucide-react";
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
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-700";
  }

  if (verdict === "Neutral") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-700";
  }

  return "border-rose-400/30 bg-rose-500/10 text-rose-700";
}

function getContextVerdictStyle(verdict: ContextVerdict) {
  if (verdict === "Supportive") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-700";
  }

  if (verdict === "Neutral" || verdict === "Unavailable") {
    return "border-slate-400/30 bg-slate-500/10 text-slate-700";
  }

  if (verdict === "Mixed") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-700";
  }

  return "border-rose-400/30 bg-rose-500/10 text-rose-700";
}

function getCompositeStyle(label: CompositeResearchLabel) {
  if (label === "Constructive") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-700";
  }

  if (label === "Neutral") {
    return "border-slate-400/30 bg-slate-500/10 text-slate-700";
  }

  if (label === "Mixed" || label === "Caution") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-700";
  }

  return "border-rose-400/30 bg-rose-500/10 text-rose-700";
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
    <div className="rounded-xl border border-white/50 bg-white/60 p-3 glass-card">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-600">
          {value}/{maximum}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
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
        <p key={note} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
          <CircleAlert className="mt-0.5 shrink-0 text-slate-400" size={14} />
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
    <section className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 p-5 shadow-xl shadow-black/5 sm:p-6 card-hover backdrop-blur-xl glass-card">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="text-purple-600" size={18} />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-600">
              Research Score v2
            </p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Market Score + Context Score</h2>
          <p className="mt-1 text-sm text-slate-600">
            Separates direct market structure from broader research context.
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center icon-container">
          <Gauge className="text-purple-600" size={24} />
        </div>
      </div>

      {/* Composite View Card */}
      <div className="mb-6 rounded-xl border border-purple-400/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5 backdrop-blur-xl glass-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers3 className="text-purple-600" size={20} />
            <p className="text-sm font-bold text-slate-800">Composite Research View</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getCompositeStyle(
              score.compositeView.label,
            )}`}
          >
            {score.compositeView.label}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-700">{score.compositeView.explanation}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Market Score Panel */}
        <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/70 to-white/30 p-5 backdrop-blur-xl glass-card">
          <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-white/80 to-white/50 p-5 border border-white/60 glass-card">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Market Score</p>
              <p className="mt-1 text-4xl font-bold text-slate-900">
                {score.marketScore.totalScore}
                <span className="text-lg font-medium text-slate-500">/100</span>
              </p>
            </div>
            <p
              className={`rounded-full border px-4 py-2 text-sm font-bold ${getMarketVerdictStyle(
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

          {/* Volatility Box */}
          <div className="mt-5 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 backdrop-blur-xl glass-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">30D Realized Volatility (Annualized)</p>
            <p className="mt-2 text-xl font-bold text-cyan-700">
              {realizedVolatility === null ? "Unavailable" : `${realizedVolatility.toFixed(2)}%`}
            </p>
          </div>

          {/* Market Notes */}
          <div className="mt-5 rounded-xl border border-white/50 bg-white/60 p-4 backdrop-blur-xl glass-card">
            <h3 className="mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              Market Notes
            </h3>
            <NotesList notes={score.marketScore.notes} />
          </div>
        </div>

        {/* Context Score Panel */}
        <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/70 to-white/30 p-5 backdrop-blur-xl glass-card">
          <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-white/80 to-white/50 p-5 border border-white/60 glass-card">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Context Score</p>
              <p className="mt-1 text-4xl font-bold text-slate-900">
                {score.contextScore.totalScore}
                <span className="text-lg font-medium text-slate-500">/100</span>
              </p>
            </div>
            <p
              className={`rounded-full border px-4 py-2 text-sm font-bold ${getContextVerdictStyle(
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

          {/* Context Notes */}
          <div className="mt-5 rounded-xl border border-white/50 bg-white/60 p-4 backdrop-blur-xl glass-card">
            <h3 className="mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              Context Notes
            </h3>
            <NotesList notes={score.contextScore.notes} />
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 glass-card">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        Scores are simplified research aids only. They are not financial advice, price predictions, or buy/sell signals.
      </p>
    </section>
  );
}
