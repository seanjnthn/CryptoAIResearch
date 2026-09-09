import { useMemo } from "react";
import type { WatchlistCoin } from "@/types/crypto";

interface DataCompletenessProps {
  hasMarketData: boolean;
  hasTechnicalData: boolean;
  hasMacroData: boolean;
  hasNewsData: boolean;
  hasDeFiData: boolean;
  hasOnchainData: boolean;
}

export function DataCompleteness({
  hasMarketData,
  hasTechnicalData,
  hasMacroData,
  hasNewsData,
  hasDeFiData,
  hasOnchainData,
}: DataCompletenessProps) {
  const metrics = useMemo(
    () => [
      { name: "Market", available: hasMarketData },
      { name: "Technical", available: hasTechnicalData },
      { name: "Macro", available: hasMacroData },
      { name: "News", available: hasNewsData },
      { name: "DeFi", available: hasDeFiData },
      { name: "On-chain", available: hasOnchainData },
    ],
    [hasMarketData, hasTechnicalData, hasMacroData, hasNewsData, hasDeFiData, hasOnchainData]
  );

  const completenessPercentage = useMemo(() => {
    const available = metrics.filter((m) => m.available).length;
    return Math.round((available / metrics.length) * 100);
  }, [metrics]);

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Data Completeness
        </h3>
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {completenessPercentage}%
        </span>
      </div>
      
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div key={metric.name} className="data-status-item">
            <span className="text-xs text-[var(--text-secondary)]">{metric.name}</span>
            <span
              className={`text-xs ${
                metric.available
                  ? "data-status-available"
                  : "data-status-unavailable"
              }`}
            >
              {metric.available ? "Available" : "Unavailable"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
