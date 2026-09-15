import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/session";
import { getTicket } from "@/lib/ticket-store";
import { replyAsAdmin, updateTicketStatus } from "@/features/admin/actions/admin-actions";
import { TicketThread } from "@/features/support/components/ticket-thread";

export const metadata = {
  title: "Ticket",
};

export const instant = false;

const AdminTicketPage = async ({ params }) => {
  await requireAdmin();
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();
  const closed = ticket.status === "closed";

  return (
    <>
      <PageHeader title="Support Ticket" backHref="/admin/tickets" />
      <TicketThread
        ticket={ticket}
        viewer="admin"
        replyAction={replyAsAdmin}
        statusAction={updateTicketStatus}
        statusValue={closed ? "open" : "closed"}
        statusLabel={closed ? "Reopen" : "Close Ticket"}
      />
    </>
  );
};

export default AdminTicketPage;
