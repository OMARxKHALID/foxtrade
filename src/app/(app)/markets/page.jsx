import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { MarketsTable } from "@/features/market/components/markets-table";
import { TickerTrio } from "@/features/market/components/ticker-trio";
import { getPairSettings } from "@/lib/pair-settings";

export const metadata = {
  title: "Markets",
};

const MarketsPage = async () => {
  const settings = await getPairSettings();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Markets" description="Live prices, 24h statistics and turnover for every pair, streamed from Binance." />
      <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
        <TickerTrio />
        <MarketsTable settings={settings} />
      </Suspense>
    </Container>
  );
};

export default MarketsPage;
