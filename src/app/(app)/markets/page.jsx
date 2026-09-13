import { Suspense } from "react";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { MarketsTable } from "@/features/market/components/markets-table";
import { TickerTrio } from "@/features/market/components/ticker-trio";
import { tickersQuery } from "@/lib/market/market-queries";
import { allSymbols, featuredSymbols } from "@/lib/market/pairs";
import { getPairSettings } from "@/lib/pair-settings";
import { getQueryClient } from "@/lib/query-client";

export const metadata = {
  title: "Markets",
};

const MarketsPage = async () => {
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery(allSymbols));
  void queryClient.prefetchQuery(tickersQuery(featuredSymbols));
  const settings = await getPairSettings();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Markets" description="Live prices, 24h statistics and turnover for every pair, streamed from Binance." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <TickerTrio />
          <MarketsTable settings={settings} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default MarketsPage;
