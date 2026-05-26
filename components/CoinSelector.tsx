import type { WatchlistCoin } from "@/types/crypto";

interface CoinSelectorProps {
  coins: WatchlistCoin[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string) => void;
  onRemoveCoin: (coinId: string) => void;
}

export default function CoinSelector({
  coins,
  selectedCoinId,
  onSelectCoin,
  onRemoveCoin,
}: CoinSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Select a coin to research">
      {coins.map((coin) => {
        const selected = coin.coinId === selectedCoinId;

        return (
          <div key={coin.coinId} className="flex items-stretch">
            <button
              type="button"
              title={coin.name}
              onClick={() => onSelectCoin(coin.coinId)}
              aria-pressed={selected}
              className={`px-4 py-2 text-sm font-semibold transition ${
                coin.isCustom ? "rounded-l-xl" : "rounded-xl"
              } ${
                selected
                  ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                  : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              {coin.symbol}
            </button>
            {coin.isCustom && (
              <button
                type="button"
                aria-label={`Remove ${coin.name} from watchlist`}
                onClick={() => onRemoveCoin(coin.coinId)}
                className="rounded-r-xl border border-l-0 border-slate-700 bg-slate-900 px-2.5 text-xs font-semibold text-slate-400 transition hover:border-rose-400/60 hover:text-rose-200"
              >
                Remove
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
