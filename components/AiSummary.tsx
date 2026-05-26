"use client";

import { useEffect, useRef, useState } from "react";
import { BrainCircuit, LoaderCircle, TriangleAlert } from "lucide-react";
import type {
  AiSummaryError,
  AiSummaryRequest,
  AiSummaryResponse,
  DefiFundamentalsData,
  MarketData,
  ScoringResult,
  WatchlistCoin,
} from "@/types/crypto";

interface AiSummaryProps {
  coin: WatchlistCoin;
  marketData: MarketData | null;
  scoring: ScoringResult | null;
  defiData: DefiFundamentalsData | null;
  realizedVolatility: number | null;
  canGenerate: boolean;
}

function isAiSummaryError(
  data: AiSummaryResponse | AiSummaryError,
): data is AiSummaryError {
  return "error" in data && data.error === true;
}

function renderInlineText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-slate-100">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function renderSummary(summary: string) {
  return summary.split("\n").map((line, index) => {
    const cleanLine = line.trim();

    if (!cleanLine) {
      return <div key={`space-${index}`} className="h-2" />;
    }

    if (cleanLine.startsWith("## ") || cleanLine.startsWith("### ")) {
      return (
        <h3
          key={`heading-${index}`}
          className="mb-2 mt-5 border-b border-slate-800 pb-2 text-sm font-semibold text-cyan-100 first:mt-0"
        >
          {cleanLine.replace(/^###?\s+/, "")}
        </h3>
      );
    }

    if (/^[-*]\s+/.test(cleanLine) || /^\d+\.\s+/.test(cleanLine)) {
      const text = cleanLine.replace(/^([-*]|\d+\.)\s+/, "");
      return (
        <p key={`bullet-${index}`} className="flex gap-2 text-sm leading-6 text-slate-300">
          <span className="text-cyan-400">-</span>
          <span>{renderInlineText(text)}</span>
        </p>
      );
    }

    return (
      <p key={`text-${index}`} className="text-sm leading-6 text-slate-300">
        {renderInlineText(cleanLine)}
      </p>
    );
  });
}

export default function AiSummary({
  coin,
  marketData,
  scoring,
  defiData,
  realizedVolatility,
  canGenerate,
}: AiSummaryProps) {
  const [summary, setSummary] = useState<AiSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const latestRequestId = useRef(0);

  useEffect(() => {
    latestRequestId.current += 1;
    requestController.current?.abort();
    setSummary(null);
    setError(null);
    setIsLoading(false);
  }, [coin.coinId]);

  async function handleGenerateSummary() {
    if (!marketData || !scoring || !defiData || !canGenerate) {
      return;
    }

    const requestId = latestRequestId.current + 1;
    const controller = new AbortController();
    const input: AiSummaryRequest = {
      coin: {
        id: coin.coinId,
        symbol: coin.symbol,
        name: coin.name,
      },
      marketData: {
        currentPrice: marketData.currentPrice,
        marketCap: marketData.marketCap,
        totalVolume: marketData.totalVolume,
        priceChangePercentage24h: marketData.priceChangePercentage24h,
        priceChangePercentage7d: marketData.priceChangePercentage7d,
        priceChangePercentage30d: marketData.priceChangePercentage30d,
        ath: marketData.ath,
        athChangePercentage: marketData.athChangePercentage,
        volatility30d: realizedVolatility,
      },
      scoring,
      defiData,
    };

    latestRequestId.current = requestId;
    requestController.current?.abort();
    requestController.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const data = (await response.json()) as AiSummaryResponse | AiSummaryError;

      if (controller.signal.aborted || requestId !== latestRequestId.current) {
        return;
      }

      if (!response.ok || isAiSummaryError(data)) {
        setError(
          isAiSummaryError(data)
            ? data.message
            : "AI summary could not be generated right now. Please try again.",
        );
        return;
      }

      setSummary(data);
    } catch {
      if (controller.signal.aborted || requestId !== latestRequestId.current) {
        return;
      }

      setError("AI summary could not be generated right now. Please try again.");
    } finally {
      if (!controller.signal.aborted && requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            AI Analyst Summary
          </p>
          <h2 className="mt-2 text-lg font-semibold">{coin.symbol} research note</h2>
          <p className="mt-1 text-sm text-slate-500">On-demand structured data summary</p>
        </div>
        <BrainCircuit className="text-cyan-300" size={22} />
      </div>

      {!summary && !isLoading && (
        <p className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm leading-6 text-slate-300">
          Click Generate AI Summary to create a structured research note based on the
          current market, score, and DeFi data.
        </p>
      )}

      {isLoading && (
        <div className="flex min-h-32 items-center justify-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/5 text-sm text-slate-300">
          <LoaderCircle className="animate-spin text-cyan-300" size={18} />
          Generating structured AI summary...
        </div>
      )}

      {summary && !isLoading && (
        <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4 sm:p-5">
          {renderSummary(summary.summary)}
          <p className="mt-5 text-xs text-slate-500">
            Generated with Gemini ({summary.model}) at{" "}
            {new Date(summary.generatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {error && !isLoading && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm leading-6 text-rose-200">
          <TriangleAlert className="mt-1 shrink-0" size={16} />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerateSummary}
        disabled={!canGenerate || isLoading}
        className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
      >
        {isLoading
          ? "Generating..."
          : summary
            ? "Regenerate AI Summary"
            : "Generate AI Summary"}
      </button>

      {!canGenerate && !isLoading && (
        <p className="mt-3 text-xs text-slate-500">
          Load the selected coin's market and DeFi data before generating a summary.
        </p>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        AI summary is based only on available structured data and is not financial advice.
      </p>
    </section>
  );
}
