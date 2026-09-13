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
      const response = await fetch(`/api/trading/orders?market=${market}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load orders");
      return response.json();
    },
    staleTime: 0,
    refetchInterval: (query) => (hasActive(query.state.data) ? 2000 : 15000),
  });
