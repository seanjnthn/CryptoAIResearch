import { NextResponse } from "next/server";
import { getMacroSentimentContext } from "@/lib/macro";
import type { MacroSentimentData } from "@/types/crypto";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 5 * 60_000;
let cachedResponse:
  | { expiresAt: number; data: MacroSentimentData }
  | undefined;

export async function GET() {
  if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
    return NextResponse.json(cachedResponse.data);
  }

  const data = await getMacroSentimentContext();

  if (data.sourceAvailable) {
    cachedResponse = {
      expiresAt: Date.now() + CACHE_DURATION_MS,
      data,
    };
  }

  return NextResponse.json(data);
}
