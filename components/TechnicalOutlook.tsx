import { Activity, CircleAlert, Compass } from "lucide-react";
import type { TechnicalOutlookData } from "@/types/crypto";

interface TechnicalOutlookProps {
  data: TechnicalOutlookData | null;
}

function formatPrice(value: number | undefined) {
  if (value === undefined) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatNumber(value: number | null, digits = 2) {
  if (value === null) return "N/A";
  return value.toFixed(digits);
}

function getOutlookStyle(label: string) {
  if (label === "Bullish bias") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (label === "Bearish bias") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }

  if (label === "Mixed / volatile") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-slate-400/20 bg-slate-400/10 text-slate-300";
}

function ScenarioCard({
  title,
  rangeLow,
  rangeHigh,
  condition,
}: {
  title: string;
  rangeLow: number;
  rangeHigh: number;
  condition: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-lg font-bold text-white">
        {formatPrice(rangeLow)} - {formatPrice(rangeHigh)}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{condition}</p>
    </div>
  );
}

export default function TechnicalOutlook({ data }: TechnicalOutlookProps) {
  if (!data) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6 lg:col-span-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Technical Outlook &amp; Scenario Forecast
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Technical outlook is unavailable until market chart data has loaded.
        </p>
      </section>
    );
  }

  const { metrics, forecast } = data;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6 lg:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Technical Outlook &amp; Scenario Forecast
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Conditional technical scenarios
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Built from historical price, volume, trend, momentum, and volatility data.
          </p>
        </div>
        <Compass className="shrink-0 text-cyan-300" size={22} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getOutlookStyle(
            forecast.outlookLabel,
          )}`}
        >
          {forecast.outlookLabel}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-sm font-semibold text-slate-300">
          Confidence: {forecast.confidence}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-sm font-semibold text-slate-300">
          Volume trend: {metrics.volumeTrend}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Activity className="text-cyan-300" size={16} />
            Trend
          </p>
          <p className="text-sm leading-6 text-slate-400">{forecast.trendSummary}</p>
          <p className="mt-3 text-xs text-slate-500">
            EMA20: {formatNumber(metrics.ema20)} | EMA50: {formatNumber(metrics.ema50)} |
            EMA200: {formatNumber(metrics.ema200)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-100">Momentum</p>
          <p className="text-sm leading-6 text-slate-400">{forecast.momentumSummary}</p>
          <p className="mt-3 text-xs text-slate-500">
            RSI14: {formatNumber(metrics.rsi14)} | MACD histogram:{" "}
            {metrics.macd ? metrics.macd.histogram.toFixed(4) : "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-100">Volatility</p>
          <p className="text-sm leading-6 text-slate-400">{forecast.volatilitySummary}</p>
          <p className="mt-3 text-xs text-slate-500">
            Est. 7D move: {formatNumber(metrics.estimated7dMovePercent)}% | Est. 30D
            move: {formatNumber(metrics.estimated30dMovePercent)}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-100">
            Support &amp; Resistance
          </p>
          <p className="text-sm leading-6 text-slate-400">
            {forecast.supportResistanceSummary}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Invalidation level: {formatPrice(forecast.invalidationLevel)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <ScenarioCard title="Bull Scenario" {...forecast.bullScenario} />
        <ScenarioCard title="Base Scenario" {...forecast.baseScenario} />
        <ScenarioCard title="Bear Scenario" {...forecast.bearScenario} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Notes</h3>
        <div className="space-y-2">
          {[...metrics.notes, ...forecast.notes].map((note) => (
            <p key={note} className="flex items-start gap-2 text-xs leading-5 text-slate-400">
              <CircleAlert className="mt-0.5 shrink-0 text-slate-500" size={14} />
              {note}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-amber-300">
        Scenario forecast is based on historical price data and simplified technical
        indicators. It is not financial advice, a promise, or a buy/sell signal.
      </p>
    </section>
  );
}
