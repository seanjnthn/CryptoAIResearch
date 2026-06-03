import type {
  HistoricalChartPoint,
  TechnicalMacd,
  TechnicalMetrics,
  VolumeTrend,
} from "@/types/crypto";

interface DailyMarketPoint {
  date: string;
  timestamp: number;
  price: number;
  volume: number | null;
}

function getDailyMarketPoints(chartData: HistoricalChartPoint[]) {
  const dailyPoints = new Map<string, DailyMarketPoint>();

  chartData.forEach((point) => {
    const timestamp = new Date(point.date).getTime();

    if (!Number.isFinite(timestamp) || !Number.isFinite(point.price) || point.price <= 0) {
      return;
    }

    const date = new Date(timestamp).toISOString().slice(0, 10);
    const existingPoint = dailyPoints.get(date);

    if (!existingPoint || timestamp > existingPoint.timestamp) {
      dailyPoints.set(date, {
        date,
        timestamp,
        price: point.price,
        volume:
          typeof point.volume === "number" && Number.isFinite(point.volume)
            ? point.volume
            : null,
      });
    }
  });

  return Array.from(dailyPoints.values()).sort(
    (first, second) => first.timestamp - second.timestamp,
  );
}

function calculateEmaSeries(values: number[], period: number) {
  const series: Array<number | null> = Array(values.length).fill(null);

  if (values.length < period) {
    return series;
  }

  const multiplier = 2 / (period + 1);
  let ema =
    values.slice(0, period).reduce((total, value) => total + value, 0) / period;
  series[period - 1] = ema;

  for (let index = period; index < values.length; index += 1) {
    ema = (values[index] - ema) * multiplier + ema;
    series[index] = ema;
  }

  return series;
}

function getLatestEma(values: number[], period: number) {
  const series = calculateEmaSeries(values, period);
  return series.findLast((value) => value !== null) ?? null;
}

function calculateRsi(values: number[], period = 14) {
  if (values.length < period + 1) {
    return null;
  }

  const recentValues = values.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < recentValues.length; index += 1) {
    const change = recentValues[index] - recentValues[index - 1];

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

function calculateMacd(values: number[]): TechnicalMacd | null {
  if (values.length < 35) {
    return null;
  }

  const ema12 = calculateEmaSeries(values, 12);
  const ema26 = calculateEmaSeries(values, 26);
  const macdValues = ema12
    .map((shortEma, index) => {
      const longEma = ema26[index];

      if (shortEma === null || longEma === null) {
        return null;
      }

      return shortEma - longEma;
    })
    .filter((value): value is number => value !== null);

  if (macdValues.length < 9) {
    return null;
  }

  const signalSeries = calculateEmaSeries(macdValues, 9);
  const macdLine = macdValues[macdValues.length - 1];
  const signalLine = signalSeries.findLast((value) => value !== null);

  if (signalLine === undefined || signalLine === null) {
    return null;
  }

  return {
    macdLine,
    signalLine,
    histogram: macdLine - signalLine,
  };
}

function calculateMoveRanges(values: number[]) {
  if (values.length < 3) {
    return {
      averageDailyMovePercent: null,
      estimated7dMovePercent: null,
      estimated30dMovePercent: null,
    };
  }

  const recentValues = values.slice(-31);
  const dailyMoves: number[] = [];

  for (let index = 1; index < recentValues.length; index += 1) {
    dailyMoves.push(
      (Math.abs(recentValues[index] - recentValues[index - 1]) /
        recentValues[index - 1]) *
        100,
    );
  }

  const averageDailyMovePercent =
    dailyMoves.reduce((total, move) => total + move, 0) / dailyMoves.length;

  return {
    averageDailyMovePercent,
    estimated7dMovePercent: averageDailyMovePercent * Math.sqrt(7),
    estimated30dMovePercent: averageDailyMovePercent * Math.sqrt(30),
  };
}

function getPercentile(values: number[], percentile: number) {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((first, second) => first - second);
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.round((percentile / 100) * (sortedValues.length - 1))),
  );

  return sortedValues[index];
}

function getSupportResistance(values: number[]) {
  if (values.length < 5) {
    return {
      nearestSupport: null,
      nearestResistance: null,
    };
  }

  const currentPrice = values[values.length - 1];
  const recentPrices = values.slice(-30);
  let nearestSupport = getPercentile(recentPrices, 20);
  let nearestResistance = getPercentile(recentPrices, 80);

  if (nearestSupport !== null && nearestSupport >= currentPrice) {
    nearestSupport = Math.min(...recentPrices);
  }

  if (nearestResistance !== null && nearestResistance <= currentPrice) {
    nearestResistance = Math.max(...recentPrices);
  }

  return {
    nearestSupport,
    nearestResistance,
  };
}

function getVolumeTrend(points: DailyMarketPoint[]): VolumeTrend {
  const pointsWithVolume = points.filter((point) => point.volume !== null);

  if (pointsWithVolume.length < 14) {
    return "unavailable";
  }

  const recentVolume =
    pointsWithVolume
      .slice(-7)
      .reduce((total, point) => total + (point.volume ?? 0), 0) / 7;
  const previousVolume =
    pointsWithVolume
      .slice(-14, -7)
      .reduce((total, point) => total + (point.volume ?? 0), 0) / 7;

  if (previousVolume <= 0) {
    return "unavailable";
  }

  if (recentVolume > previousVolume * 1.1) {
    return "rising";
  }

  if (recentVolume < previousVolume * 0.9) {
    return "falling";
  }

  return "flat";
}

export function calculateTechnicalMetrics(
  chartData: HistoricalChartPoint[],
): TechnicalMetrics {
  const notes: string[] = [];
  const points = getDailyMarketPoints(chartData);
  const prices = points.map((point) => point.price);
  const ema20 = getLatestEma(prices, 20);
  const ema50 = getLatestEma(prices, 50);
  const ema200 = getLatestEma(prices, 200);
  const rsi14 = calculateRsi(prices);
  const macd = calculateMacd(prices);
  const rangeMetrics = calculateMoveRanges(prices);
  const supportResistance = getSupportResistance(prices);
  const volumeTrend = getVolumeTrend(points);

  if (ema20 === null) notes.push("EMA20 needs at least 20 daily closes.");
  if (ema50 === null) notes.push("EMA50 needs at least 50 daily closes.");
  if (ema200 === null) notes.push("EMA200 needs at least 200 daily closes.");
  if (rsi14 === null) notes.push("RSI14 needs at least 15 daily closes.");
  if (macd === null) notes.push("MACD needs at least 35 daily closes.");
  if (volumeTrend === "unavailable") {
    notes.push("Volume trend is unavailable because chart volume data is limited.");
  }
  if (
    supportResistance.nearestSupport === null ||
    supportResistance.nearestResistance === null
  ) {
    notes.push("Support and resistance need more recent daily closes.");
  }

  return {
    ema20,
    ema50,
    ema200,
    rsi14,
    macd,
    ...rangeMetrics,
    ...supportResistance,
    volumeTrend,
    notes,
  };
}
