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
import { transformCandles, transformTicker } from "@/lib/market/overlay";
import { getPairs, getPlatformSettings } from "@/lib/cached-settings";
import { findPair } from "@/lib/market/pairs";
import { getQueryClient } from "@/lib/query-client";
import { getCurrentUser } from "@/lib/session";

const KLINE_INTERVAL_MS = 15 * 60 * 1000;

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
  const user = await getCurrentUser().catch(() => null);
  const tickerOptions = tickersQuery([pair.symbol]);
  const klineOptions = klinesQuery(pair.symbol, "15m");
  if (user?.id) {
    const [tickers, klines] = await Promise.all([tickerOptions.queryFn(), klineOptions.queryFn()]);
    const steeredTickers = await Promise.all(tickers.map((ticker) => transformTicker(user.id, ticker)));
    const withMs = klines.map(({ time, ...rest }) => ({ openTime: time * 1000, ...rest }));
    const steeredKlines = await transformCandles(user.id, pair.symbol, withMs, KLINE_INTERVAL_MS);
    queryClient.setQueryData(tickerOptions.queryKey, steeredTickers);
    queryClient.setQueryData(klineOptions.queryKey, steeredKlines.map(({ openTime, ...rest }) => ({ time: Math.floor(openTime / 1000), ...rest })));
  } else {
    void queryClient.prefetchQuery(tickerOptions);
    void queryClient.prefetchQuery(klineOptions);
  }

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