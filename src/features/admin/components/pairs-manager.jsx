"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Coins, Pencil, Plus, Trash2 } from "lucide-react";
import { CoinIcon } from "@/components/icons/coin-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { removePair, savePair } from "@/features/admin/actions/platform-actions";
import { pairSchema } from "@/features/admin/schemas/admin-schema";

const columns = [
  { key: "pair", header: "Pair", sortable: true },
  { key: "perpetual", header: "Futures", hideBelow: "sm" },
  { key: "timed", header: "Options", hideBelow: "sm" },
  { key: "leverage", header: "Max Leverage", align: "right", sortable: true, hideBelow: "sm" },
  { key: "featured", header: "Home card", hideBelow: "md" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

const emptyPair = { base: "", name: "", color: "#6b7280", timedEnabled: true, perpetualEnabled: true, featured: false, maxLeverage: 100 };

const toggles = [
  { name: "perpetualEnabled", label: "Futures (perpetual positions) enabled" },
  { name: "timedEnabled", label: "Options (timed trades) enabled" },
  { name: "featured", label: "Show on the home page ticker cards (first 3)" },
];

const PairForm = ({ pair, onDone }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(pairSchema), defaultValues: pair ?? emptyPair });
  const { pending, submit } = useActionSubmit({ action: savePair, setError, successMessage: pair ? "Pair updated." : "Pair added.", onSuccess: onDone });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_5rem]">
        <Field id="pair-base" label="Coin ticker" hint={pair ? "Ticker cannot change" : "Paired with USDT"} error={errors.base?.message}>
          <input id="pair-base" readOnly={Boolean(pair)} autoCapitalize="characters" aria-invalid={Boolean(errors.base)} className={controlClass} {...register("base")} />
        </Field>
        <Field id="pair-name" label="Name" error={errors.name?.message}>
          <input id="pair-name" aria-invalid={Boolean(errors.name)} className={controlClass} {...register("name")} />
        </Field>
        <Field id="pair-color" label="Color" error={errors.color?.message}>
          <input id="pair-color" type="color" className={`${controlClass} cursor-pointer p-1`} {...register("color")} />
        </Field>
      </div>
      <Field id="pair-leverage" label="Maximum leverage" hint="The platform-wide maximum still applies." error={errors.maxLeverage?.message}>
        <input id="pair-leverage" type="number" min="1" max="500" aria-invalid={Boolean(errors.maxLeverage)} className={controlClass} {...register("maxLeverage")} />
      </Field>
      {toggles.map((toggle) => (
        <label key={toggle.name} className="flex items-center gap-2 text-sm text-neutral-300">
          <Controller name={toggle.name} control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
          {toggle.label}
        </label>
      ))}
      <GradientButton type="submit" disabled={pending} className="self-end">
        {pending ? "Saving…" : pair ? "Save Pair" : "Add Pair"}
      </GradientButton>
    </form>
  );
};

const enabledBadge = (enabled) => <StatusBadge tone={enabled ? "success" : "neutral"}>{enabled ? "Enabled" : "Paused"}</StatusBadge>;

export const PairsManager = ({ pairs }) => {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const handleClose = () => setEditing(null);
  const remove = useActionSubmit({ action: removePair, successMessage: "Pair removed.", onSuccess: () => setDeleting(null) });

  const rows = pairs.map((pair) => ({
    id: pair.symbol,
    searchText: `${pair.base} ${pair.name} ${pair.symbol}`,
    sortValues: { pair: pair.base, leverage: pair.maxLeverage },
    cells: {
      pair: (
        <span className="flex items-center gap-3">
          <CoinIcon symbol={pair.base} color={pair.color} />
          <span>
            <span className="block text-white">
              {pair.base}/{pair.quote}
            </span>
            <span className="block text-xs text-neutral-500">{pair.name}</span>
          </span>
        </span>
      ),
      perpetual: enabledBadge(pair.perpetualEnabled),
      timed: enabledBadge(pair.timedEnabled),
      leverage: <span className="text-white tabular-nums">{pair.maxLeverage}x</span>,
      featured: pair.featured ? <StatusBadge tone="brand">Featured</StatusBadge> : <span className="text-neutral-500">—</span>,
      actions: (
        <span className="inline-flex gap-2">
          <IconButton label={`Edit ${pair.base}`} onClick={() => setEditing(pair)}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton label={`Remove ${pair.base}`} onClick={() => setDeleting(pair)}>
            <Trash2 className="size-4 text-down" />
          </IconButton>
        </span>
      ),
    },
  }));

  return (
    <>
      <DataTable
        title={`${pairs.length} pairs`}
        titleId="pairs-title"
        filters={
          <GradientButton size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" />
            Add Pair
          </GradientButton>
        }
        searchPlaceholder="Search pairs"
        columns={columns}
        rows={rows}
        emptyState={<EmptyState icon={Coins} title="No pairs" text="Add a Binance USDT pair to start trading." />}
      />
      <FormDialog open={Boolean(editing)} onOpenChange={(open) => !open && handleClose()} title={editing === "new" ? "Add pair" : editing ? `${editing.base}/${editing.quote}` : ""} description="New pairs are checked against live Binance data before they are added.">
        {editing && <PairForm key={editing === "new" ? "new" : editing.symbol} pair={editing === "new" ? null : editing} onDone={handleClose} />}
      </FormDialog>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove pair"
        description={`${deleting?.symbol} will disappear from markets. Pairs with open trades or holders can only be paused.`}
        confirmLabel="Remove"
        tone="down"
        pending={remove.pending}
        onConfirm={() => remove.submit(deleting.symbol)}
      />
    </>
  );
};
