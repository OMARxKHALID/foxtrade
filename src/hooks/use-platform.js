"use client";

import { use, useMemo } from "react";
import { assetsOf, featuredSymbolsOf, indexPairs } from "@/lib/market/pairs";
import { PlatformContext } from "@/providers/platform-provider";

export const usePlatform = () => {
  const { settings, pairs } = use(PlatformContext);
  return useMemo(
    () => ({
      settings,
      pairs,
      symbols: pairs.map((pair) => pair.symbol),
      pairBySymbol: indexPairs(pairs),
      featuredSymbols: featuredSymbolsOf(pairs),
      assets: assetsOf(pairs),
    }),
    [settings, pairs],
  );
};
