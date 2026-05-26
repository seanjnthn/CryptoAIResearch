import "server-only";

import type { DefiFundamentalsData } from "@/types/crypto";

const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const UNAVAILABLE_MESSAGE =
  "DeFi fundamentals unavailable or not relevant for this asset.";
const ERROR_MESSAGE = "DeFi fundamentals temporarily unavailable.";

const chainLabels: Record<string, string> = {
  ethereum: "Ethereum",
  solana: "Solana",
  sui: "Sui",
  hyperliquid: "Hyperliquid",
};

interface DefiLlamaTvlPoint {
  date: number;
  tvl: number;
}

function getUnavailableResult(coinId: string): DefiFundamentalsData {
  return {
    sourceAvailable: false,
    label: coinId,
    message: UNAVAILABLE_MESSAGE,
  };
}

function getPercentageChange(currentValue: number, previousValue?: number) {
  if (previousValue === undefined || previousValue <= 0) {
    return undefined;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

function findTvlDaysBefore(history: DefiLlamaTvlPoint[], days: number) {
  const latestTimestamp = history[history.length - 1].date;
  const targetTimestamp = latestTimestamp - days * 24 * 60 * 60;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].date <= targetTimestamp) {
      return history[index].tvl;
    }
  }

  return undefined;
}

export async function getDefiFundamentals(
  coinId: string,
): Promise<DefiFundamentalsData> {
  const normalizedCoinId = coinId.toLowerCase();
  const chainLabel = chainLabels[normalizedCoinId];

  if (!chainLabel) {
    return getUnavailableResult(normalizedCoinId);
  }

  try {
    const response = await fetch(
      `${DEFILLAMA_BASE_URL}/v2/historicalChainTvl/${encodeURIComponent(chainLabel)}`,
      { cache: "no-store" },
    );

    if (response.status === 404) {
      return getUnavailableResult(normalizedCoinId);
    }

    if (!response.ok) {
      console.error("DeFiLlama request failed", {
        coinId: normalizedCoinId,
        status: response.status,
      });

      return {
        sourceAvailable: false,
        label: chainLabel,
        message: ERROR_MESSAGE,
        error: true,
      };
    }

    const responseData = (await response.json()) as DefiLlamaTvlPoint[];
    const history = responseData
      .filter(
        (point) =>
          Number.isFinite(point.date) &&
          Number.isFinite(point.tvl) &&
          point.tvl >= 0,
      )
      .sort((first, second) => first.date - second.date);

    if (history.length === 0) {
      return getUnavailableResult(normalizedCoinId);
    }

    const currentTvl = history[history.length - 1].tvl;

    return {
      sourceAvailable: true,
      label: chainLabel,
      tvl: currentTvl,
      tvlChange1d: getPercentageChange(currentTvl, findTvlDaysBefore(history, 1)),
      tvlChange7d: getPercentageChange(currentTvl, findTvlDaysBefore(history, 7)),
      tvlChange30d: getPercentageChange(currentTvl, findTvlDaysBefore(history, 30)),
      message: "TVL data loaded from DeFiLlama.",
    };
  } catch (error) {
    console.error("DeFiLlama request failed", {
      coinId: normalizedCoinId,
      error,
    });

    return {
      sourceAvailable: false,
      label: chainLabel,
      message: ERROR_MESSAGE,
      error: true,
    };
  }
}
