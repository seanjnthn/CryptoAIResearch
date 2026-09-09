"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Star,
  Layers3,
  BrainCircuit,
  BookOpen,
  Menu,
  X,
  Globe2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  rightRail?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  globalMarketData?: {
    totalMarketCap?: number;
    marketCapChange24h?: number;
    btcDominance?: number;
    fearGreed?: number;
  };
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Watchlist", href: "/#watchlist", icon: Star },
  { name: "Compare", href: "/compare", icon: Layers3 },
  { name: "AI Research", href: "/#ai-research", icon: BrainCircuit },
  { name: "Methodology", href: "/methodology", icon: BookOpen },
];

export default function AppShell({
  children,
  rightRail,
  onRefresh,
  isRefreshing = false,
  globalMarketData,
}: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const formatNumber = (num?: number) => {
    if (num === undefined) return "—";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-[var(--border-subtle)] bg-[var(--bg-surface-1)] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
                <BrainCircuit size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Crypto AI
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Research
                </p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} className="text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="sidebar-nav">
              {navigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href.split("#")[0]);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`sidebar-nav-item ${
                        isActive ? "sidebar-nav-item-active" : ""
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--border-subtle)] p-4">
            <div className="rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] p-3">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Data Sources
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    CoinGecko
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    DeFiLlama
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Alternative.me
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Center Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="top-bar sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={20} className="text-[var(--text-secondary)]" />
              </button>
              
              {/* Global Market Status */}
              {globalMarketData && (
                <div className="hidden md:flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Globe2 size={14} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--text-secondary)]">
                      Cap: {formatNumber(globalMarketData.totalMarketCap)}
                    </span>
                    {globalMarketData.marketCapChange24h !== undefined && (
                      <span
                        className={`font-medium ${
                          globalMarketData.marketCapChange24h >= 0
                            ? "text-[var(--positive)]"
                            : "text-[var(--negative)]"
                        }`}
                      >
                        {globalMarketData.marketCapChange24h >= 0 ? "+" : ""}
                        {globalMarketData.marketCapChange24h.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="h-3 w-px bg-[var(--border-subtle)]" />
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--text-secondary)]">
                      BTC: {globalMarketData.btcDominance?.toFixed(1)}%
                    </span>
                  </div>
                  {globalMarketData.fearGreed !== undefined && (
                    <>
                      <div className="h-3 w-px bg-[var(--border-subtle)]" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--text-secondary)]">
                          F&G: {globalMarketData.fearGreed}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            globalMarketData.fearGreed >= 60
                              ? "bg-[var(--positive)]/10 text-[var(--positive)]"
                              : globalMarketData.fearGreed <= 40
                              ? "bg-[var(--negative)]/10 text-[var(--negative)]"
                              : "bg-[var(--warning)]/10 text-[var(--warning)]"
                          }`}
                        >
                          {globalMarketData.fearGreed >= 60
                            ? "Greed"
                            : globalMarketData.fearGreed <= 40
                            ? "Fear"
                            : "Neutral"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="btn-secondary"
                >
                  <RefreshCw
                    size={16}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
              <div className="hidden sm:block text-xs text-[var(--text-muted)]">
                Last updated: Just now
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>

        {/* Right Rail (AI Analyst Panel) */}
        {rightRail && (
          <aside className="hidden xl:block w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-surface-1)] overflow-y-auto">
            {rightRail}
          </aside>
        )}
      </div>
    </div>
  );
}
