'use client';

import React from 'react';

interface WhatChangedProps {
  previousMarketScore?: number;
  currentMarketScore: number;
  previousContextScore?: number;
  currentContextScore: number;
  previousMomentum30d?: number;
  currentMomentum30d: number;
  previousVolatility?: number;
  currentVolatility?: number;
  previousTvlChange?: number;
  currentTvlChange?: number;
}

export default function WhatChanged({
  previousMarketScore,
  currentMarketScore,
  previousContextScore,
  currentContextScore,
  previousMomentum30d,
  currentMomentum30d,
  previousVolatility,
  currentVolatility,
  previousTvlChange,
  currentTvlChange
}: WhatChangedProps) {
  const hasHistoricalData = previousMarketScore !== undefined || previousContextScore !== undefined;

  if (!hasHistoricalData) {
    return (
      <div className="surface-card panel-section">
        <div className="panel-section-header">
          <h3 className="text-sm font-semibold text-primary">What Changed</h3>
          <span className="text-xs text-muted">Comparison with previous snapshot</span>
        </div>
        <div className="mt-4 p-4 bg-surface-2 border border-border rounded-lg">
          <p className="text-sm text-secondary">Historical comparison data not yet available.</p>
          <p className="text-xs text-muted mt-1">This feature will appear once multiple data snapshots are collected.</p>
        </div>
      </div>
    );
  }

  const marketScoreChange = previousMarketScore !== undefined ? currentMarketScore - previousMarketScore : null;
  const contextScoreChange = previousContextScore !== undefined ? currentContextScore - previousContextScore : null;
  const momentumChange = previousMomentum30d !== undefined ? currentMomentum30d - previousMomentum30d : null;
  const volatilityChange = (previousVolatility !== undefined && currentVolatility !== undefined) 
    ? currentVolatility - previousVolatility 
    : null;
  const tvlChangeDiff = (previousTvlChange !== undefined && currentTvlChange !== undefined) 
    ? currentTvlChange - previousTvlChange 
    : null;

  const reasons: string[] = [];

  if (marketScoreChange && Math.abs(marketScoreChange) >= 5) {
    if (marketScoreChange > 0) {
      reasons.push('Market structure improved');
    } else {
      reasons.push('Market structure weakened');
    }
  }

  if (momentumChange && Math.abs(momentumChange) >= 5) {
    if (momentumChange > 0) {
      reasons.push('Price momentum accelerated');
    } else {
      reasons.push('Price momentum decelerated');
    }
  }

  if (volatilityChange && Math.abs(volatilityChange) >= 10) {
    if (volatilityChange < 0) {
      reasons.push('Realized volatility declined');
    } else {
      reasons.push('Realized volatility increased');
    }
  }

  if (tvlChangeDiff && Math.abs(tvlChangeDiff) >= 3) {
    if (tvlChangeDiff > 0) {
      reasons.push('DeFi TVL growth accelerated');
    } else {
      reasons.push('DeFi TVL growth slowed');
    }
  }

  return (
    <div className="surface-card panel-section">
      <div className="panel-section-header">
        <h3 className="text-sm font-semibold text-primary">What Changed</h3>
        <span className="text-xs text-muted">Since last snapshot</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {/* Market Score Change */}
        {previousMarketScore !== undefined && (
          <div className="bg-surface-2 border border-border rounded-lg p-4">
            <p className="text-xs text-muted mb-2">Market Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary tabular-nums">{currentMarketScore}</span>
              <span className={`text-sm font-medium tabular-nums ${marketScoreChange! >= 0 ? 'text-positive' : 'text-negative'}`}>
                {marketScoreChange! >= 0 ? '+' : ''}{marketScoreChange}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted">
              was {previousMarketScore}
            </div>
          </div>
        )}

        {/* Context Score Change */}
        {previousContextScore !== undefined && (
          <div className="bg-surface-2 border border-border rounded-lg p-4">
            <p className="text-xs text-muted mb-2">Context Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary tabular-nums">{currentContextScore}</span>
              <span className={`text-sm font-medium tabular-nums ${contextScoreChange! >= 0 ? 'text-positive' : 'text-negative'}`}>
                {contextScoreChange! >= 0 ? '+' : ''}{contextScoreChange}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted">
              was {previousContextScore}
            </div>
          </div>
        )}

        {/* Momentum Change */}
        {previousMomentum30d !== undefined && momentumChange !== null && (
          <div className="bg-surface-2 border border-border rounded-lg p-4">
            <p className="text-xs text-muted mb-2">30D Momentum</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary tabular-nums">{currentMomentum30d.toFixed(1)}%</span>
              <span className={`text-xs font-medium tabular-nums ${momentumChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                {momentumChange >= 0 ? '+' : ''}{momentumChange.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 text-xs text-muted">
              was {previousMomentum30d.toFixed(1)}%
            </div>
          </div>
        )}

        {/* Volatility Change */}
        {previousVolatility !== undefined && volatilityChange !== null && (
          <div className="bg-surface-2 border border-border rounded-lg p-4">
            <p className="text-xs text-muted mb-2">Volatility</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary tabular-nums">{currentVolatility}%</span>
              <span className={`text-xs font-medium tabular-nums ${volatilityChange <= 0 ? 'text-positive' : 'text-negative'}`}>
                {volatilityChange >= 0 ? '+' : ''}{volatilityChange}%
              </span>
            </div>
            <div className="mt-2 text-xs text-muted">
              was {previousVolatility}%
            </div>
          </div>
        )}
      </div>

      {/* Why Section */}
      {reasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-secondary mb-2">WHY</h4>
          <ul className="space-y-1">
            {reasons.map((reason, idx) => (
              <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
