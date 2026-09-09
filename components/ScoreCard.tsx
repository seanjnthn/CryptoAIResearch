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
  const percentage = (value / maximum) * 100;
  let barClass = "score-bar-accent";
  if (percentage >= 70) barClass = "score-bar-positive";
  else if (percentage >= 40) barClass = "score-bar-neutral";
  else barClass = "score-bar-negative";

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-muted)] font-mono-tabular">
          {value}/{maximum}
        </span>
      </div>
      <div className="score-bar-container">
        <div
          className={`score-bar-fill ${barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
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
    <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={18} />
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Research Score v2
            </p>
          </div>
          <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">Market Score + Context Score</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Separates direct market structure from broader research context.
          </p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
          <Gauge size={20} />
        </div>
      </div>

      {/* Composite View Card */}
      <div className="mb-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers3 size={18} />
            <p className="text-sm font-medium text-[var(--text-primary)]">Composite Research View</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${getCompositeStyle(
              score.compositeView.label,
            )}`}
          >
            {score.compositeView.label}
          </span>
        </div>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{score.compositeView.explanation}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Market Score Panel */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] p-4">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-[var(--bg-surface-2)] p-4 border border-[var(--border-subtle)]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Market Score</p>
              <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                {score.marketScore.totalScore}
                <span className="text-base font-medium text-[var(--text-muted)]">/100</span>
              </p>
            </div>
            <p
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getMarketVerdictStyle(
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
          <div className="mt-4 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">30D Realized Volatility (Annualized)</p>
            <p className="mt-1 text-lg font-bold text-[var(--accent)]">
              {realizedVolatility === null ? "Unavailable" : `${realizedVolatility.toFixed(2)}%`}
            </p>
          </div>

          {/* Market Notes */}
          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3">
            <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <FileText size={14} />
              Market Notes
            </h3>
            <NotesList notes={score.marketScore.notes} />
          </div>
        </div>

        {/* Context Score Panel */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] p-4">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-[var(--bg-surface-2)] p-4 border border-[var(--border-subtle)]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Context Score</p>
              <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                {score.contextScore.totalScore}
                <span className="text-base font-medium text-[var(--text-muted)]">/100</span>
              </p>
            </div>
            <p
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getContextVerdictStyle(
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
          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3">
            <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <FileText size={14} />
              Context Notes
            </h3>
            <NotesList notes={score.contextScore.notes} />
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-3 text-xs font-medium text-[var(--warning)]">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        Scores are simplified research aids only. They are not financial advice, price predictions, or buy/sell signals.
      </p>
    </section>
  );
}
