"use client";

import { GlowCard } from "@/components/ui/glow-card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { chartHeight, panelHeight } from "@/lib/layout-sizes";
import { cn } from "@/lib/utils";

export const TradeScreen = ({ header, chart, orderBook, tradeFeed, orderPanel, ordersPanel }) => {
  const wide = useMediaQuery("(min-width: 80rem)");
  const showWide = wide !== false;
  const showNarrow = wide !== true;

  return (
    <div className="flex flex-col gap-4">
      <GlowCard>{header}</GlowCard>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_300px_340px]">
        <GlowCard className={cn("flex flex-col overflow-hidden", chartHeight, "md:h-auto md:min-h-[440px]")}>{chart}</GlowCard>
        {showWide && <GlowCard className={cn("hidden flex-col overflow-hidden xl:flex", chartHeight)}>{orderBook}</GlowCard>}
        <GlowCard>{orderPanel}</GlowCard>
        {showNarrow && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2 lg:grid-cols-2 xl:hidden">
            <GlowCard className={cn("flex flex-col overflow-hidden", panelHeight)}>{orderBook}</GlowCard>
            <GlowCard className={cn("flex flex-col overflow-hidden", panelHeight)}>{tradeFeed}</GlowCard>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {ordersPanel}
        {showWide && <GlowCard className={cn("hidden flex-col overflow-hidden xl:flex", panelHeight)}>{tradeFeed}</GlowCard>}
      </div>
    </div>
  );
};
