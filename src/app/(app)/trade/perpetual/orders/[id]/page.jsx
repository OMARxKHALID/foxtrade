import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/session";
import { OrderDetail } from "@/features/trading/components/order-detail";
import { getOrderDetail } from "@/features/trading/dal/trading-engine";

export const metadata = {
  title: "Position Detail",
};

export const instant = false;

const PerpetualOrderPage = async ({ params }) => {
  const { id } = await params;
  const user = await getCurrentUser();
  const order = user ? await getOrderDetail(user.id, "perpetual", id) : null;
  if (user && !order) notFound();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Position Detail" description="Entry, margin, liquidation and PnL of a perpetual position." backHref={order ? `/trade/perpetual/${order.symbol.toLowerCase()}` : "/trade/perpetual/btcusdt"} />
      <OrderDetail market="perpetual" order={order} signedIn={Boolean(user)} />
    </Container>
  );
};

export default PerpetualOrderPage;
