"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookUser, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, controlClass } from "@/components/ui/field";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { removeWithdrawalAddress, saveWithdrawalAddress } from "@/features/assets/actions/assets-actions";
import { assetOptions, networkOptions } from "@/features/assets/components/asset-options";
import { addressSchema } from "@/features/assets/schemas/assets-schema";

const columns = [
  { key: "label", header: "Label", sortable: true },
  { key: "asset", header: "Asset", hideBelow: "sm" },
  { key: "network", header: "Network", hideBelow: "md" },
  { key: "address", header: "Address" },
  { key: "actions", header: "", align: "right" },
];

export const AddressBook = ({ addresses, signedIn }) => {
  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "", asset: "USDT", network: "TRC20", address: "" },
  });

  const { pending, submit } = useActionSubmit({
    action: saveWithdrawalAddress,
    setError,
    successMessage: "Address saved.",
    onSuccess: () => reset(),
  });
  const { pending: removing, submit: remove } = useActionSubmit({ action: removeWithdrawalAddress, successMessage: "Address removed." });

  const rows = addresses.map((item) => ({
    id: item.id,
    searchText: `${item.label} ${item.asset} ${item.network} ${item.address}`,
    sortValues: { label: item.label },
    cells: {
      label: <span className="text-white">{item.label}</span>,
      asset: item.asset,
      network: item.network,
      address: <span className="block max-w-[14rem] truncate font-mono text-xs text-neutral-300 sm:max-w-xs">{item.address}</span>,
      actions: (
        <IconButton label={`Remove ${item.label}`} onClick={() => remove(item.id)} disabled={removing}>
          <Trash2 className="size-4 text-down" />
        </IconButton>
      ),
    },
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-6">
      <GlowCard as="section" aria-labelledby="add-address-title" className="h-fit">
        <CardHeader id="add-address-title" title="Add address" description="Saved addresses can be picked when you withdraw." />
        <CardBody>
          <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
            <Field id="address-label" label="Label" error={errors.label?.message}>
              <input id="address-label" placeholder="e.g. Hardware wallet" aria-invalid={Boolean(errors.label)} className={controlClass} {...register("label")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="address-asset" label="Asset" error={errors.asset?.message}>
                <Controller
                  name="asset"
                  control={control}
                  render={({ field }) => <SelectMenu id="address-asset" options={assetOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.asset)} />}
                />
              </Field>
              <Field id="address-network" label="Network" error={errors.network?.message}>
                <Controller
                  name="network"
                  control={control}
                  render={({ field }) => <SelectMenu id="address-network" options={networkOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.network)} />}
                />
              </Field>
            </div>
            <Field id="address-value" label="Address" error={errors.address?.message}>
              <input id="address-value" autoComplete="off" spellCheck={false} placeholder="Paste wallet address" aria-invalid={Boolean(errors.address)} className={controlClass} {...register("address")} />
            </Field>
            <GradientButton type="submit" disabled={pending} className="self-start">
              {pending ? "Saving…" : "Save Address"}
            </GradientButton>
          </form>
        </CardBody>
      </GlowCard>
      <DataTable
        title="Saved addresses"
        titleId="saved-addresses-title"
        searchPlaceholder="Search addresses"
        columns={columns}
        rows={rows}
        emptyState={signedIn ? <EmptyState icon={BookUser} title="No saved addresses" text="Addresses you save appear here." /> : <SignInPrompt title="Log in to manage addresses" text="Your saved withdrawal addresses appear here." />}
      />
    </div>
  );
};
