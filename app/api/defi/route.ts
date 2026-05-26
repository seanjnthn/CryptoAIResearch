import { NextRequest, NextResponse } from "next/server";
import { getDefiFundamentals } from "@/lib/defillama";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("coinId")?.toLowerCase();

  if (!coinId || !/^[a-z0-9-]+$/.test(coinId)) {
    return NextResponse.json(
      {
        sourceAvailable: false,
        label: coinId ?? "",
        message: "Please select a valid asset.",
        error: true,
      },
      { status: 400 },
    );
  }

  const result = await getDefiFundamentals(coinId);

  return NextResponse.json(result, { status: result.error ? 502 : 200 });
}
