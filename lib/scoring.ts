import type {
  CompositeResearchLabel,
  ContextScoreInput,
  ContextVerdict,
  MarketScoreInput,
  MarketScoreResult,
  MarketVerdict,
  ScoringResult,
} from "@/types/crypto";

function clampScore(score: number, maximum: number) {
  return Math.max(0, Math.min(maximum, Math.round(score)));
}

function getTrendScore(input: MarketScoreInput) {
  let score = 15;

  if (input.change7d >= 10) score += 6;
  else if (input.change7d >= 3) score += 4;
  else if (input.change7d > 0) score += 2;
  else if (input.change7d <= -10) score -= 6;
  else if (input.change7d < 0) score -= 3;

  if (input.change30d >= 20) score += 9;
  else if (input.change30d >= 5) score += 6;
  else if (input.change30d > 0) score += 3;
  else if (input.change30d <= -20) score -= 9;
  else if (input.change30d < 0) score -= 5;

  if (input.change24h >= 5) score += 1;
  else if (input.change24h <= -5) score -= 1;

  return clampScore(score, 30);
}

function getLiquidityScore(volumeToMarketCap: number) {
  if (volumeToMarketCap >= 0.15) return 20;
  if (volumeToMarketCap >= 0.08) return 17;
  if (volumeToMarketCap >= 0.04) return 14;
  if (volumeToMarketCap >= 0.02) return 11;
  if (volumeToMarketCap >= 0.01) return 8;
  return 4;
}

function getVolatilityScore(volatility30d: number) {
  if (volatility30d < 40) return 15;
  if (volatility30d <= 80) return 11;
  if (volatility30d <= 120) return 7;
  return 2;
}

function getDrawdownScore(input: MarketScoreInput) {
  const drawdown = Math.abs(input.athDrawdown);
  const improvingTrend = input.change7d > 0 && input.change30d > 0;

  if (drawdown <= 15) return 14;
  if (drawdown <= 35) return 11;
  if (drawdown <= 60) return improvingTrend ? 9 : 6;
  if (drawdown <= 80) return improvingTrend ? 6 : 2;
  return improvingTrend ? 4 : 1;
}

function getFundamentalScore(tvlChange30d: number | undefined, notes: string[]) {
  if (tvlChange30d === undefined) {
    notes.push("DeFi fundamentals unavailable; fundamental score treated as neutral.");
    return 10;
  }

  if (tvlChange30d >= 20) return 20;
  if (tvlChange30d >= 5) return 16;
  if (tvlChange30d > 0) return 14;
  if (tvlChange30d >= -10) return 8;
  return 4;
}

function getMarketVerdict(totalScore: number): MarketVerdict {
  if (totalScore >= 80) return "Strong";
  if (totalScore >= 65) return "Constructive";
  if (totalScore >= 50) return "Neutral";
  if (totalScore >= 35) return "Weak";
  return "High Risk";
}

function calculateMarketScore(input: MarketScoreInput): MarketScoreResult {
  const notes: string[] = [];
  const trendScore = getTrendScore(input);
  const liquidityScore = getLiquidityScore(input.volumeToMarketCap);
  const volatilityScore = getVolatilityScore(input.volatility30d);
  const drawdownScore = getDrawdownScore(input);
  const fundamentalScore = getFundamentalScore(input.tvlChange30d, notes);
  const improvingTrend = input.change7d > 0 && input.change30d > 0;

  if (improvingTrend) {
    notes.unshift("Positive 7-day and 30-day momentum supports the trend score.");
  } else if (input.change7d < 0 && input.change30d < 0) {
    notes.unshift("Negative 7-day and 30-day momentum lowers the trend score.");
  }

  if (input.volatility30d > 120) {
    notes.push("Very high annualized 30-day realized volatility lowers the stability score.");
  } else if (input.volatility30d > 80) {
    notes.push("Elevated annualized 30-day realized volatility reduces the stability score.");
  }

  if (Math.abs(input.athDrawdown) > 35) {
    notes.push(
      improvingTrend
        ? "Deep ATH drawdown receives only a small benefit while momentum is improving."
        : "Deep ATH drawdown is treated as added research risk.",
    );
  }

  const totalScore = clampScore(
    trendScore +
      liquidityScore +
      volatilityScore +
      drawdownScore +
      fundamentalScore,
    100,
  );

  return {
    totalScore,
    trendScore,
    liquidityScore,
    volatilityScore,
    drawdownScore,
    fundamentalScore,
    verdict: getMarketVerdict(totalScore),
    notes,
  };
}

function getMacroScore(context: ContextScoreInput, notes: string[]) {
  const regime = context.macroData?.regime;

  if (!context.macroData?.sourceAvailable || !regime || regime === "Unavailable") {
    notes.push("Macro regime unavailable; macro context score treated as neutral.");
    return { score: 21, unavailable: true, supportive: false, risky: false, mixed: false };
  }

  if (regime === "Risk-on") {
    notes.push("Macro regime is risk-on, which is supportive context.");
    return { score: 31, unavailable: false, supportive: true, risky: false, mixed: false };
  }

  if (regime === "Risk-off") {
    notes.push("Macro regime is risk-off, which adds context risk.");
    return { score: 10, unavailable: false, supportive: false, risky: true, mixed: false };
  }

  if (regime === "Mixed") {
    notes.push("Macro regime is mixed, so macro context is not one-directional.");
    return { score: 18, unavailable: false, supportive: false, risky: false, mixed: true };
  }

  notes.push("Macro regime is neutral.");
  return { score: 24, unavailable: false, supportive: false, risky: false, mixed: false };
}

function getFearGreedScore(context: ContextScoreInput, notes: string[]) {
  const value = context.macroData?.fearGreedValue;

  if (typeof value !== "number") {
    notes.push("Fear & Greed data unavailable; sentiment score treated as neutral.");
    return { score: 15, unavailable: true, supportive: false, risky: false, mixed: false };
  }

  if (value >= 75) {
    notes.push("Extreme greed can indicate overheated sentiment, so it is scored cautiously.");
    return { score: 10, unavailable: false, supportive: false, risky: true, mixed: false };
  }

  if (value <= 25) {
    notes.push("Extreme fear can indicate market stress, not an automatic bullish signal.");
    return { score: 9, unavailable: false, supportive: false, risky: true, mixed: false };
  }

  if (value >= 45 && value <= 60) {
    notes.push("Fear & Greed is near neutral, which is a more stable sentiment backdrop.");
    return { score: 22, unavailable: false, supportive: false, risky: false, mixed: false };
  }

  notes.push("Fear & Greed is moderate, so it contributes balanced sentiment context.");
  return { score: 18, unavailable: false, supportive: false, risky: false, mixed: false };
}

function getNewsScore(context: ContextScoreInput, notes: string[]) {
  const news = context.newsData;

  if (!news?.sourceAvailable || news.articles.length === 0 || news.sentimentLabel === "Unavailable") {
    notes.push("News sentiment unavailable; news score treated as neutral.");
    return { score: 12, unavailable: true, supportive: false, risky: false, mixed: false };
  }

  if (news.sentimentLabel === "Positive") {
    notes.push("Headline sentiment is positive, but it is weighted lightly because news can be noisy.");
    return { score: 16, unavailable: false, supportive: true, risky: false, mixed: false };
  }

  if (news.sentimentLabel === "Negative") {
    notes.push("Headline sentiment is negative, which adds short-term context risk.");
    return { score: 6, unavailable: false, supportive: false, risky: true, mixed: false };
  }

  if (news.sentimentLabel === "Mixed") {
    notes.push("Headline sentiment is mixed and should be treated as context, not direction.");
    return { score: 10, unavailable: false, supportive: false, risky: false, mixed: true };
  }

  notes.push("Headline sentiment is neutral.");
  return { score: 12, unavailable: false, supportive: false, risky: false, mixed: false };
}

function getOnchainScore(context: ContextScoreInput, notes: string[]) {
  const onchain = context.onchainData;
  const state = onchain?.valuationState;

  if (!onchain?.sourceAvailable || !state || state === "Unavailable") {
    notes.push("MVRV unavailable or provider-limited; on-chain score treated as neutral.");
    return { score: 12, unavailable: true, supportive: false, risky: false, mixed: false };
  }

  if (state === "Undervalued/Capitulation Zone") {
    notes.push("MVRV suggests supportive long-cycle valuation context, not a timing signal.");
    return { score: 16, unavailable: false, supportive: true, risky: false, mixed: false };
  }

  if (state === "Elevated") {
    notes.push("MVRV is elevated, which adds valuation caution.");
    return { score: 8, unavailable: false, supportive: false, risky: true, mixed: false };
  }

  if (state === "Overheated") {
    notes.push("MVRV is overheated, which adds valuation risk.");
    return { score: 4, unavailable: false, supportive: false, risky: true, mixed: false };
  }

  notes.push("MVRV valuation context is neutral.");
  return { score: 12, unavailable: false, supportive: false, risky: false, mixed: false };
}

function getContextVerdict(
  totalScore: number,
  unavailableCount: number,
  supportiveCount: number,
  riskyCount: number,
  mixedCount: number,
): ContextVerdict {
  if (unavailableCount === 4) return "Unavailable";
  if (riskyCount > 0 && supportiveCount > 0) return "Mixed";
  if (mixedCount > 0 && totalScore < 70) return "Mixed";
  if (totalScore >= 70) return "Supportive";
  if (totalScore >= 55) return "Neutral";
  if (totalScore >= 40) return "Mixed";
  return "Risky";
}

function calculateContextScore(context: ContextScoreInput) {
  const notes: string[] = [];
  const macro = getMacroScore(context, notes);
  const fearGreed = getFearGreedScore(context, notes);
  const news = getNewsScore(context, notes);
  const onchain = getOnchainScore(context, notes);

  const totalScore = clampScore(
    macro.score + fearGreed.score + news.score + onchain.score,
    100,
  );
  const unavailableCount = [macro, fearGreed, news, onchain].filter(
    (item) => item.unavailable,
  ).length;
  const supportiveCount = [macro, fearGreed, news, onchain].filter(
    (item) => item.supportive,
  ).length;
  const riskyCount = [macro, fearGreed, news, onchain].filter(
    (item) => item.risky,
  ).length;
  const mixedCount = [macro, fearGreed, news, onchain].filter(
    (item) => item.mixed,
  ).length;

  return {
    totalScore,
    macroScore: macro.score,
    fearGreedScore: fearGreed.score,
    newsScore: news.score,
    onchainScore: onchain.score,
    verdict: getContextVerdict(
      totalScore,
      unavailableCount,
      supportiveCount,
      riskyCount,
      mixedCount,
    ),
    notes,
  };
}

function getCompositeView(
  marketScore: MarketScoreResult,
  contextVerdict: ContextVerdict,
): { label: CompositeResearchLabel; explanation: string } {
  const marketVerdict = marketScore.verdict;

  if (
    (marketVerdict === "High Risk" || marketVerdict === "Weak") &&
    contextVerdict === "Risky"
  ) {
    return {
      label: "High Risk",
      explanation:
        "Both market structure and context signals are weak or risky, so the research view is defensive.",
    };
  }

  if (
    (marketVerdict === "Strong" || marketVerdict === "Constructive") &&
    contextVerdict === "Risky"
  ) {
    return {
      label: "Caution",
      explanation:
        "Market data is constructive, but context signals are risky, so this should be read with caution.",
    };
  }

  if (
    (marketVerdict === "Strong" || marketVerdict === "Constructive") &&
    contextVerdict === "Mixed"
  ) {
    return {
      label: "Mixed",
      explanation:
        "Market data is constructive, but context signals are mixed rather than clearly supportive.",
    };
  }

  if (
    (marketVerdict === "Strong" || marketVerdict === "Constructive") &&
    (contextVerdict === "Supportive" ||
      contextVerdict === "Neutral" ||
      contextVerdict === "Unavailable")
  ) {
    return {
      label: "Constructive",
      explanation:
        contextVerdict === "Unavailable"
          ? "Market data is constructive, while some context data is unavailable and should be reviewed separately."
          : "Market data is constructive and context is not showing a major conflicting risk signal.",
    };
  }

  if (marketVerdict === "Weak" || marketVerdict === "High Risk") {
    return {
      label: "Caution",
      explanation:
        "Market score is weak, so the composite view remains cautious even if context is not clearly risky.",
    };
  }

  if (contextVerdict === "Risky") {
    return {
      label: "Caution",
      explanation:
        "Market score is neutral, but context signals add enough risk to keep the view cautious.",
    };
  }

  if (contextVerdict === "Mixed") {
    return {
      label: "Mixed",
      explanation:
        "Market score is neutral and context signals are mixed, so the research view is balanced.",
    };
  }

  return {
    label: "Neutral",
    explanation:
      contextVerdict === "Unavailable"
        ? "Market score is neutral and some context data is unavailable, so the view stays conservative."
        : "Market and context signals are broadly balanced without a clear supportive or risky tilt.",
  };
}

export function calculateResearchScore(
  marketInput: MarketScoreInput,
  contextInput: ContextScoreInput = {},
): ScoringResult {
  const marketScore = calculateMarketScore(marketInput);
  const contextScore = calculateContextScore(contextInput);
  const compositeView = getCompositeView(marketScore, contextScore.verdict);

  return {
    marketScore,
    contextScore,
    compositeView,
  };
}
