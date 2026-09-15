"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/ui/page-loader";

export const PriceChart = dynamic(
  () => import("@/features/market/components/price-chart").then(({ PriceChart: Chart }) => ({ default: Chart })),
  { ssr: false, loading: () => <PageLoader /> },
);
