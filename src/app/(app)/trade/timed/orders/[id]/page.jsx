import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/session";
import { OrderDetail } from "@/features/trading/components/order-detail";
import { getOrderDetail } from "@/features/trading/dal/trading-engine";

export const metadata = {
  title: "Trade Detail",
};

export const instant = false;

const TimedOrderPage = async ({ params }) => {
  const { id } = await params;
  const user = await getCurrentUser();
  const order = user ? await getOrderDetail(user.id, "timed", id) : null;
  if (user && !order) notFound();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Trade Detail" description="Opening, closing and settlement details of a timed trade." backHref={order ? `/trade/timed/${order.symbol.toLowerCase()}` : "/trade/timed/btcusdt"} />
      <OrderDetail market="timed" order={order} signedIn={Boolean(user)} />
    </Container>
  );
};

export default TimedOrderPage;
