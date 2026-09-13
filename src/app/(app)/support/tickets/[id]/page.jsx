import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/session";
import { getUserTicket } from "@/lib/ticket-store";
import { closeTicket, replyToTicket } from "@/features/support/actions/create-ticket";
import { TicketThread } from "@/features/support/components/ticket-thread";

export const metadata = {
  title: "Support Ticket",
};

export const instant = false;

const TicketPage = async ({ params }) => {
  const { id } = await params;
  const user = await requireUser(`/support/tickets/${id}`);
  const ticket = await getUserTicket(user.id, id);
  if (!ticket) notFound();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Support Ticket" backHref="/support" />
      <TicketThread ticket={ticket} viewer="client" replyAction={replyToTicket} statusAction={ticket.status === "closed" ? null : closeTicket} statusLabel="Close Ticket" />
    </Container>
  );
};

export default TicketPage;
