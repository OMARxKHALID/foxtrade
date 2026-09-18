import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const chartIntervals = ["1m", "5m", "15m", "30m", "1h", "1d", "1w"];

const defaults = {
  favorites: [],
  chartInterval: "15m",
};

const sanitize = (stored = {}) => ({
  favorites: Array.isArray(stored.favorites) ? [...new Set(stored.favorites.filter((symbol) => typeof symbol === "string" && /^[A-Z0-9]{2,20}$/.test(symbol)))] : defaults.favorites,
  chartInterval: chartIntervals.includes(stored.chartInterval) ? stored.chartInterval : defaults.chartInterval,
});

export const usePreferencesStore = create()(
  persist(
    (set) => ({
      ...defaults,
      hydrated: false,
      toggleFavorite: (symbol) =>
        set((state) => ({
          favorites: state.favorites.includes(symbol) ? state.favorites.filter((item) => item !== symbol) : [...state.favorites, symbol],
        })),
      setChartInterval: (chartInterval) => set({ chartInterval }),
    }),
    {
      name: "foxtrade-preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ favorites, chartInterval }) => ({ favorites, chartInterval }),
      merge: (stored, current) => ({ ...current, ...sanitize(stored) }),
      onRehydrateStorage: () => () => usePreferencesStore.setState({ hydrated: true }),
    },
  ),
);
