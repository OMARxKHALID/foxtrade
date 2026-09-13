import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/session";
import { listAllTickets } from "@/lib/ticket-store";
import { TicketsTable } from "@/features/admin/components/tickets-table";

export const metadata = {
  title: "Tickets",
};

const AdminTicketsPage = async () => {
  await requireAdmin();
  const tickets = await listAllTickets();

  return (
    <>
      <PageHeader title="Support Tickets" description="Reply to clients and close resolved tickets." />
      <TicketsTable tickets={tickets} />
    </>
  );
};

export default AdminTicketsPage;
