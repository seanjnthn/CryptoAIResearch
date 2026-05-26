import type { ResearchVerdict, ScoringInput, ScoringResult } from "@/types/crypto";

function clampScore(score: number, maximum: number) {
  return Math.max(0, Math.min(maximum, Math.round(score)));
}

function getTrendScore(input: ScoringInput) {
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

function getDrawdownScore(input: ScoringInput) {
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

function getVerdict(totalScore: number): ResearchVerdict {
  if (totalScore >= 80) return "Strong";
  if (totalScore >= 65) return "Constructive";
  if (totalScore >= 50) return "Neutral";
  if (totalScore >= 35) return "Weak";
  return "High Risk";
}

export function calculateResearchScore(input: ScoringInput): ScoringResult {
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
    verdict: getVerdict(totalScore),
    notes,
  };
}
