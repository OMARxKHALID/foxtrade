"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatPrice } from "@/lib/format";
import { requestWithdrawal } from "@/features/assets/actions/assets-actions";
import { assetOptions, networkOptions } from "@/features/assets/components/asset-options";
import { withdrawSchema } from "@/features/assets/schemas/assets-schema";

export const WithdrawForm = ({ holdings, addresses = [] }) => {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { asset: "USDT", network: "TRC20", address: "", amount: "", pin: "" },
  });

  const asset = useWatch({ control, name: "asset" });
  const available = holdings?.[asset]?.byWallet?.spot ?? 0;
  const saved = addresses.filter((item) => item.asset === asset);
  const { pending, submit } = useActionSubmit({ action: requestWithdrawal, setError });
  const handlePickAddress = (id) => {
    const item = addresses.find((entry) => entry.id === id);
    if (!item) return;
    setValue("network", item.network);
    setValue("address", item.address, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="withdraw-asset" label="Asset" error={errors.asset?.message}>
          <Controller
            name="asset"
            control={control}
            render={({ field }) => <SelectMenu id="withdraw-asset" options={assetOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.asset)} />}
          />
        </Field>
        <Field id="withdraw-network" label="Network" error={errors.network?.message}>
          <Controller
            name="network"
            control={control}
            render={({ field }) => <SelectMenu id="withdraw-network" options={networkOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.network)} />}
          />
        </Field>
      </div>
      {saved.length > 0 && (
        <Field id="withdraw-saved" label="Saved address">
          <SelectMenu id="withdraw-saved" placeholder="Choose a saved address" options={saved.map((item) => ({ value: item.id, label: `${item.label} · ${item.network}` }))} value="" onChange={handlePickAddress} />
        </Field>
      )}
      <Field id="withdraw-address" label="Withdrawal address" error={errors.address?.message}>
        <input id="withdraw-address" autoComplete="off" spellCheck={false} placeholder="Paste wallet address" aria-invalid={Boolean(errors.address)} className={controlClass} {...register("address")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="withdraw-amount" label="Amount" error={errors.amount?.message} hint={`Available: ${holdings ? formatPrice(available) : "--"} ${asset}`}>
          <input id="withdraw-amount" type="number" step="any" inputMode="decimal" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
        </Field>
        <Field id="withdraw-pin" label="Withdrawal PIN" error={errors.pin?.message}>
          <input id="withdraw-pin" type="password" inputMode="numeric" maxLength={6} autoComplete="one-time-code" aria-invalid={Boolean(errors.pin)} className={controlClass} {...register("pin")} />
        </Field>
      </div>
      <GradientButton type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting…" : "Withdraw"}
      </GradientButton>
    </form>
  );
};
