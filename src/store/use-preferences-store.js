import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { currencies, locales } from "@/lib/content/locales";

export const chartIntervals = ["1m", "5m", "15m", "1h", "4h", "1d"];

const defaults = {
  favorites: [],
  currency: "USD",
  locale: "en",
  chartInterval: "15m",
};

const sanitize = (stored = {}) => ({
  favorites: Array.isArray(stored.favorites) ? [...new Set(stored.favorites.filter((symbol) => typeof symbol === "string" && /^[A-Z0-9]{2,20}$/.test(symbol)))] : defaults.favorites,
  currency: currencies.includes(stored.currency) ? stored.currency : defaults.currency,
  locale: locales.some((item) => item.code === stored.locale) ? stored.locale : defaults.locale,
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
      setCurrency: (currency) => set({ currency }),
      setLocale: (locale) => {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        set({ locale });
      },
      setChartInterval: (chartInterval) => set({ chartInterval }),
    }),
    {
      name: "foxtrade-preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ favorites, currency, locale, chartInterval }) => ({ favorites, currency, locale, chartInterval }),
      merge: (stored, current) => ({ ...current, ...sanitize(stored) }),
      onRehydrateStorage: () => () => usePreferencesStore.setState({ hydrated: true }),
    },
  ),
);
