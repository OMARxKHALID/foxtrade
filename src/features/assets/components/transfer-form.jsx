"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft } from "lucide-react";
import { Field, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatQuantity } from "@/lib/format";
import { transferAssets } from "@/features/assets/actions/assets-actions";
import { toAssetOptions, walletOptions } from "@/features/assets/components/asset-options";
import { usePlatform } from "@/hooks/use-platform";
import { transferSchema } from "@/features/assets/schemas/assets-schema";

export const TransferForm = ({ holdings }) => {
  const assetOptions = toAssetOptions(usePlatform().assets);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(transferSchema), defaultValues: { from: "spot", to: "perpetual", asset: "USDT", amount: "" } });
  const [from, asset] = useWatch({ control, name: ["from", "asset"] });
  const available = holdings?.[asset]?.byWallet?.[from] ?? 0;
  const { pending, submit } = useActionSubmit({
    action: transferAssets,
    setError,
    successMessage: "Transfer completed.",
    onSuccess: () => reset({ ...getValues(), amount: "" }),
  });

  const handleSwap = () => {
    const values = getValues();
    setValue("from", values.to);
    setValue("to", values.from);
  };
  const handleMax = () => setValue("amount", available, { shouldValidate: true });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field id="transfer-from" label="From">
          <Controller name="from" control={control} render={({ field }) => <SelectMenu id="transfer-from" options={walletOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        </Field>
        <button type="button" onClick={handleSwap} aria-label="Swap wallets" className="flex size-11 items-center justify-center self-center rounded-full border border-white/10 bg-cell text-white sm:self-end">
          <ArrowRightLeft className="size-4" />
        </button>
        <Field id="transfer-to" label="To" error={errors.to?.message}>
          <Controller name="to" control={control} render={({ field }) => <SelectMenu id="transfer-to" options={walletOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.to)} />} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="transfer-asset" label="Asset">
          <Controller name="asset" control={control} render={({ field }) => <SelectMenu id="transfer-asset" options={assetOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        </Field>
        <Field
          id="transfer-amount"
          label="Amount"
          error={errors.amount?.message}
          hint={`Available: ${holdings ? formatQuantity(available) : "--"} ${asset}`}
          aside={holdings && <button type="button" onClick={handleMax} className="text-xs text-brand">Max</button>}
        >
          <input id="transfer-amount" type="number" step="any" inputMode="decimal" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
        </Field>
      </div>
      <GradientButton type="submit" disabled={pending} className="self-start">
        {pending ? "Transferring…" : "Transfer"}
      </GradientButton>
    </form>
  );
};
