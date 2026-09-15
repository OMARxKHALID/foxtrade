import { PageHeader } from "@/components/ui/page-header";
import { getPairs } from "@/lib/cached-settings";
import { requireAdmin } from "@/lib/session";
import { PairsManager } from "@/features/admin/components/pairs-manager";

export const metadata = {
  title: "Pairs",
};

export const instant = false;

const PairsPage = async () => {
  await requireAdmin();
  const pairs = await getPairs();

  return (
    <>
      <PageHeader title="Trading Pairs" description="Add Binance USDT pairs, pause markets, cap leverage and choose the home page highlights. Prices always come from Binance." />
      <PairsManager pairs={pairs} />
    </>
  );
};

export default PairsPage;
