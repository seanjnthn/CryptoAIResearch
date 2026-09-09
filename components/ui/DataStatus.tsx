import { type ReactNode } from "react";

interface DataFreshnessProps {
  lastUpdated?: Date | null;
  status: "live" | "updated" | "stale" | "unavailable" | "not-supported";
  label?: string;
}

export function DataFreshness({ lastUpdated, status, label }: DataFreshnessProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "live":
        return { label: "LIVE", className: "status-badge-live" };
      case "updated": {
        const minutes = lastUpdated
          ? Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
          : 0;
        return {
          label: minutes <= 1 ? "Just now" : `${minutes}m ago`,
          className: "status-badge-updated",
        };
      }
      case "stale":
        return { label: "STALE", className: "status-badge-stale" };
      case "unavailable":
        return { label: "UNAVAILABLE", className: "status-badge-unavailable" };
      case "not-supported":
        return { label: "NOT SUPPORTED", className: "status-badge-unavailable" };
      default:
        return { label: status, className: "status-badge-unavailable" };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
      <span className={`status-badge ${config.className}`}>{config.label}</span>
    </div>
  );
}

interface SourceBadgeProps {
  source: string;
  url?: string;
}

export function SourceBadge({ source, url }: SourceBadgeProps) {
  const content = (
    <span className="source-badge">
      {source}
    </span>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:border-[var(--border-default)] transition-colors"
      >
        {content}
      </a>
    );
  }

  return content;
}

interface DataStatusProps {
  available: boolean;
  hasData: boolean;
  children: ReactNode;
}

export function DataStatus({ available, hasData, children }: DataStatusProps) {
  if (!available) {
    return (
      <div className="data-status-item">
        <span className="text-[var(--text-secondary)]">{children}</span>
        <span className="data-status-unavailable">Unavailable</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="data-status-item">
        <span className="text-[var(--text-secondary)]">{children}</span>
        <span className="data-status-unavailable">Not Supported</span>
      </div>
    );
  }

  return (
    <div className="data-status-item">
      <span className="text-[var(--text-secondary)]">{children}</span>
      <span className="data-status-available">Available</span>
    </div>
  );
}
