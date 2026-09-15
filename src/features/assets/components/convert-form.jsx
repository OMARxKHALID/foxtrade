"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownUp } from "lucide-react";
import { Field, SummaryList, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { CONVERT_SPREAD } from "@/lib/demo";
import { formatPrice, formatQuantity } from "@/lib/format";
import { allSymbols } from "@/lib/market/pairs";
import { convertAssets } from "@/features/assets/actions/assets-actions";
import { assetOptions } from "@/features/assets/components/asset-options";
import { convertSchema } from "@/features/assets/schemas/assets-schema";

export const ConvertForm = ({ holdings }) => {
  const tickers = useLiveTickers(allSymbols);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(convertSchema), defaultValues: { from: "USDT", to: "BTC", amount: "" } });
  const [from, to, amount] = useWatch({ control, name: ["from", "to", "amount"] });

  const usdPrice = (symbol) => (symbol === "USDT" ? 1 : tickers.find((ticker) => ticker.symbol === `${symbol}USDT`)?.price ?? 0);
  const rate = usdPrice(to) ? usdPrice(from) / usdPrice(to) : 0;
  const receive = (Number(amount) || 0) * rate * (1 - CONVERT_SPREAD);

  const handleSwap = () => {
    const values = getValues();
    setValue("from", values.to);
    setValue("to", values.from);
  };
  const available = holdings?.[from]?.byWallet?.spot ?? 0;
  const { pending, submit } = useActionSubmit({
    action: convertAssets,
    setError,
    successMessage: "Conversion completed.",
    onSuccess: () => reset({ ...getValues(), amount: "" }),
  });
  const handleMax = () => setValue("amount", available, { shouldValidate: true });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <Field
        id="convert-amount"
        label="From"
        error={errors.amount?.message}
        hint={`Available: ${holdings ? formatQuantity(available) : "--"} ${from}`}
        aside={holdings && <button type="button" onClick={handleMax} className="text-xs text-brand">Max</button>}
      >
        <div className="flex gap-2">
          <input id="convert-amount" type="number" step="any" inputMode="decimal" placeholder="0.00" aria-label="Amount to convert" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
          <Controller
            name="from"
            control={control}
            render={({ field }) => <SelectMenu id="convert-from" aria-label="Convert from" options={assetOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} className="w-28 shrink-0 sm:w-36" />}
          />
        </div>
      </Field>
      <button type="button" onClick={handleSwap} aria-label="Swap assets" className="flex size-10 items-center justify-center self-center rounded-full border border-white/10 bg-cell text-white">
        <ArrowDownUp className="size-4" />
      </button>
      <Field id="convert-to" label="To" error={errors.to?.message}>
        <div className="flex gap-2">
          <output className={`${controlClass} flex items-center text-neutral-300 tabular-nums`}>{receive ? formatQuantity(receive) : "0.00"}</output>
          <Controller
            name="to"
            control={control}
            render={({ field }) => <SelectMenu id="convert-to" aria-label="Convert to" options={assetOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.to)} className="w-28 shrink-0 sm:w-36" />}
          />
        </div>
      </Field>
      <SummaryList
        items={[
          { label: "Rate", value: rate ? `1 ${from} = ${formatPrice(rate)} ${to}` : "--" },
          { label: "Spread", value: `${CONVERT_SPREAD * 100}%` },
        ]}
      />
      <GradientButton type="submit" disabled={pending}>
        {pending ? "Converting…" : "Convert"}
      </GradientButton>
    </form>
  );
};
