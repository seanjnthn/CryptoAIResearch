import { NextRequest, NextResponse } from "next/server";
import {
  CoinGeckoError,
  getCoinHistoricalChart,
  getCoinMarketData,
} from "@/lib/coingecko";
import type { MarketApiError, MarketApiResponse } from "@/types/crypto";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 2 * 60_000;
const RATE_LIMIT_CACHE_WARNING =
  "Showing cached data because CoinGecko rate limit was reached.";
const UNAVAILABLE_CACHE_WARNING =
  "Showing cached data because live CoinGecko data is temporarily unavailable.";
const successfulResponses = new Map<
  string,
  { expiresAt: number; data: MarketApiResponse }
>();
const inFlightRequests = new Map<string, Promise<MarketApiResponse>>();

function createErrorResponse(status: number, detail: string) {
  const error: MarketApiError = {
    error: true,
    message: "CoinGecko request failed",
    status,
    detail,
  };

  return NextResponse.json(error, { status });
}

function getCachedFallback(requestKey: string, warning: string) {
  const cachedResponse = successfulResponses.get(requestKey);

  if (!cachedResponse) {
    return null;
  }

  return NextResponse.json({
    ...cachedResponse.data,
    stale: true,
    warning,
  });
}

async function loadMarketData(coinId: string, days: number) {
  const requestKey = `${coinId}:${days}`;
  const cachedResponse = successfulResponses.get(requestKey);

  if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
    return cachedResponse.data;
  }

  const currentRequest = inFlightRequests.get(requestKey);

  if (currentRequest) {
    return currentRequest;
  }

  const request = Promise.all([
    getCoinMarketData(coinId),
    getCoinHistoricalChart(coinId, days),
  ])
    .then(([market, chart]) => {
      const data = { market, chart };

      successfulResponses.set(requestKey, {
        expiresAt: Date.now() + CACHE_DURATION_MS,
        data,
      });

      return data;
    })
    .finally(() => {
      inFlightRequests.delete(requestKey);
    });

  inFlightRequests.set(requestKey, request);
  return request;
}

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("coinId");
  const daysValue = Number(request.nextUrl.searchParams.get("days") ?? "30");

  if (!coinId || !/^[a-z0-9-]+$/.test(coinId)) {
    return createErrorResponse(400, "Please select a valid coin");
  }

  if (!Number.isInteger(daysValue) || daysValue < 1 || daysValue > 365) {
    return createErrorResponse(400, "Please choose a valid chart period");
  }

  const requestKey = `${coinId}:${daysValue}`;

  try {
    const data = await loadMarketData(coinId, daysValue);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof CoinGeckoError) {
      console.error("CoinGecko market request failed", {
        coinId,
        days: daysValue,
        status: error.status,
        detail: error.detail,
      });

      const cachedFallback = getCachedFallback(
        requestKey,
        error.status === 429 ? RATE_LIMIT_CACHE_WARNING : UNAVAILABLE_CACHE_WARNING,
      );

      if (cachedFallback) {
        return cachedFallback;
      }

      return createErrorResponse(error.status, error.detail);
    }

    console.error("Unexpected CoinGecko market request failure", {
      coinId,
      days: daysValue,
      error,
    });

    const cachedFallback = getCachedFallback(requestKey, UNAVAILABLE_CACHE_WARNING);

    if (cachedFallback) {
      return cachedFallback;
    }

    return createErrorResponse(502, "CoinGecko service temporarily unavailable.");
  }
}
