import { NextRequest, NextResponse } from "next/server";
import { AiSummaryRequestError, GEMINI_MODEL, generateAiSummary } from "@/lib/ai";
import type { AiSummaryRequest, AiSummaryError } from "@/types/crypto";

export const dynamic = "force-dynamic";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalNumber(value: unknown) {
  return value === undefined || isNumber(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isNullableNumber(value: unknown) {
  return value === null || isNumber(value);
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidRequest(data: unknown): data is AiSummaryRequest {
  if (!data || typeof data !== "object") return false;

  const input = data as Partial<AiSummaryRequest>;
  const market = input.marketData;
  const scoring = input.scoring;
  const marketScore = scoring?.marketScore;
  const contextScore = scoring?.contextScore;
  const compositeView = scoring?.compositeView;
  const defi = input.defiData;
  const macro = input.macroData;
  const onchain = input.onchainData;
  const news = input.newsData;

  return Boolean(
    input.coin &&
      typeof input.coin.id === "string" &&
      typeof input.coin.symbol === "string" &&
      typeof input.coin.name === "string" &&
      market &&
      isNumber(market.currentPrice) &&
      isNumber(market.marketCap) &&
      isNumber(market.totalVolume) &&
      isNumber(market.priceChangePercentage24h) &&
      isNumber(market.priceChangePercentage7d) &&
      isNumber(market.priceChangePercentage30d) &&
      isNumber(market.ath) &&
      isNumber(market.athChangePercentage) &&
      (market.volatility30d === null || isNumber(market.volatility30d)) &&
      scoring &&
      marketScore &&
      isNumber(marketScore.totalScore) &&
      isNumber(marketScore.trendScore) &&
      isNumber(marketScore.liquidityScore) &&
      isNumber(marketScore.volatilityScore) &&
      isNumber(marketScore.drawdownScore) &&
      isNumber(marketScore.fundamentalScore) &&
      ["Strong", "Constructive", "Neutral", "Weak", "High Risk"].includes(
        marketScore.verdict,
      ) &&
      isStringArray(marketScore.notes) &&
      contextScore &&
      isNumber(contextScore.totalScore) &&
      isNumber(contextScore.macroScore) &&
      isNumber(contextScore.fearGreedScore) &&
      isNumber(contextScore.newsScore) &&
      isNumber(contextScore.onchainScore) &&
      ["Supportive", "Neutral", "Mixed", "Risky", "Unavailable"].includes(
        contextScore.verdict,
      ) &&
      isStringArray(contextScore.notes) &&
      compositeView &&
      ["Constructive", "Neutral", "Mixed", "Caution", "High Risk"].includes(
        compositeView.label,
      ) &&
      typeof compositeView.explanation === "string" &&
      defi &&
      typeof defi.sourceAvailable === "boolean" &&
      typeof defi.label === "string" &&
      macro &&
      typeof macro.sourceAvailable === "boolean" &&
      isOptionalNumber(macro.totalCryptoMarketCap) &&
      isOptionalNumber(macro.totalCryptoVolume) &&
      isOptionalNumber(macro.btcDominance) &&
      isOptionalNumber(macro.ethDominance) &&
      isOptionalNumber(macro.marketCapChange24h) &&
      isOptionalNumber(macro.fearGreedValue) &&
      isOptionalString(macro.fearGreedClassification) &&
      isOptionalString(macro.fearGreedTimestamp) &&
      ["Risk-on", "Neutral", "Risk-off", "Mixed", "Unavailable"].includes(
        macro.regime,
      ) &&
      isStringArray(macro.notes) &&
      macro.notes.every((note) => typeof note === "string") &&
      onchain &&
      typeof onchain.sourceAvailable === "boolean" &&
      onchain.provider === "coinmetrics" &&
      typeof onchain.coinId === "string" &&
      isNullableString(onchain.asset) &&
      isNullableString(onchain.attemptedUrl) &&
      isNullableNumber(onchain.upstreamStatus) &&
      isNullableString(onchain.upstreamMessage) &&
      isStringArray(onchain.availableMetricsTried) &&
      isNullableString(onchain.metricLabel) &&
      isNullableString(onchain.time) &&
      isNullableNumber(onchain.mvrv) &&
      isNullableNumber(onchain.realizedCapUsd) &&
      isNullableNumber(onchain.marketCapUsd) &&
      [
        "Undervalued/Capitulation Zone",
        "Neutral",
        "Elevated",
        "Overheated",
        "Unavailable",
      ].includes(onchain.valuationState) &&
      isStringArray(onchain.notes) &&
      typeof onchain.message === "string" &&
      typeof onchain.error === "boolean" &&
      news &&
      typeof news.sourceAvailable === "boolean" &&
      news.provider === "gdelt" &&
      typeof news.query === "string" &&
      isStringArray(news.attemptedUrls) &&
      isNullableNumber(news.upstreamStatus) &&
      isNullableString(news.upstreamMessage) &&
      isNumber(news.rawResultCount) &&
      Array.isArray(news.articles) &&
      news.articles.every(
        (article) =>
          typeof article.title === "string" &&
          typeof article.url === "string" &&
          isNullableString(article.source) &&
          isNullableString(article.publishedAt) &&
          isNullableString(article.language) &&
          isNullableString(article.domain),
      ) &&
      ["Positive", "Neutral", "Negative", "Mixed", "Unavailable"].includes(
        news.sentimentLabel,
      ) &&
      isNumber(news.positiveCount) &&
      isNumber(news.negativeCount) &&
      isStringArray(news.notes) &&
      typeof news.message === "string" &&
      typeof news.error === "boolean",
  );
}

export async function POST(request: NextRequest) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json<AiSummaryError>(
      { error: true, message: "Please provide valid dashboard data." },
      { status: 400 },
    );
  }

  if (!isValidRequest(input)) {
    return NextResponse.json<AiSummaryError>(
      {
        error: true,
        message:
          "Please load current market, DeFi, and macro context before generating a summary.",
      },
      { status: 400 },
    );
  }

  try {
    const summary = await generateAiSummary(input);

    return NextResponse.json({
      summary,
      generatedAt: new Date().toISOString(),
      provider: "gemini" as const,
      model: GEMINI_MODEL,
    });
  } catch (error) {
    const responseError =
      error instanceof AiSummaryRequestError
        ? error
        : new AiSummaryRequestError(
            "AI summary could not be generated right now. Please try again.",
            500,
          );

    return NextResponse.json<AiSummaryError>(
      {
        error: true,
        code: responseError.code,
        message: responseError.message,
      },
      { status: responseError.status },
    );
  }
}
