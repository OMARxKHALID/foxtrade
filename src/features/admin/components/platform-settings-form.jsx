"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Field, controlClass } from "@/components/ui/field";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";
import { savePlatformSettings } from "@/features/admin/actions/platform-actions";
import { platformSettingsSchema } from "@/features/admin/schemas/admin-schema";

const toPercent = (rate) => +(rate * 100).toFixed(6);

const toFormValues = (settings) => ({
  siteName: settings.siteName,
  tagline: settings.tagline,
  description: settings.description,
  supportEmail: settings.supportEmail,
  demoAmount: settings.demoAmount,
  convertSpreadPercent: toPercent(settings.convertSpread),
  takerFeePercent: toPercent(settings.takerFeeRate),
  maintenanceMarginPercent: toPercent(settings.maintenanceMarginRate),
  maxLeverage: settings.maxLeverage,
  timedDurations: settings.timedDurations.map((item) => ({ seconds: item.seconds, payoutPercent: toPercent(item.payoutRate), minAmount: item.minAmount })),
});

const TextField = ({ id, label, hint, error, register, type = "text", ...props }) => (
  <Field id={id} label={label} hint={hint} error={error}>
    <input id={id} type={type} step="any" aria-invalid={Boolean(error)} className={controlClass} {...register(id)} {...props} />
  </Field>
);

export const PlatformSettingsForm = ({ settings }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(platformSettingsSchema), defaultValues: toFormValues(settings) });
  const durations = useFieldArray({ control, name: "timedDurations" });
  const { pending, submit } = useActionSubmit({ action: savePlatformSettings, setError, successMessage: "Settings saved.", onSuccess: () => reset(getValues()) });

  const handleAddDuration = () => durations.append({ seconds: 60, payoutPercent: 80, minAmount: 10 });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <GlowCard as="section" aria-labelledby="identity-title">
          <CardHeader id="identity-title" title="Site identity" description="Shown in the navbar, page titles, emails and the installed app." />
          <CardBody className="flex flex-col gap-5">
            <TextField id="siteName" label="Site name" error={errors.siteName?.message} register={register} />
            <TextField id="tagline" label="Tagline" error={errors.tagline?.message} register={register} />
            <Field id="description" label="Description" hint="Used for search engines and the installed app." error={errors.description?.message}>
              <textarea id="description" rows={3} aria-invalid={Boolean(errors.description)} className={cn(controlClass, "h-auto py-3")} {...register("description")} />
            </Field>
            <TextField id="supportEmail" label="Support email" type="email" error={errors.supportEmail?.message} register={register} />
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="funds-title">
          <CardHeader id="funds-title" title="Funds and fees" description="Rates are percentages. Open positions keep the fee they were opened with." />
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField id="demoAmount" label="Demo amount (USDT)" hint="Sign-up bonus and faucet cap" type="number" error={errors.demoAmount?.message} register={register} />
            <TextField id="convertSpreadPercent" label="Convert spread (%)" type="number" error={errors.convertSpreadPercent?.message} register={register} />
            <TextField id="takerFeePercent" label="Futures taker fee (%)" type="number" error={errors.takerFeePercent?.message} register={register} />
            <TextField id="maintenanceMarginPercent" label="Maintenance margin (%)" type="number" error={errors.maintenanceMarginPercent?.message} register={register} />
            <TextField id="maxLeverage" label="Platform max leverage" hint="Caps every pair" type="number" error={errors.maxLeverage?.message} register={register} />
          </CardBody>
        </GlowCard>
      </div>
      <GlowCard as="section" aria-labelledby="durations-title">
        <CardHeader
          id="durations-title"
          title="Options durations and payouts"
          description="A winning timed trade returns the stake plus the payout percentage."
          actions={
            <GradientButton variant="dark" size="sm" onClick={handleAddDuration} disabled={durations.fields.length >= 10}>
              <Plus className="size-3.5" />
              Add Duration
            </GradientButton>
          }
        />
        <CardBody className="flex flex-col gap-3">
          {durations.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 items-end gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:border-b-0 sm:pb-0">
              <TextField id={`timedDurations.${index}.seconds`} label="Seconds" type="number" error={errors.timedDurations?.[index]?.seconds?.message} register={register} />
              <TextField id={`timedDurations.${index}.payoutPercent`} label="Payout (%)" type="number" error={errors.timedDurations?.[index]?.payoutPercent?.message} register={register} />
              <TextField id={`timedDurations.${index}.minAmount`} label="Min stake" type="number" error={errors.timedDurations?.[index]?.minAmount?.message} register={register} />
              <IconButton label={`Remove duration ${index + 1}`} onClick={() => durations.remove(index)} disabled={durations.fields.length === 1} className="mb-1 justify-self-start sm:justify-self-auto">
                <Trash2 className="size-4 text-down" />
              </IconButton>
            </div>
          ))}
          {errors.timedDurations?.message && <p className="text-xs text-down">{errors.timedDurations.message}</p>}
          {errors.timedDurations?.root?.message && <p className="text-xs text-down">{errors.timedDurations.root.message}</p>}
        </CardBody>
      </GlowCard>
      <div className="flex justify-end">
        <GradientButton type="submit" disabled={pending || !isDirty}>
          {pending ? "Saving…" : "Save Settings"}
        </GradientButton>
      </div>
    </form>
  );
};
