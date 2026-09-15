"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { CoinIcon } from "@/components/icons/coin-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { updatePairSetting } from "@/features/admin/actions/content-actions";

const columns = [
  { key: "pair", header: "Pair", sortable: true },
  { key: "perpetual", header: "Futures" },
  { key: "timed", header: "Options" },
  { key: "leverage", header: "Max Leverage", align: "right", sortable: true, hideBelow: "sm" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

const PairForm = ({ pair, setting, onDone }) => {
  const [timedEnabled, setTimedEnabled] = useState(setting.timedEnabled);
  const [perpetualEnabled, setPerpetualEnabled] = useState(setting.perpetualEnabled);
  const [maxLeverage, setMaxLeverage] = useState(String(setting.maxLeverage));
  const { pending, submit } = useActionSubmit({ action: updatePairSetting, successMessage: "Pair updated.", onSuccess: onDone });

  const handleLeverage = (event) => setMaxLeverage(event.target.value);
  const handleSubmit = (event) => {
    event.preventDefault();
    submit({ symbol: pair.symbol, timedEnabled, perpetualEnabled, maxLeverage });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <Checkbox checked={perpetualEnabled} onChange={setPerpetualEnabled} />
        Futures (perpetual positions) enabled
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <Checkbox checked={timedEnabled} onChange={setTimedEnabled} />
        Options (timed trades) enabled
      </label>
      <label className="flex flex-col gap-2 text-xs text-neutral-300">
        Maximum leverage (1–100)
        <input type="number" min="1" max="100" value={maxLeverage} onChange={handleLeverage} className={controlClass} />
      </label>
      <p className="text-xs text-neutral-500">Existing open positions are not affected. Prices always come from Binance.</p>
      <GradientButton type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "Saving…" : "Save Pair"}
      </GradientButton>
    </form>
  );
};

export const PairsManager = ({ pairs, settings }) => {
  const [editing, setEditing] = useState(null);
  const handleClose = () => setEditing(null);

  const rows = pairs.map((pair) => {
    const setting = settings[pair.symbol];
    return {
      id: pair.symbol,
      searchText: `${pair.base} ${pair.name} ${pair.symbol}`,
      sortValues: { pair: pair.base, leverage: setting.maxLeverage },
      cells: {
        pair: (
          <span className="flex items-center gap-3">
            <CoinIcon symbol={pair.base} color={pair.color} />
            <span>
              <span className="block text-white">{pair.base}/{pair.quote}</span>
              <span className="block text-xs text-neutral-500">{pair.name}</span>
            </span>
          </span>
        ),
        timed: <StatusBadge tone={setting.timedEnabled ? "success" : "neutral"}>{setting.timedEnabled ? "Enabled" : "Paused"}</StatusBadge>,
        perpetual: <StatusBadge tone={setting.perpetualEnabled ? "success" : "neutral"}>{setting.perpetualEnabled ? "Enabled" : "Paused"}</StatusBadge>,
        leverage: <span className="text-white tabular-nums">{setting.maxLeverage}x</span>,
        actions: (
          <IconButton label={`Edit ${pair.base}`} onClick={() => setEditing(pair)}>
            <Pencil className="size-4" />
          </IconButton>
        ),
      },
    };
  });

  return (
    <>
      <DataTable title={`${pairs.length} pairs`} titleId="pairs-title" searchPlaceholder="Search pairs" columns={columns} rows={rows} />
      <FormDialog open={Boolean(editing)} onOpenChange={(open) => !open && handleClose()} title={editing ? `${editing.base}/${editing.quote}` : ""} description="Pause markets or cap leverage for this pair.">
        {editing && <PairForm key={editing.symbol} pair={editing} setting={settings[editing.symbol]} onDone={handleClose} />}
      </FormDialog>
    </>
  );
};
