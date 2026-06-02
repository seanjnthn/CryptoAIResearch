import { CircleMinus, ExternalLink, LoaderCircle, Newspaper } from "lucide-react";
import type { NewsSentimentData, NewsSentimentLabel } from "@/types/crypto";

interface NewsSentimentPanelProps {
  data: NewsSentimentData | null;
  isLoading: boolean;
}

function getSentimentStyle(label: NewsSentimentLabel) {
  if (label === "Positive") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (label === "Negative") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }

  if (label === "Mixed") {
    return "border-violet-400/20 bg-violet-400/10 text-violet-200";
  }

  return "border-slate-700 bg-slate-950/50 text-slate-300";
}

function formatPublishedAt(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function NewsSentimentPanel({
  data,
  isLoading,
}: NewsSentimentPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6 lg:col-span-2">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            News &amp; Sentiment Context
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Recent headline backdrop
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            GDELT headlines with a transparent keyword-only sentiment label
          </p>
        </div>
        <Newspaper className="shrink-0 text-cyan-300" size={22} />
      </div>

      {isLoading && (
        <div className="flex min-h-28 items-center gap-3 text-sm text-slate-400">
          <LoaderCircle className="animate-spin text-cyan-300" size={18} />
          Loading recent headline context...
        </div>
      )}

      {!isLoading && data?.sourceAvailable && (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs text-slate-500">Query used</p>
              <p className="mt-1 text-sm text-slate-300">{data.query}</p>
              <p className="mt-2 text-xs text-slate-500">
                Positive keyword matches: {data.positiveCount} | Negative keyword
                matches: {data.negativeCount}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getSentimentStyle(data.sentimentLabel)}`}
            >
              {data.sentimentLabel}
            </span>
          </div>

          <div className="space-y-3">
            {data.articles.map((article) => {
              const publishedAt = formatPublishedAt(article.publishedAt);

              return (
                <article
                  key={`${article.domain ?? article.source ?? ""}-${article.title}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/45 p-4"
                >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-3 text-sm font-medium leading-6 text-slate-100 transition hover:text-cyan-200"
                  >
                    <span>{article.title}</span>
                    <ExternalLink className="mt-1 shrink-0" size={14} />
                  </a>
                  <p className="mt-2 text-xs text-slate-500">
                    {[article.domain ?? article.source, publishedAt, article.language]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                </article>
              );
            })}
          </div>

          <ul className="mt-5 space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
            {data.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {!isLoading && (!data || !data.sourceAvailable) && (
        <div className="flex min-h-28 items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-400">
          <CircleMinus className="mt-1 shrink-0 text-slate-500" size={17} />
          <div>
            <p className="font-medium text-slate-300">
              Recent headline context unavailable
            </p>
            <p className="mt-1">
              {data?.message ?? "No recent headlines found for this asset."}
            </p>
            {data?.query && (
              <p className="mt-2 text-xs text-slate-500">Query attempted: {data.query}</p>
            )}
            {data?.upstreamMessage && (
              <p className="mt-2 text-xs text-slate-500">
                Provider detail: {data.upstreamMessage}
              </p>
            )}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Headline sentiment is heuristic and may be noisy. It provides context only
        and is not a standalone trading signal.
      </p>
    </section>
  );
}
