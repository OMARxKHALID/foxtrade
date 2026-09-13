"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StatusBadge } from "@/components/ui/status-badge";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const badges = {
  open: { tone: "brand", label: "Needs reply" },
  answered: { tone: "success", label: "Answered" },
  closed: { tone: "neutral", label: "Closed" },
};

const tabs = [
  { value: "open", label: "Needs reply" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const columns = [
  { key: "subject", header: "Ticket", sortable: true },
  { key: "category", header: "Category", hideBelow: "md" },
  { key: "messages", header: "Messages", align: "right", hideBelow: "lg" },
  { key: "updatedAt", header: "Updated", sortable: true, hideBelow: "sm" },
  { key: "status", header: "Status", align: "right" },
];

export const TicketsTable = ({ tickets }) => {
  const [tab, setTab] = useState("open");
  const counts = { open: tickets.filter((ticket) => ticket.status === "open").length };

  const rows = tickets
    .filter((ticket) => tab === "all" || ticket.status === tab)
    .map((ticket) => ({
      id: ticket.id,
      searchText: `${ticket.subject} ${ticket.email} ${ticket.category}`,
      sortValues: { subject: ticket.subject, updatedAt: ticket.updatedAt },
      cells: {
        subject: (
          <Link href={`/admin/tickets/${ticket.id}`} className="block min-w-0">
            <span className="block max-w-xs truncate text-white">{ticket.subject}</span>
            <span className="block max-w-xs truncate text-xs text-neutral-500">{ticket.email}</span>
          </Link>
        ),
        category: <span className="text-neutral-300">{ticket.category}</span>,
        messages: <span className="text-neutral-400 tabular-nums">{ticket.messageCount}</span>,
        updatedAt: <span className="text-neutral-400">{dateFormat.format(new Date(ticket.updatedAt))}</span>,
        status: <StatusBadge tone={badges[ticket.status].tone}>{badges[ticket.status].label}</StatusBadge>,
      },
    }));

  return (
    <DataTable
      tabs={<SegmentedTabs items={tabs.map((item) => ({ ...item, label: counts[item.value] ? `${item.label} (${counts[item.value]})` : item.label }))} value={tab} onChange={setTab} variant="pill" label="Ticket status" />}
      searchPlaceholder="Search tickets"
      columns={columns}
      rows={rows}
      initialSort={{ key: "updatedAt", direction: "desc" }}
      emptyState={<EmptyState icon={LifeBuoy} title="No tickets here" text="Client support tickets appear here." />}
    />
  );
};
