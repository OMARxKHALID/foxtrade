import { Suspense } from "react";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { AssetsOverview } from "@/features/assets/components/assets-overview";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";
import { tickersQuery } from "@/lib/market/market-queries";
import { allSymbols } from "@/lib/market/pairs";
import { getQueryClient } from "@/lib/query-client";

export const metadata = {
  title: "Assets",
};

export const instant = false;

const AssetsPage = async () => {
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery(allSymbols));
  const { overview } = await loadAssetsPage();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Assets" description="Balances across your spot, futures and option wallets." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <AssetsOverview overview={overview} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default AssetsPage;
