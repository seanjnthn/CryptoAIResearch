'use client';

import React from 'react';

interface WhatToMonitorProps {
  supportLevel?: number;
  resistanceLevel?: number;
  currentVolatility?: number;
  avgVolatility?: number;
  tvlChange?: number;
  sentimentChange?: number;
  mvrvValue?: number;
  mvrvThreshold?: number;
  dataHealthIssues?: string[];
}

export default function WhatToMonitor({
  supportLevel,
  resistanceLevel,
  currentVolatility,
  avgVolatility,
  tvlChange,
  sentimentChange,
  mvrvValue,
  mvrvThreshold,
  dataHealthIssues = []
}: WhatToMonitorProps) {
  const monitoringItems: Array<{ condition: string; priority: 'high' | 'medium' | 'low' }> = [];

  // Price levels
  if (supportLevel !== undefined) {
    monitoringItems.push({
      condition: `Monitor whether price maintains support near $${supportLevel.toLocaleString()}`,
      priority: 'high'
    });
  }

  if (resistanceLevel !== undefined) {
    monitoringItems.push({
      condition: `Watch for approach to resistance at $${resistanceLevel.toLocaleString()}`,
      priority: 'high'
    });
  }

  // Volatility regime
  if (currentVolatility !== undefined && avgVolatility !== undefined) {
    const volRatio = currentVolatility / avgVolatility;
    if (volRatio > 1.5) {
      monitoringItems.push({
        condition: 'Volatility significantly elevated vs average - monitor for potential regime change',
        priority: 'medium'
      });
    } else if (volRatio < 0.5) {
      monitoringItems.push({
        condition: 'Volatility compressed - monitor for potential expansion',
        priority: 'medium'
      });
    }
  }

  // TVL changes
  if (tvlChange !== undefined && tvlChange !== null) {
    if (Math.abs(tvlChange) > 10) {
      monitoringItems.push({
        condition: `DeFi TVL showing significant movement (${tvlChange > 0 ? '+' : ''}${tvlChange.toFixed(1)}%) - monitor for trend continuation`,
        priority: 'medium'
      });
    }
  }

  // Sentiment shifts
  if (sentimentChange !== undefined && Math.abs(sentimentChange) > 15) {
    monitoringItems.push({
      condition: 'News sentiment shifting notably - monitor for sustained change',
      priority: 'low'
    });
  }

  // MVRV conditions
  if (mvrvValue !== undefined && mvrvThreshold !== undefined) {
    if (mvrvValue > mvrvThreshold * 1.2) {
      monitoringItems.push({
        condition: 'MVRV approaching overbought territory - monitor for potential mean reversion',
        priority: 'medium'
      });
    } else if (mvrvValue < mvrvThreshold * 0.8) {
      monitoringItems.push({
        condition: 'MVRV in oversold territory - monitor for potential recovery signals',
        priority: 'medium'
      });
    }
  }

  // Data health issues
  dataHealthIssues.forEach(issue => {
    monitoringItems.push({
      condition: `Data quality: ${issue} - interpretation may be limited`,
      priority: 'low'
    });
  });

  if (monitoringItems.length === 0) {
    return (
      <div className="surface-card panel-section">
        <div className="panel-section-header">
          <h3 className="text-sm font-semibold text-primary">What to Monitor</h3>
          <span className="text-xs text-muted">Key research conditions</span>
        </div>
        <div className="mt-4 p-4 bg-surface-2 border border-border rounded-lg">
          <p className="text-sm text-secondary">No specific conditions requiring immediate monitoring.</p>
          <p className="text-xs text-muted mt-1">Continue tracking standard metrics.</p>
        </div>
      </div>
    );
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  monitoringItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="surface-card panel-section">
      <div className="panel-section-header">
        <h3 className="text-sm font-semibold text-primary">What to Monitor</h3>
        <span className="text-xs text-muted">Key research conditions</span>
      </div>

      <div className="mt-4 space-y-3">
        {monitoringItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              item.priority === 'high'
                ? 'bg-negative/5 border-negative/20'
                : item.priority === 'medium'
                ? 'bg-warning/5 border-warning/20'
                : 'bg-surface-2 border-border'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
              item.priority === 'high'
                ? 'bg-negative'
                : item.priority === 'medium'
                ? 'bg-warning'
                : 'bg-text-muted'
            }`} />
            <p className="text-sm text-secondary flex-1">{item.condition}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              item.priority === 'high'
                ? 'bg-negative/20 text-negative'
                : item.priority === 'medium'
                ? 'bg-warning/20 text-warning'
                : 'bg-surface-1 text-muted'
            }`}>
              {item.priority.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted">
          Note: These are research conditions to monitor, not investment recommendations.
        </p>
      </div>
    </div>
  );
}
