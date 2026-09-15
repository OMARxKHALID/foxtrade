import "server-only";
import { cacheLife } from "next/cache";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { tickersQuery } from "@/lib/market/market-queries";

export const getTickerHydrationState = async (symbolGroups) => {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  const queryClient = new QueryClient();
  await Promise.all(symbolGroups.map((symbols) => queryClient.prefetchQuery(tickersQuery(symbols))));
  return dehydrate(queryClient);
};
