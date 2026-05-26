import type { CoinSymbol } from "@/types/crypto";

interface CoinSelectorProps {
  coins: CoinSymbol[];
  selectedCoin: CoinSymbol;
  onSelectCoin: (coin: CoinSymbol) => void;
}

export default function CoinSelector({
  coins,
  selectedCoin,
  onSelectCoin,
}: CoinSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Select a coin to research">
      {coins.map((coin) => {
        const selected = coin === selectedCoin;

        return (
          <button
            key={coin}
            type="button"
            onClick={() => onSelectCoin(coin)}
            aria-pressed={selected}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            {coin}
          </button>
        );
      })}
    </div>
  );
}
