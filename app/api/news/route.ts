import { NextRequest, NextResponse } from "next/server";
import {
  createNewsErrorResponse,
  getNewsSentimentContext,
} from "@/lib/news";
import type { NewsSentimentData } from "@/types/crypto";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 5 * 60_000;
const successfulResponses = new Map<
  string,
  { expiresAt: number; data: NewsSentimentData }
>();

function isSafeOptionalText(value: string) {
  return value.length <= 80 && /^[a-zA-Z0-9 -]*$/.test(value);
}

function normalizeName(coinId: string, name: string, symbol: string) {
  return name || coinId || symbol || "crypto";
}

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("coinId")?.trim().toLowerCase() ?? "";
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";

  try {
    if (
      (!coinId && !symbol && !name) ||
      (coinId && !/^[a-z0-9-]+$/.test(coinId)) ||
      !isSafeOptionalText(symbol) ||
      !isSafeOptionalText(name)
    ) {
      return NextResponse.json<NewsSentimentData>(
        createNewsErrorResponse("Please provide a valid asset ID, symbol, and name."),
        { status: 400 },
      );
    }

    const safeName = normalizeName(coinId, name, symbol);
    const cacheKey = `${coinId}:${symbol}:${safeName.toLowerCase()}`;
    const cached = successfulResponses.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const data = await getNewsSentimentContext({
      coinId,
      symbol,
      name: safeName,
    });

    if (data.sourceAvailable) {
      successfulResponses.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_DURATION_MS,
      });
    }

    return NextResponse.json(data);
  } catch {
    console.error("Unexpected GDELT news route failure", { coinId, symbol });
    return NextResponse.json<NewsSentimentData>(
      createNewsErrorResponse("Recent headline context is temporarily unavailable."),
      { status: 500 },
    );
  }
}
