import Link from "next/link";
import { ChevronRight, LifeBuoy } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ticketStatusBadges } from "@/features/support/components/ticket-thread";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export const TicketList = ({ tickets }) => {
  if (!tickets.length) return <EmptyState icon={LifeBuoy} title="No tickets yet" text="Tickets you open appear here with our replies." />;

  return (
    <ul className="divide-y divide-white/5">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link href={`/support/tickets/${ticket.id}`} className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-white">{ticket.subject}</span>
              <span className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                <StatusBadge tone={ticketStatusBadges[ticket.status].tone}>{ticketStatusBadges[ticket.status].label}</StatusBadge>
                {ticket.category} · {dateFormat.format(new Date(ticket.updatedAt))}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-neutral-500" />
          </Link>
        </li>
      ))}
    </ul>
  );
};
