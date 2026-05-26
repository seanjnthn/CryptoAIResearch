import type { WatchlistCoin } from "@/types/crypto";

export const DEFAULT_COIN_ID = "bitcoin";
export const CUSTOM_WATCHLIST_STORAGE_KEY = "crypto-research-custom-watchlist";

export const defaultWatchlist: WatchlistCoin[] = [
  {
    coinId: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  },
  {
    coinId: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
  },
  {
    coinId: "solana",
    symbol: "SOL",
    name: "Solana",
  },
  {
    coinId: "sui",
    symbol: "SUI",
    name: "Sui",
  },
  {
    coinId: "hyperliquid",
    symbol: "HYPE",
    name: "Hyperliquid",
  },
  {
    coinId: "bittensor",
    symbol: "TAO",
    name: "Bittensor",
  },
  {
    coinId: "ripple",
    symbol: "XRP",
    name: "XRP",
  },
];
