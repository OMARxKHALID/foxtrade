import { queryOptions } from "@tanstack/react-query";
import { fetchKlines, fetchRecentTrades, fetchTickers } from "@/lib/market/binance-rest";

const marketKeys = {
  all: ["market"],
  tickers: (symbols) => ["market", "tickers", symbols],
  klines: (symbol, interval) => ["market", "klines", symbol, interval],
  trades: (symbol, limit) => ["market", "trades", symbol, limit],
};

export const tickersQuery = (symbols) =>
  queryOptions({
    queryKey: marketKeys.tickers(symbols),
    queryFn: () => fetchTickers(symbols),
    staleTime: 30 * 1000,
  });

export const klinesQuery = (symbol, interval) =>
  queryOptions({
    queryKey: marketKeys.klines(symbol, interval),
    queryFn: () => fetchKlines({ symbol, interval }),
    staleTime: 15 * 1000,
  });

export const recentTradesQuery = (symbol, limit) =>
  queryOptions({
    queryKey: marketKeys.trades(symbol, limit),
    queryFn: () => fetchRecentTrades(symbol, limit),
    staleTime: 5 * 1000,
  });
