"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Star, X } from "lucide-react";
import type { WatchlistCoin } from "@/types/crypto";

interface AssetSelectorProps {
  coins: WatchlistCoin[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string) => void;
  onToggleWatchlist?: (coinId: string) => void;
  watchlist?: string[];
}

export default function AssetSelector({
  coins,
  selectedCoinId,
  onSelectCoin,
  onToggleWatchlist,
  watchlist = [],
}: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) {
      return coins.slice(0, 8);
    }

    const query = searchQuery.toLowerCase().trim();
    return coins.filter(
      (coin) =>
        coin.symbol.toLowerCase().includes(query) ||
        coin.name.toLowerCase().includes(query) ||
        coin.coinId.toLowerCase().includes(query)
    );
  }, [coins, searchQuery]);

  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.coinId === selectedCoinId),
    [coins, selectedCoinId]
  );

  const handleSelect = useCallback(
    (coinId: string) => {
      onSelectCoin(coinId);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelectCoin]
  );

  const handleToggleWatchlist = useCallback(
    (e: React.MouseEvent, coinId: string) => {
      e.stopPropagation();
      onToggleWatchlist?.(coinId);
    },
    [onToggleWatchlist]
  );

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[280px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="asset-selector-input flex items-center justify-between gap-3"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedCoin && (
            <>
              <span className="font-semibold text-[var(--text-primary)]">
                {selectedCoin.symbol.toUpperCase()}
              </span>
              <span className="text-[var(--text-muted)]">{selectedCoin.name}</span>
            </>
          )}
        </span>
        <Search size={16} className="text-[var(--text-muted)] shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[400px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] shadow-xl">
            <div className="border-b border-[var(--border-subtle)] p-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by symbol, name, or ID..."
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  autoFocus
                />
              </div>
            </div>

            <ul
              className="overflow-y-auto p-2"
              role="listbox"
              aria-label="Asset selector"
            >
              {filteredCoins.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                  No assets found for &quot;{searchQuery}&quot;
                </li>
              ) : (
                filteredCoins.map((coin) => {
                  const isSelected = coin.coinId === selectedCoinId;
                  const isInWatchlist = watchlist.includes(coin.coinId);

                  return (
                    <li
                      key={coin.coinId}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(coin.coinId)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 transition ${
                        isSelected
                          ? "bg-[var(--bg-surface-hover)]"
                          : "hover:bg-[var(--bg-surface-hover)]"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
                          <span className="text-xs font-bold text-[var(--text-secondary)]">
                            {coin.symbol.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {coin.symbol.toUpperCase()}
                            </span>
                            {coin.isCustom && (
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-[var(--text-muted)]">
                            {coin.name}
                          </p>
                        </div>
                      </div>

                      {onToggleWatchlist && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatchlist(e, coin.coinId)}
                          className={`shrink-0 rounded p-1.5 transition ${
                            isInWatchlist
                              ? "text-[var(--warning)] hover:bg-[var(--warning)]/10"
                              : "text-[var(--text-muted)] hover:text-[var(--warning)] hover:bg-[var(--bg-surface-hover)]"
                          }`}
                          aria-label={
                            isInWatchlist
                              ? "Remove from watchlist"
                              : "Add to watchlist"
                          }
                        >
                          <Star
                            size={14}
                            fill={isInWatchlist ? "currentColor" : "none"}
                          />
                        </button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
