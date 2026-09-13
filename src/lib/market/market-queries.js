import { queryOptions } from "@tanstack/react-query";
import { fetchKlines, fetchTickers } from "@/lib/market/binance-rest";

const marketKeys = {
  all: ["market"],
  tickers: (symbols) => ["market", "tickers", symbols],
  klines: (symbol, interval) => ["market", "klines", symbol, interval],
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
