'use client';

import React from 'react';

interface KeyDriversProps {
  marketScore: number;
  contextScore: number;
  priceChange24h: number;
  priceChange30d: number;
  volatility?: number;
  tvlChange?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  missingMetrics?: string[];
}

export default function KeyDrivers({
  marketScore,
  contextScore,
  priceChange24h,
  priceChange30d,
  volatility,
  tvlChange,
  sentiment,
  missingMetrics = []
}: KeyDriversProps) {
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  const neutralFactors: string[] = [];

  // Analyze market score
  if (marketScore >= 70) {
    positiveFactors.push('Market score strongly constructive');
  } else if (marketScore >= 50) {
    neutralFactors.push('Market score neutral');
  } else {
    negativeFactors.push('Market score weak');
  }

  // Analyze momentum
  if (priceChange30d > 10) {
    positiveFactors.push('30D momentum improving');
  } else if (priceChange30d < -10) {
    negativeFactors.push('30D momentum declining');
  } else {
    neutralFactors.push('30D momentum sideways');
  }

  // Analyze volatility
  if (volatility !== undefined) {
    if (volatility < 40) {
      positiveFactors.push('Volatility decreasing');
    } else if (volatility > 70) {
      negativeFactors.push('Volatility elevated');
    } else {
      neutralFactors.push('Volatility moderate');
    }
  }

  // Analyze DeFi TVL
  if (tvlChange !== undefined && tvlChange !== null) {
    if (tvlChange > 5) {
      positiveFactors.push('DeFi TVL increasing');
    } else if (tvlChange < -5) {
      negativeFactors.push('DeFi TVL declining');
    }
  }

  // Analyze sentiment
  if (sentiment === 'positive') {
    positiveFactors.push('News sentiment positive');
  } else if (sentiment === 'negative') {
    negativeFactors.push('News sentiment negative');
  } else if (sentiment === 'neutral') {
    neutralFactors.push('News sentiment neutral');
  }

  return (
    <div className="surface-card panel-section">
      <div className="panel-section-header">
        <h3 className="text-sm font-semibold text-primary">Key Drivers</h3>
        <span className="text-xs text-muted">Why scores look this way</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Positive Factors */}
        <div className="bg-positive/5 border border-positive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-positive"></div>
            <h4 className="text-sm font-medium text-positive">Positive</h4>
          </div>
          {positiveFactors.length > 0 ? (
            <ul className="space-y-2">
              {positiveFactors.map((factor, idx) => (
                <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                  <span className="text-positive mt-0.5">+</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted italic">No strong positive factors</p>
          )}
        </div>

        {/* Negative Factors */}
        <div className="bg-negative/5 border border-negative/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-negative"></div>
            <h4 className="text-sm font-medium text-negative">Negative</h4>
          </div>
          {negativeFactors.length > 0 ? (
            <ul className="space-y-2">
              {negativeFactors.map((factor, idx) => (
                <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                  <span className="text-negative mt-0.5">−</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted italic">No strong negative factors</p>
          )}
        </div>

        {/* Neutral / Missing */}
        <div className="bg-surface-2 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-text-muted"></div>
            <h4 className="text-sm font-medium text-secondary">Neutral / Unavailable</h4>
          </div>
          <ul className="space-y-2">
            {neutralFactors.map((factor, idx) => (
              <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                <span className="text-muted mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
            {missingMetrics.map((metric, idx) => (
              <li key={`missing-${idx}`} className="text-xs text-muted flex items-start gap-2">
                <span className="text-muted mt-0.5">•</span>
                <span>{metric} unavailable</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
