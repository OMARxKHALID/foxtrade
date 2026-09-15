import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { MarketsTable } from "@/features/market/components/markets-table";
import { TickerTrio } from "@/features/market/components/ticker-trio";
import { allSymbols, featuredSymbols } from "@/lib/market/pairs";
import { getTickerHydrationState } from "@/lib/market/ticker-snapshot";
import { getPairSettings } from "@/lib/pair-settings";

export const metadata = {
  title: "Markets",
};

const MarketsPage = async () => {
  const [settings, tickerState] = await Promise.all([getPairSettings(), getTickerHydrationState([featuredSymbols, allSymbols])]);

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Markets" description="Live prices, 24h statistics and turnover for every pair, streamed from Binance." />
      <HydrationBoundary state={tickerState}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <TickerTrio />
          <MarketsTable settings={settings} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default MarketsPage;
