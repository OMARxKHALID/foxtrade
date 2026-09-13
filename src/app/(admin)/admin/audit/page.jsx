import { History } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listAudit } from "@/features/admin/dal/admin-dal";

export const metadata = {
  title: "Audit Log",
};

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const columns = [
  { key: "time", header: "Time", sortable: true },
  { key: "action", header: "Action", sortable: true },
  { key: "target", header: "Target", hideBelow: "sm" },
  { key: "detail", header: "Detail", hideBelow: "md" },
  { key: "admin", header: "Admin", hideBelow: "lg" },
];

const AuditPage = async () => {
  const entries = await listAudit();
  const rows = entries.map((entry) => ({
    id: entry.id,
    searchText: `${entry.action} ${entry.target} ${entry.detail ?? ""}`,
    sortValues: { time: entry.createdAt, action: entry.action },
    cells: {
      time: <span className="text-neutral-400 tabular-nums">{dateFormat.format(new Date(entry.createdAt))}</span>,
      action: <span className="font-mono text-xs text-brand">{entry.action}</span>,
      target: <span className="block max-w-[14rem] truncate text-white">{entry.target}</span>,
      detail: <span className="block max-w-xs truncate text-neutral-400">{entry.detail ?? "—"}</span>,
      admin: <span className="text-neutral-400">{entry.adminEmail}</span>,
    },
  }));

  return (
    <>
      <PageHeader title="Audit Log" description="Every admin action is recorded and cannot be edited." />
      <DataTable
        title="Activity"
        titleId="audit-title"
        searchPlaceholder="Search activity"
        columns={columns}
        rows={rows}
        initialSort={{ key: "time", direction: "desc" }}
        emptyState={<EmptyState icon={History} title="No activity yet" text="Bans, balance resets, KYC decisions and content edits are logged here." />}
      />
    </>
  );
};

export default AuditPage;
