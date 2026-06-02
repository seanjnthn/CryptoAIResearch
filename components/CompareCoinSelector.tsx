"use client";

import type { WatchlistCoin } from "@/types/crypto";

interface CompareCoinSelectorProps {
  coins: WatchlistCoin[];
  selectedCoinIds: string[];
  onToggleCoin: (coinId: string) => void;
}

export default function CompareCoinSelector({
  coins,
  selectedCoinIds,
  onToggleCoin,
}: CompareCoinSelectorProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Compare Universe
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Select 2 to 5 assets</h2>
        <p className="mt-1 text-sm text-slate-400">
          Compare mode only fetches data for selected assets to keep requests measured.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {coins.map((coin) => {
          const isSelected = selectedCoinIds.includes(coin.coinId);
          const isDisabled =
            (!isSelected && selectedCoinIds.length >= 5) ||
            (isSelected && selectedCoinIds.length <= 2);

          return (
            <button
              key={coin.coinId}
              type="button"
              onClick={() => onToggleCoin(coin.coinId)}
              disabled={isDisabled}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                isSelected
                  ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                  : "border-slate-700 bg-slate-950/30 text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
              }`}
              aria-pressed={isSelected}
            >
              {coin.symbol}
              <span className="ml-1 text-xs font-normal text-slate-400">
                {coin.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Keep at least two assets selected. Custom watchlist assets saved in the
        dashboard are available here too.
      </p>
    </section>
  );
}
