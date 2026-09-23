import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { AssetDetail } from "@/features/assets/components/asset-detail";
import { ModeBadge } from "@/features/assets/components/mode-badge";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";
import { getPairs } from "@/lib/cached-settings";
import { tickersQuery } from "@/lib/market/market-queries";
import { QUOTE, assetsOf, findPair } from "@/lib/market/pairs";
import { getQueryClient } from "@/lib/query-client";

const findAsset = async (value) => assetsOf(await getPairs()).find((asset) => asset.symbol === String(value).toUpperCase());

export const generateMetadata = async ({ params }) => {
  const { symbol } = await params;
  return { title: (await findAsset(symbol))?.symbol ?? "Asset" };
};

export const instant = false;

const AssetPage = async ({ params }) => {
  const { symbol } = await params;
  const asset = await findAsset(symbol);
  if (!asset) notFound();
  await connection();
  const pairSymbol = findPair(await getPairs(), `${asset.symbol}${QUOTE}`)?.symbol;
  const queryClient = getQueryClient();
  if (pairSymbol) void queryClient.prefetchQuery(tickersQuery([pairSymbol]));
  const { overview, records, mode, signedIn } = await loadAssetsPage({ records: true, asset: asset.symbol });

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={`${asset.symbol} · ${asset.name}`} description="Balance, live price and history for this asset." backHref="/assets" actions={signedIn ? <ModeBadge mode={mode} /> : null} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <AssetDetail asset={asset} pairSymbol={pairSymbol} holding={overview ? overview.holdings[asset.symbol] ?? { total: 0, byWallet: {} } : null} records={records} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default AssetPage;
