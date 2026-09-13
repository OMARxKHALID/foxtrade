import { Suspense } from "react";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { BannerCarousel } from "@/features/home/components/banner-carousel";
import { NoticeBar } from "@/features/home/components/notice-bar";
import { QuickActions } from "@/features/home/components/quick-actions";
import { QuickTradeBanner } from "@/features/home/components/quick-trade-banner";
import { MarketList } from "@/features/market/components/market-list";
import { TickerTrio } from "@/features/market/components/ticker-trio";
import { getActiveBanners, getPublishedNotices } from "@/lib/content-store";
import { getPairSettings } from "@/lib/pair-settings";
import { defaultPairs, featuredSymbols } from "@/lib/market/pairs";
import { tickersQuery } from "@/lib/market/market-queries";
import { getQueryClient } from "@/lib/query-client";

export const metadata = {
  title: "Home",
};

const HomePage = async () => {
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery(featuredSymbols));
  void queryClient.prefetchQuery(tickersQuery(defaultPairs.map((pair) => pair.symbol)));
  const [banners, notices, settings] = await Promise.all([getActiveBanners(), getPublishedNotices(), getPairSettings()]);

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <BannerCarousel banners={banners} />
      <NoticeBar notices={notices.slice(0, 5)} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <TickerTrio />
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
            <QuickActions />
            <QuickTradeBanner />
          </div>
          <MarketList settings={settings} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default HomePage;
