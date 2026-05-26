import { NextRequest, NextResponse } from "next/server";
import { createOnchainErrorResponse, getOnchainValuation } from "@/lib/onchain";
import type { OnchainValuationData } from "@/types/crypto";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 10 * 60_000;
const successfulResponses = new Map<
  string,
  { expiresAt: number; data: OnchainValuationData }
>();

export async function GET(request: NextRequest) {
  const rawCoinId = request.nextUrl.searchParams.get("coinId");
  const coinId = rawCoinId?.toLowerCase() ?? "";

  try {
    if (!coinId || !/^[a-z0-9-]+$/.test(coinId)) {
      return NextResponse.json<OnchainValuationData>(
        createOnchainErrorResponse(
          coinId,
          "Please provide a valid CoinGecko coin ID.",
        ),
        { status: 400 },
      );
    }

    const cachedResponse = successfulResponses.get(coinId);

    if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
      return NextResponse.json<OnchainValuationData>(cachedResponse.data);
    }

    const data = await getOnchainValuation(coinId);

    if (data.sourceAvailable) {
      successfulResponses.set(coinId, {
        expiresAt: Date.now() + CACHE_DURATION_MS,
        data,
      });
    }

    return NextResponse.json<OnchainValuationData>(data);
  } catch {
    console.error("Unexpected on-chain valuation route failure", { coinId });

    return NextResponse.json<OnchainValuationData>(
      createOnchainErrorResponse(
        coinId,
        "On-chain valuation context could not be loaded right now.",
      ),
      { status: 500 },
    );
  }
}
