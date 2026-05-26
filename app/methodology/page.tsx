import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  Database,
  Gauge,
  ShieldAlert,
  Waves,
} from "lucide-react";

interface GuideCardProps {
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
}

const scoreCategories = [
  {
    name: "Trend",
    explanation: "Recent price momentum across the available time windows.",
  },
  {
    name: "Liquidity",
    explanation: "Trading volume relative to market capitalization.",
  },
  {
    name: "Volatility",
    explanation: "30D realized annualized volatility from historical prices.",
  },
  {
    name: "Drawdown",
    explanation: "Distance from the all-time high, considered with trend context.",
  },
  {
    name: "Fundamental",
    explanation: "DeFi TVL trend when relevant data is available.",
  },
];

function GuideCard({
  label,
  title,
  description,
  icon,
  children,
  className = "",
}: GuideCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/20 sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            {label}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50">{title}</h2>
        </div>
        <span className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-2.5 text-cyan-300">
          {icon}
        </span>
      </div>
      <p className="text-sm leading-7 text-slate-300">{description}</p>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#12253a_0%,_#070b14_43%)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header className="mb-8 mt-8 border-b border-slate-800/80 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Documentation
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Methodology &amp; User Guide
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Learn what each part of the dashboard measures, how to interpret
            the research score, and which limitations matter before using its
            output as market context.
          </p>
        </header>

        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p>
            This dashboard is a research assistant, not a trading bot. It does
            not provide financial advice, price predictions, or a standalone
            buy/sell signal.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <GuideCard
            label="Purpose"
            title="What This Dashboard Does"
            description="The dashboard brings several research inputs into one readable workspace: live market context, DeFi fundamentals, volatility analytics, a simplified research score, and an optional AI-generated summary."
            icon={<Gauge className="h-5 w-5" />}
            className="md:col-span-2"
          >
            <BulletList
              items={[
                "Use it to organize structured information and compare context across the selected assets.",
                "Treat the score and AI summary as educational research support, not an instruction to trade.",
              ]}
            />
          </GuideCard>

          <GuideCard
            label="Market Snapshot"
            title="Headline Market Metrics"
            description="This card summarizes current CoinGecko market data for the selected asset."
            icon={<Activity className="h-5 w-5" />}
          >
            <BulletList
              items={[
                "Current price shows the most recent quoted market price.",
                "Market cap estimates the asset's total market value.",
                "Total volume reflects reported trading activity.",
                "24h, 7d, and 30d changes describe recent price movement.",
                "ATH drawdown shows distance below the all-time high.",
              ]}
            />
          </GuideCard>

          <GuideCard
            label="Price Chart"
            title="Recent Historical Movement"
            description="The chart displays recent historical prices for visual trend context. It can help you notice direction and swings in the observed period, but it does not predict future prices."
            icon={<BarChart3 className="h-5 w-5" />}
          />

          <GuideCard
            label="Research Score"
            title="A Simplified Educational Framework"
            description="The score combines available inputs into a 0 to 100 research indicator. It is intentionally simplified and is not a buy/sell signal."
            icon={<Gauge className="h-5 w-5" />}
            className="md:col-span-2"
          >
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {scoreCategories.map((category) => (
                <div
                  key={category.name}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {category.name}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {category.explanation}
                  </p>
                </div>
              ))}
            </div>
          </GuideCard>

          <GuideCard
            label="Volatility"
            title="30D Realized Volatility"
            description="Realized volatility is calculated from historical daily price returns and annualized using sqrt(365), because crypto markets trade every day. Higher volatility indicates wider observed price swings and can suggest higher risk."
            icon={<Waves className="h-5 w-5" />}
          />

          <GuideCard
            label="DeFi Fundamentals"
            title="TVL Context Where Relevant"
            description="DeFiLlama data is used when a selected ecosystem has meaningful total value locked (TVL) information. TVL level and TVL changes can help describe ecosystem activity, but not every asset has relevant DeFi data."
            icon={<Database className="h-5 w-5" />}
          />

          <GuideCard
            label="AI Analyst Summary"
            title="Structured Gemini Analysis"
            description="The optional AI summary uses Gemini API and receives only structured data already shown by the dashboard. It is instructed not to use external news or knowledge and not to make price predictions."
            icon={<BrainCircuit className="h-5 w-5" />}
          >
            <BulletList
              items={[
                "The summary is designed to organize market status, risks, fundamentals, and monitoring points.",
                "AI output can still be incomplete or wrong, so review it critically.",
              ]}
            />
          </GuideCard>

          <GuideCard
            label="Limitations"
            title="Read Results With Care"
            description="No research tool removes uncertainty. Keep these limitations visible when interpreting the dashboard."
            icon={<ShieldAlert className="h-5 w-5" />}
          >
            <BulletList
              items={[
                "External API rate limits or free-tier instability may affect available data.",
                "The score methodology is simplified for education and portfolio demonstration.",
                "AI output may be incomplete or incorrect.",
                "DeFi metrics do not apply equally to all assets.",
                "This dashboard is not financial advice or a trading system.",
              ]}
            />
          </GuideCard>
        </div>

        <footer className="mt-8 border-t border-slate-800/80 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to the Crypto AI Research Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
