import type {
  ContextScoreResult,
  MarketScoreResult,
  ScenarioForecast,
  TechnicalMacd,
  TechnicalOutlookLabel,
  VolumeTrend,
} from "@/types/crypto";

interface ForecastInput {
  currentPrice: number;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  macd: TechnicalMacd | null;
  support: number | null;
  resistance: number | null;
  averageDailyMovePercent: number | null;
  estimated7dMovePercent: number | null;
  estimated30dMovePercent: number | null;
  volumeTrend: VolumeTrend;
  marketScore: MarketScoreResult;
  contextScore: ContextScoreResult;
}

function roundPrice(value: number) {
  if (value >= 1000) return Number(value.toFixed(2));
  if (value >= 1) return Number(value.toFixed(4));
  return Number(value.toFixed(8));
}

function makeRange(low: number, high: number) {
  return {
    rangeLow: roundPrice(Math.max(0, Math.min(low, high))),
    rangeHigh: roundPrice(Math.max(0, Math.max(low, high))),
  };
}

function getOutlookLabel(
  bullishSignals: number,
  bearishSignals: number,
  volatilityPercent: number | null,
): TechnicalOutlookLabel {
  if (volatilityPercent !== null && volatilityPercent >= 18) {
    return "Mixed / volatile";
  }

  if (bullishSignals >= bearishSignals + 2) {
    return "Bullish bias";
  }

  if (bearishSignals >= bullishSignals + 2) {
    return "Bearish bias";
  }

  if (bullishSignals > 0 && bearishSignals > 0) {
    return "Mixed / volatile";
  }

  return "Neutral / range-bound";
}

function getConfidence(missingCount: number, conflictCount: number) {
  if (missingCount >= 4 || conflictCount >= 3) {
    return "Low" as const;
  }

  if (missingCount >= 2 || conflictCount >= 1) {
    return "Medium" as const;
  }

  return "High" as const;
}

export function generateScenarioForecast(input: ForecastInput): ScenarioForecast {
  const notes: string[] = [
    "Scenarios are conditional ranges based on historical prices and simplified indicators.",
    "Ranges use estimated volatility and should not be read as exact targets.",
  ];
  const movePercent = input.estimated30dMovePercent ?? 12;
  const moveRatio = Math.max(0.03, movePercent / 100);
  const support = input.support ?? input.currentPrice * (1 - moveRatio * 0.5);
  const resistance = input.resistance ?? input.currentPrice * (1 + moveRatio * 0.5);
  let bullishSignals = 0;
  let bearishSignals = 0;
  let missingCount = 0;
  let conflictCount = 0;

  if (input.ema20 !== null && input.ema50 !== null) {
    if (input.currentPrice > input.ema20 && input.ema20 > input.ema50) {
      bullishSignals += 2;
    } else if (input.currentPrice < input.ema20 && input.ema20 < input.ema50) {
      bearishSignals += 2;
    } else {
      conflictCount += 1;
    }
  } else {
    missingCount += 1;
  }

  if (input.ema200 !== null) {
    if (input.currentPrice > input.ema200) bullishSignals += 1;
    if (input.currentPrice < input.ema200) bearishSignals += 1;
  } else {
    notes.push("EMA200 is unavailable with the current chart window.");
    missingCount += 1;
  }

  if (input.rsi14 !== null) {
    if (input.rsi14 >= 55 && input.rsi14 <= 70) bullishSignals += 1;
    if (input.rsi14 < 40 || input.rsi14 > 75) bearishSignals += 1;
  } else {
    missingCount += 1;
  }

  if (input.macd !== null) {
    if (input.macd.histogram > 0) bullishSignals += 1;
    if (input.macd.histogram < 0) bearishSignals += 1;
  } else {
    missingCount += 1;
  }

  if (input.volumeTrend === "rising") bullishSignals += 1;
  if (input.volumeTrend === "falling") bearishSignals += 1;
  if (input.volumeTrend === "unavailable") missingCount += 1;

  if (input.marketScore.verdict === "Strong" || input.marketScore.verdict === "Constructive") {
    bullishSignals += 1;
  }
  if (input.marketScore.verdict === "Weak" || input.marketScore.verdict === "High Risk") {
    bearishSignals += 1;
  }
  if (input.contextScore.verdict === "Risky") bearishSignals += 1;

  if (bullishSignals > 0 && bearishSignals > 0) {
    conflictCount += 1;
  }

  const outlookLabel = getOutlookLabel(
    bullishSignals,
    bearishSignals,
    input.estimated30dMovePercent,
  );
  const confidence = getConfidence(missingCount, conflictCount);
  const bullRange = makeRange(resistance, resistance * (1 + moveRatio));
  const baseRange = makeRange(support, resistance);
  const bearRange = makeRange(support * (1 - moveRatio), support);

  return {
    outlookLabel,
    confidence,
    trendSummary:
      input.ema20 !== null && input.ema50 !== null
        ? `Price is ${input.currentPrice >= input.ema20 ? "above" : "below"} EMA20, while EMA20 is ${
            input.ema20 >= input.ema50 ? "above" : "below"
          } EMA50.`
        : "Trend structure is limited because EMA20 or EMA50 is unavailable.",
    momentumSummary:
      input.rsi14 !== null && input.macd !== null
        ? `RSI14 is ${input.rsi14.toFixed(1)} and MACD histogram is ${input.macd.histogram.toFixed(
            4,
          )}.`
        : "Momentum context is limited because RSI14 or MACD is unavailable.",
    volatilitySummary:
      input.averageDailyMovePercent !== null
        ? `Average daily close-to-close move is about ${input.averageDailyMovePercent.toFixed(
            2,
          )}%, with an estimated 30D move band near ${movePercent.toFixed(2)}%.`
        : "Volatility range is limited because there is not enough price history.",
    supportResistanceSummary:
      input.support !== null && input.resistance !== null
        ? `Nearest support is near ${roundPrice(input.support)} and nearest resistance is near ${roundPrice(
            input.resistance,
          )}.`
        : "Support and resistance are estimated from a conservative volatility band.",
    bullScenario: {
      ...bullRange,
      condition:
        "Conditional on price holding above nearby resistance with supportive momentum and no major context deterioration.",
    },
    baseScenario: {
      ...baseRange,
      condition:
        "Conditional on price continuing to rotate between nearby support and resistance.",
    },
    bearScenario: {
      ...bearRange,
      condition:
        "Conditional on price losing nearby support with weaker momentum or elevated context risk.",
    },
    invalidationLevel: roundPrice(support),
    notes:
      confidence === "Low"
        ? [
            ...notes,
            "Confidence is low because some indicators are missing or conflicting.",
          ]
        : notes,
  };
}
