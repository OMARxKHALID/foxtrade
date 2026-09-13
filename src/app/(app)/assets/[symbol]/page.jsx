import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { PageHeader } from "@/components/ui/page-header";
import { AssetDetail } from "@/features/assets/components/asset-detail";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";
import { assets } from "@/features/assets/data/assets-config";
import { tickersQuery } from "@/lib/market/market-queries";
import { findPair } from "@/lib/market/pairs";
import { getQueryClient } from "@/lib/query-client";

const findAsset = (value) => assets.find((asset) => asset.symbol === String(value).toUpperCase());

export const generateMetadata = async ({ params }) => {
  const { symbol } = await params;
  return { title: findAsset(symbol)?.symbol ?? "Asset" };
};

const AssetPage = async ({ params }) => {
  const { symbol } = await params;
  const asset = findAsset(symbol);
  if (!asset) notFound();
  await connection();
  const pairSymbol = findPair(`${asset.symbol}USDT`)?.symbol;
  const queryClient = getQueryClient();
  if (pairSymbol) void queryClient.prefetchQuery(tickersQuery([pairSymbol]));
  const { overview, records } = await loadAssetsPage({ records: true, asset: asset.symbol });

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={`${asset.symbol} · ${asset.name}`} description="Balance, live price and history for this asset." backHref="/assets" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PageLoader className="min-h-[40vh]" />}>
          <AssetDetail asset={asset} pairSymbol={pairSymbol} holding={overview ? overview.holdings[asset.symbol] ?? { total: 0, byWallet: {} } : null} records={records} />
        </Suspense>
      </HydrationBoundary>
    </Container>
  );
};

export default AssetPage;
