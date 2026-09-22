import { queryOptions } from "@tanstack/react-query";

export const tradingKeys = {
  all: ["trading"],
  orders: (market) => ["trading", "orders", market],
};

const hasActive = (data) => data?.items?.some((item) => ["open", "pending"].includes(item.status));

export const ordersQuery = (market) =>
  queryOptions({
    queryKey: tradingKeys.orders(market),
    queryFn: async () => {
      const response = await fetch(`/api/trading/orders?market=${market}`, { cache: "no-store" }).catch(() => {
        throw new Error("You appear to be offline. Your trades keep settling on our servers.");
      });
      if (response.ok) return response.json();
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "We couldn't refresh your orders. Retrying automatically.");
    },
    staleTime: 0,
    refetchInterval: (query) => (hasActive(query.state.data) ? 2000 : 15000),
  });
