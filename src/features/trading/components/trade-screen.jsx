import { GlowCard } from "@/components/ui/glow-card";
import { chartHeight, panelHeight } from "@/lib/layout-sizes";
import { cn } from "@/lib/utils";

export const TradeScreen = ({ header, chart, orderBook, tradeFeed, orderPanel, ordersPanel }) => (
  <div className="flex flex-col gap-4">
    <GlowCard>{header}</GlowCard>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_300px_340px]">
      <GlowCard className={cn("flex flex-col overflow-hidden", chartHeight)}>{chart}</GlowCard>
      <GlowCard className={cn("hidden flex-col overflow-hidden xl:flex", chartHeight)}>{orderBook}</GlowCard>
      <GlowCard className="lg:row-span-2 xl:row-span-1">{orderPanel}</GlowCard>
      <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
        <GlowCard className={cn("flex flex-col overflow-hidden", panelHeight)}>{orderBook}</GlowCard>
        <GlowCard className={cn("flex flex-col overflow-hidden", panelHeight)}>{tradeFeed}</GlowCard>
      </div>
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      {ordersPanel}
      <GlowCard className={cn("hidden flex-col overflow-hidden xl:flex", panelHeight)}>{tradeFeed}</GlowCard>
    </div>
  </div>
);
