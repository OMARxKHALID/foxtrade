import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { MarketsTable } from "@/features/market/components/markets-table";
import { TickerTrio } from "@/features/market/components/ticker-trio";
import { getPairs } from "@/lib/cached-settings";
import { featuredSymbolsOf } from "@/lib/market/pairs";
import { getTickerHydrationState } from "@/lib/market/ticker-snapshot";

export const metadata = {
  title: "Markets",
};

const MarketsPage = async () => {
  const pairs = await getPairs();
  const tickerState = await getTickerHydrationState([featuredSymbolsOf(pairs), pairs.map((pair) => pair.symbol)]);

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Markets" description="Live prices, 24h statistics and turnover for every pair, streamed from Binance." />
      <HydrationBoundary state={tickerState}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <TickerTrio />
          <MarketsTable />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default MarketsPage;
