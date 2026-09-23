import { StatusBadge } from "@/components/ui/status-badge";
import { ledgerTypeLabels, walletLabelFor } from "@/lib/ledger-labels";
import { formatAmount, shortDateTime as timeFormat } from "@/lib/format";
import { cn } from "@/lib/utils";


export const recordTypeGroups = {
  faucet: ["faucet", "deposit", "admin_reset", "admin_adjust"],
  withdraw: ["withdraw_hold", "withdraw_sent", "withdraw_refund"],
  convert: ["convert"],
  transfer: ["transfer"],
  trade: ["timed_stake", "timed_payout", "perp_margin", "perp_close", "perp_fee"],
};

export const toRecordRow = (record) => ({
  id: record.id,
  searchText: `${record.asset} ${ledgerTypeLabels[record.type] ?? record.type} ${record.note ?? ""}`,
  sortValues: { time: record.time, amount: Number(record.amount) },
  cells: {
    time: <span className="text-neutral-300 tabular-nums">{timeFormat.format(new Date(record.time))}</span>,
    type: (
      <span>
        <span className="block text-white">{ledgerTypeLabels[record.type] ?? record.type}</span>
        {record.note && <span className="block text-xs text-neutral-500">{record.note}</span>}
      </span>
    ),
    wallet: walletLabelFor(record.wallet),
    asset: record.asset,
    amount: (
      <span className={cn("tabular-nums", record.amount >= 0 ? "text-up" : "text-down")}>
        {record.amount >= 0 ? "+" : ""}
        {formatAmount(record.amount, record.asset)}
      </span>
    ),
    balance: <span className="text-neutral-300 tabular-nums">{formatAmount(record.balanceAfter, record.asset)}</span>,
    status: <StatusBadge tone="success">Completed</StatusBadge>,
  },
});
