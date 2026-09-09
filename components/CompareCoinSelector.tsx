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
    <section className="rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl shadow-xl shadow-slate-200/30 sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
          Compare Universe
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-800">Select 2 to 5 assets</h2>
        <p className="mt-1 text-sm text-slate-600">
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
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${
                isSelected
                  ? "border-blue-400/50 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 shadow-lg shadow-blue-500/20 backdrop-blur-xl"
                  : "border-white/50 bg-white/50 text-slate-600 hover:border-blue-400/50 hover:bg-white/70 hover:text-blue-600 hover:shadow-md"
              }`}
              aria-pressed={isSelected}
            >
              {coin.symbol}
              <span className="ml-1 text-xs font-normal text-slate-500">
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
