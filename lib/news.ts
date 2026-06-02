import "server-only";

import type {
  NewsArticle,
  NewsSentimentData,
  NewsSentimentLabel,
} from "@/types/crypto";

const GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const MAX_RESULTS = 10;
const DISPLAY_RESULTS = 8;
const positiveKeywords = [
  "rally",
  "surge",
  "gain",
  "inflow",
  "approval",
  "adoption",
  "upgrade",
  "partnership",
  "record",
  "strong",
  "breakout",
  "recover",
];
const negativeKeywords = [
  "hack",
  "exploit",
  "lawsuit",
  "ban",
  "outflow",
  "crash",
  "plunge",
  "liquidation",
  "investigation",
  "fraud",
  "risk",
  "decline",
  "drop",
];
const contextNotes = [
  "Headline sentiment is heuristic and may be noisy.",
  "News headlines provide context only and are not standalone trading signals.",
];
const noArticleNotes = [
  "GDELT coverage can be noisy or query-sensitive.",
  "Try a broader coin name or symbol.",
];

type RawArticle = Record<string, unknown>;

interface NewsQueryInput {
  coinId: string;
  symbol: string;
  name: string;
}

interface AttemptResult {
  articles: NewsArticle[];
  rawResultCount: number;
  upstreamStatus: number | null;
  upstreamMessage: string | null;
  stopTrying: boolean;
  networkFailed: boolean;
}

function cleanText(value: string) {
  return value.replace(/[^a-zA-Z0-9 -]/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

export function buildNewsQueries({ coinId, symbol, name }: NewsQueryInput) {
  const normalizedCoinId = cleanText(coinId).toLowerCase();
  const safeName =
    cleanText(name) || cleanText(coinId) || cleanText(symbol) || "crypto";
  const safeSymbol = cleanText(symbol).toUpperCase();

  if (normalizedCoinId === "bitcoin" || safeName.toLowerCase() === "bitcoin") {
    return ["bitcoin crypto", "bitcoin OR BTC", "bitcoin"];
  }

  if (normalizedCoinId === "ethereum" || safeName.toLowerCase() === "ethereum") {
    return ["ethereum crypto", "ethereum OR ETH", "ethereum"];
  }

  if (normalizedCoinId === "solana" || safeName.toLowerCase() === "solana") {
    return ["solana crypto", "solana OR SOL", "solana"];
  }

  return unique([
    `"${safeName}" crypto`,
    safeSymbol ? `"${safeName}" OR "${safeSymbol}"` : `"${safeName}"`,
    `"${safeName}"`,
  ]);
}

function createNewsResponse(
  overrides: Partial<NewsSentimentData> = {},
): NewsSentimentData {
  return {
    sourceAvailable: false,
    provider: "gdelt",
    query: "",
    attemptedUrls: [],
    upstreamStatus: null,
    upstreamMessage: null,
    rawResultCount: 0,
    articles: [],
    sentimentLabel: "Unavailable",
    positiveCount: 0,
    negativeCount: 0,
    notes: contextNotes,
    message: "Recent headline context is temporarily unavailable.",
    error: false,
    ...overrides,
  };
}

export function createNewsErrorResponse(message: string): NewsSentimentData {
  return createNewsResponse({
    notes: noArticleNotes,
    message,
    error: true,
  });
}

function buildGdeltUrl(query: string, includeSort: boolean) {
  const search = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "json",
    maxrecords: String(MAX_RESULTS),
  });

  if (includeSort) {
    search.set("sort", "HybridRel");
  }

  return `${GDELT_DOC_URL}?${search.toString()}`;
}

function toStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toArticleUrl(value: unknown) {
  const rawUrl = toStringValue(value);
  if (!rawUrl) return null;

  try {
    const parsedUrl = new URL(rawUrl);
    return ["http:", "https:"].includes(parsedUrl.protocol)
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

function parsePublishedAt(value: unknown) {
  const rawDate = toStringValue(value);
  if (!rawDate) return null;

  const gdeltDate = rawDate.match(
    /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/,
  );

  if (gdeltDate) {
    const [, year, month, day, hour, minute, second] = gdeltDate;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }

  const timestamp = Date.parse(rawDate);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function getRawItems(responseData: unknown): RawArticle[] {
  if (Array.isArray(responseData)) {
    return responseData.filter(
      (item): item is RawArticle => Boolean(item && typeof item === "object"),
    );
  }

  if (!responseData || typeof responseData !== "object") {
    return [];
  }

  const candidate = responseData as { articles?: unknown; items?: unknown };

  if (Array.isArray(candidate.articles)) {
    return candidate.articles.filter(
      (item): item is RawArticle => Boolean(item && typeof item === "object"),
    );
  }

  if (Array.isArray(candidate.items)) {
    return candidate.items.filter(
      (item): item is RawArticle => Boolean(item && typeof item === "object"),
    );
  }

  return [];
}

function normalizeArticles(rawItems: RawArticle[]) {
  const titles = new Set<string>();
  const domains = new Set<string>();
  const normalized: NewsArticle[] = [];

  for (const item of rawItems) {
    const title = toStringValue(item.title) ?? toStringValue(item.name);
    const url = toArticleUrl(item.url);

    if (!title || !url) continue;

    const fallbackDomain = new URL(url).hostname.replace(/^www\./, "");
    const domain =
      toStringValue(item.domain) ??
      toStringValue(item.source) ??
      toStringValue(item.home_page_url) ??
      fallbackDomain;
    const normalizedTitle = title.toLowerCase().replace(/\s+/g, " ");
    const normalizedDomain = domain.toLowerCase();

    if (titles.has(normalizedTitle) || domains.has(normalizedDomain)) continue;

    titles.add(normalizedTitle);
    domains.add(normalizedDomain);
    normalized.push({
      title,
      url,
      source: toStringValue(item.source) ?? domain,
      domain,
      publishedAt:
        parsePublishedAt(item.seendate) ??
        parsePublishedAt(item.date) ??
        parsePublishedAt(item.date_published) ??
        parsePublishedAt(item.publishedAt),
      language: toStringValue(item.language),
    });
  }

  return normalized.slice(0, DISPLAY_RESULTS);
}

function hasKeyword(title: string, keyword: string) {
  return new RegExp(`\\b${keyword}\\b`, "i").test(title);
}

function classifySentiment(articles: NewsArticle[]) {
  let positiveCount = 0;
  let negativeCount = 0;

  for (const article of articles) {
    if (positiveKeywords.some((keyword) => hasKeyword(article.title, keyword))) {
      positiveCount += 1;
    }

    if (negativeKeywords.some((keyword) => hasKeyword(article.title, keyword))) {
      negativeCount += 1;
    }
  }

  let sentimentLabel: NewsSentimentLabel = "Neutral";

  if (positiveCount > negativeCount && negativeCount === 0) {
    sentimentLabel = "Positive";
  } else if (negativeCount > positiveCount && positiveCount === 0) {
    sentimentLabel = "Negative";
  } else if (positiveCount > 0 && negativeCount > 0) {
    sentimentLabel = "Mixed";
  }

  return { sentimentLabel, positiveCount, negativeCount };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const cause = error.cause as { message?: string } | undefined;
    return cause?.message ?? error.message;
  }

  return "GDELT request could not be completed.";
}

async function tryGdeltUrl(url: string): Promise<AttemptResult> {
  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
      headers: {
        Accept: "application/json",
        "User-Agent": "Crypto AI Research Dashboard/1.0",
      },
    });
  } catch (error) {
    return {
      articles: [],
      rawResultCount: 0,
      upstreamStatus: null,
      upstreamMessage: getErrorMessage(error),
      stopTrying: false,
      networkFailed: true,
    };
  }

  const responseBody = await response.text();

  if (!response.ok) {
    return {
      articles: [],
      rawResultCount: 0,
      upstreamStatus: response.status,
      upstreamMessage: `GDELT returned status ${response.status}.`,
      stopTrying: false,
      networkFailed: false,
    };
  }

  let responseData: unknown;

  try {
    responseData = JSON.parse(responseBody);
  } catch {
    console.warn("GDELT returned a non-JSON response", {
      status: response.status,
      preview: responseBody.slice(0, 300),
    });

    return {
      articles: [],
      rawResultCount: 0,
      upstreamStatus: response.status,
      upstreamMessage: "GDELT returned a non-JSON response.",
      stopTrying: false,
      networkFailed: false,
    };
  }

  const rawItems = getRawItems(responseData);

  return {
    articles: normalizeArticles(rawItems),
    rawResultCount: rawItems.length,
    upstreamStatus: response.status,
    upstreamMessage: null,
    stopTrying: false,
    networkFailed: false,
  };
}

export async function getNewsSentimentContext(
  input: NewsQueryInput,
): Promise<NewsSentimentData> {
  const queries = buildNewsQueries(input);
  const attemptedUrls: string[] = [];
  let lastStatus: number | null = null;
  let lastMessage: string | null = null;
  let lastRawResultCount = 0;

  for (const query of queries) {
    const urls = [buildGdeltUrl(query, true), buildGdeltUrl(query, false)];

    for (const url of urls) {
      attemptedUrls.push(url);
      const result = await tryGdeltUrl(url);

      lastStatus = result.upstreamStatus;
      lastMessage = result.upstreamMessage;
      lastRawResultCount = result.rawResultCount;

      if (result.articles.length > 0) {
        const sentiment = classifySentiment(result.articles);

        return createNewsResponse({
          sourceAvailable: true,
          query,
          attemptedUrls,
          upstreamStatus: result.upstreamStatus,
          upstreamMessage: null,
          rawResultCount: result.rawResultCount,
          articles: result.articles,
          ...sentiment,
          notes: contextNotes,
          message: "Recent GDELT headlines loaded.",
          error: false,
        });
      }

      if (result.stopTrying) {
        return createNewsResponse({
          query,
          attemptedUrls,
          upstreamStatus: result.upstreamStatus,
          upstreamMessage: result.upstreamMessage,
          rawResultCount: result.rawResultCount,
          notes: contextNotes,
          message: "GDELT request could not be completed.",
          error: true,
        });
      }

      if (result.networkFailed) {
        break;
      }
    }
  }

  return createNewsResponse({
    query: queries[0] ?? "",
    attemptedUrls,
    upstreamStatus: lastStatus,
    upstreamMessage: lastMessage,
    rawResultCount: lastRawResultCount,
    notes: noArticleNotes,
    message: lastMessage ?? "No recent GDELT headlines found for this asset/query.",
    error: Boolean(lastMessage),
  });
}
