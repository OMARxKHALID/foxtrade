import { Suspense } from "react";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { ConvertForm } from "@/features/assets/components/convert-form";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";
import { tickersQuery } from "@/lib/market/market-queries";
import { getPairs } from "@/lib/cached-settings";
import { getQueryClient } from "@/lib/query-client";

export const metadata = {
  title: "Convert",
};

export const instant = false;

const ConvertPage = async () => {
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tickersQuery((await getPairs()).map((pair) => pair.symbol)));
  const { overview } = await loadAssetsPage();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Convert" description="Swap between coins instantly at the live market rate." backHref="/assets" />
      <GlowCard className="w-full max-w-xl p-4 sm:p-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<PageLoader className="min-h-80" />}>
            <ConvertForm holdings={overview?.holdings} />
          </Suspense>
        </HydrationBoundary>
      </GlowCard>
    </Container>
  );
};

export default ConvertPage;
