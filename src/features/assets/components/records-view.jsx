"use client";

import { useState } from "react";
import { ReceiptText } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { recordTypeGroups, toRecordRow } from "@/features/assets/components/record-rows";

const tabs = [
  { value: "all", label: "All" },
  { value: "faucet", label: "Deposits" },
  { value: "withdraw", label: "Withdrawals" },
  { value: "convert", label: "Convert" },
  { value: "transfer", label: "Transfer" },
  { value: "trade", label: "Trades" },
];

const columns = [
  { key: "time", header: "Time", sortable: true },
  { key: "type", header: "Type" },
  { key: "asset", header: "Asset", hideBelow: "sm" },
  { key: "wallet", header: "Wallet", hideBelow: "lg" },
  { key: "amount", header: "Amount", align: "right", sortable: true },
  { key: "balance", header: "Balance After", align: "right", hideBelow: "md" },
  { key: "status", header: "Status", align: "right", hideBelow: "sm" },
];

const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const RecordsView = ({ records, limit, mode }) => {
  const [tab, setTab] = useState("all");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const today = new Date();

  const filtered = (records ?? []).filter((record) => {
    if (tab !== "all" && !(recordTypeGroups[tab] ?? []).includes(record.type)) return false;
    const time = new Date(record.time);
    if (startDate && time < startDate) return false;
    if (endDate && time > endOfDay(endDate)) return false;
    return true;
  });

  return (
    <DataTable
      tabs={<SegmentedTabs items={tabs} value={tab} onChange={setTab} variant="pill" label="Record type" />}
      filters={
        <div className="grid grid-cols-2 gap-2">
          <DatePicker id="records-start" aria-label="Start date" placeholder="From" value={startDate} onChange={setStartDate} toDate={endDate ?? today} triggerClassName="h-9" className="sm:w-40" />
          <DatePicker id="records-end" aria-label="End date" placeholder="To" value={endDate} onChange={setEndDate} fromDate={startDate} toDate={today} triggerClassName="h-9" className="sm:w-40" />
        </div>
      }
      searchPlaceholder="Search records"
      columns={columns}
      rows={filtered.map(toRecordRow)}
      initialSort={{ key: "time", direction: "desc" }}
      footer={records?.length >= limit ? <p className="border-t border-white/10 px-4 py-3 text-xs text-neutral-500 sm:px-6">Showing your latest {limit} records.</p> : null}
      emptyState={
        records ? (
          <EmptyState
            icon={ReceiptText}
            title={tab === "withdraw" ? "No withdrawals" : "No records found"}
            text={
              tab === "withdraw"
                ? mode === "live"
                  ? "Withdrawals you request appear here once they are raised."
                  : "Practice balances cannot be withdrawn to external wallets."
                : "Try another type or date range."
            }
          />
        ) : (
          <SignInPrompt title="Log in to see your records" text="Every balance change is recorded in your ledger." />
        )
      }
    />
  );
};
