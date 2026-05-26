import { NextRequest, NextResponse } from "next/server";
import { AiSummaryRequestError, GEMINI_MODEL, generateAiSummary } from "@/lib/ai";
import type { AiSummaryRequest, AiSummaryError } from "@/types/crypto";

export const dynamic = "force-dynamic";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidRequest(data: unknown): data is AiSummaryRequest {
  if (!data || typeof data !== "object") return false;

  const input = data as Partial<AiSummaryRequest>;
  const market = input.marketData;
  const scoring = input.scoring;
  const defi = input.defiData;

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
      isNumber(scoring.totalScore) &&
      isNumber(scoring.trendScore) &&
      isNumber(scoring.liquidityScore) &&
      isNumber(scoring.volatilityScore) &&
      isNumber(scoring.drawdownScore) &&
      isNumber(scoring.fundamentalScore) &&
      typeof scoring.verdict === "string" &&
      Array.isArray(scoring.notes) &&
      defi &&
      typeof defi.sourceAvailable === "boolean" &&
      typeof defi.label === "string",
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
        message: "Please load current market and DeFi data before generating a summary.",
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
