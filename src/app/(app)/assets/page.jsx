import { Suspense } from "react";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { AssetsOverview } from "@/features/assets/components/assets-overview";
import { TradingModeSwitch } from "@/features/assets/components/trading-mode-switch";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";
import { tickersQuery } from "@/lib/market/market-queries";
import { getPairs } from "@/lib/cached-settings";
import { getQueryClient } from "@/lib/query-client";
import { getCurrentUser } from "@/lib/session";
import { liveAvailableFor } from "@/lib/trading-mode";

export const metadata = {
  title: "Assets",
};

export const instant = false;

const AssetsPage = async () => {
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery((await getPairs()).map((pair) => pair.symbol)));
  const { overview, mode, signedIn } = await loadAssetsPage();
  const user = signedIn ? await getCurrentUser().catch(() => null) : null;
  const live = await liveAvailableFor(user);

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Assets" description="Balances across your spot, futures and option wallets." />
      {signedIn && <TradingModeSwitch mode={mode} liveAvailable={live.available} reason={live.reason} />}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <AssetsOverview overview={overview} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default AssetsPage;
