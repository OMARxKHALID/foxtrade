import { create } from "zustand";

export const useTickerStore = create((set) => ({
  tickers: {},
  applyBatch: (items) =>
    set((state) => {
      if (!items.length) return state;
      const tickers = { ...state.tickers };
      items.forEach((item) => {
        tickers[item.symbol] = item;
      });
      return { tickers };
    }),
}));
