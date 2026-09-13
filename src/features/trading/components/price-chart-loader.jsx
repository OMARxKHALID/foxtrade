"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/ui/page-loader";

const PriceChart = dynamic(() =>
  import("@/features/market/components/price-chart").then((module) => ({
    default: module.PriceChart,
  })),
  {
    ssr: false,
    loading: () => <PageLoader />,
  }
);

export default PriceChart;