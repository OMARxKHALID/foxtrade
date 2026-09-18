import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { OrderBook } from "@/features/market/components/order-book";
import { PairHeader } from "@/features/market/components/pair-header";
import { PriceChart } from "@/features/trading/components/price-chart-loader";
import { TradeFeed } from "@/features/market/components/trade-feed";
import { OrdersPanel } from "@/features/trading/components/orders-panel";
import { PerpetualOrderPanel } from "@/features/trading/components/perpetual-order-panel";
import { TimedTradePanel } from "@/features/trading/components/timed-trade-panel";
import { TradeScreen } from "@/features/trading/components/trade-screen";
import { tickersQuery, klinesQuery } from "@/lib/market/market-queries";
import { getPairs, getPlatformSettings } from "@/lib/cached-settings";
import { findPair } from "@/lib/market/pairs";
import { getQueryClient } from "@/lib/query-client";

const marketMeta = {
  timed: { label: "Options" },
  perpetual: { label: "Futures" },
};

export const tradePageMetadata = async ({ params }, market) => {
  const { symbol } = await params;
  const pair = findPair(await getPairs(), symbol);
  const label = marketMeta[market].label;
  return { title: pair ? `${pair.base}/${pair.quote} ${label}` : label };
};

export const TradePage = async ({ params, market }) => {
  const { symbol } = await params;
  const [pairs, settings] = await Promise.all([getPairs(), getPlatformSettings()]);
  const pair = findPair(pairs, symbol);
  if (!pair) notFound();
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery([pair.symbol]));
  void queryClient.prefetchQuery(klinesQuery(pair.symbol, "15m"));

  const orderPanel =
    market === "timed" ? (
      <TimedTradePanel symbol={pair.symbol} enabled={pair.timedEnabled} />
    ) : (
      <PerpetualOrderPanel symbol={pair.symbol} enabled={pair.perpetualEnabled} maxLeverage={Math.min(pair.maxLeverage, settings.maxLeverage)} />
    );

  return (
    <Container>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader />}>
          <TradeScreen
            header={<PairHeader symbol={pair.symbol} market={market} />}
            chart={<PriceChart symbol={pair.symbol} className="min-h-0 flex-1" />}
            orderBook={<OrderBook key={pair.symbol} symbol={pair.symbol} className="min-h-0 flex-1" />}
            tradeFeed={<TradeFeed key={pair.symbol} symbol={pair.symbol} className="min-h-0 flex-1" />}
            orderPanel={orderPanel}
            ordersPanel={<OrdersPanel market={market} />}
          />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};