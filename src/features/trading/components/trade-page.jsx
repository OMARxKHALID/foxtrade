import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { OrderBook } from "@/features/market/components/order-book";
import { PairHeader } from "@/features/market/components/pair-header";
import PriceChart from "@/features/trading/components/price-chart-loader";
import { TradeFeed } from "@/features/market/components/trade-feed";
import { OrdersPanel } from "@/features/trading/components/orders-panel";
import { PerpetualOrderForm } from "@/features/trading/components/perpetual-order-form";
import { TimedTradePanel } from "@/features/trading/components/timed-trade-panel";
import { TradeScreen } from "@/features/trading/components/trade-screen";
import { tickersQuery, klinesQuery } from "@/lib/market/market-queries";
import { findPair } from "@/lib/market/pairs";
import { getPairSetting } from "@/lib/pair-settings";
import { getQueryClient } from "@/lib/query-client";

const marketMeta = {
  timed: { label: "Futures" },
  perpetual: { label: "Option" },
};

export const tradePageMetadata = async ({ params }, market) => {
  const { symbol } = await params;
  const pair = findPair(symbol);
  const label = marketMeta[market].label;
  return { title: pair ? `${pair.base}/${pair.quote} ${label}` : label };
};

export const TradePage = async ({ params, market }) => {
  const { symbol } = await params;
  const pair = findPair(symbol);
  if (!pair) notFound();
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery([pair.symbol]));
  void queryClient.prefetchQuery(klinesQuery(pair.symbol, "15m"));
  const setting = await getPairSetting(pair.symbol);

  const orderPanel =
    market === "timed" ? (
      <TimedTradePanel symbol={pair.symbol} enabled={setting.timedEnabled} />
    ) : (
      <PerpetualOrderForm symbol={pair.symbol} enabled={setting.perpetualEnabled} maxLeverage={setting.maxLeverage} />
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