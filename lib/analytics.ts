import type { HistoricalChartPoint } from "@/types/crypto";

export function calculateRealizedVolatility(chartData: HistoricalChartPoint[]) {
  const dailyClosingPrices = new Map<string, { timestamp: number; price: number }>();

  chartData.forEach((point) => {
    const timestamp = new Date(point.date).getTime();

    if (!Number.isFinite(timestamp) || !Number.isFinite(point.price) || point.price <= 0) {
      return;
    }

    const date = new Date(timestamp).toISOString().slice(0, 10);
    const existingClose = dailyClosingPrices.get(date);

    if (!existingClose || timestamp > existingClose.timestamp) {
      dailyClosingPrices.set(date, { timestamp, price: point.price });
    }
  });

  const closingPrices = Array.from(dailyClosingPrices.values())
    .sort((first, second) => first.timestamp - second.timestamp)
    .map((point) => point.price);

  if (closingPrices.length < 3) {
    return null;
  }

  const dailyReturns: number[] = [];

  for (let index = 1; index < closingPrices.length; index += 1) {
    dailyReturns.push((closingPrices[index] - closingPrices[index - 1]) / closingPrices[index - 1]);
  }

  if (dailyReturns.length < 2) {
    return null;
  }

  const averageReturn =
    dailyReturns.reduce((total, dailyReturn) => total + dailyReturn, 0) /
    dailyReturns.length;
  const variance =
    dailyReturns.reduce(
      (total, dailyReturn) => total + (dailyReturn - averageReturn) ** 2,
      0,
    ) /
    (dailyReturns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(365) * 100;
}
