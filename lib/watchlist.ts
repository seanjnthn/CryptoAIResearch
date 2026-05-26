import type { CoinSymbol, WatchlistCoin } from "@/types/crypto";

export const coins: CoinSymbol[] = [
  "BTC",
  "ETH",
  "SOL",
  "SUI",
  "HYPE",
  "TAO",
  "XRP",
];

export const watchlist: Record<CoinSymbol, WatchlistCoin> = {
  BTC: {
    coinId: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  },
  ETH: {
    coinId: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
  },
  SOL: {
    coinId: "solana",
    symbol: "SOL",
    name: "Solana",
  },
  SUI: {
    coinId: "sui",
    symbol: "SUI",
    name: "Sui",
  },
  HYPE: {
    coinId: "hyperliquid",
    symbol: "HYPE",
    name: "Hyperliquid",
  },
  TAO: {
    coinId: "bittensor",
    symbol: "TAO",
    name: "Bittensor",
  },
  XRP: {
    coinId: "ripple",
    symbol: "XRP",
    name: "XRP",
  },
};
