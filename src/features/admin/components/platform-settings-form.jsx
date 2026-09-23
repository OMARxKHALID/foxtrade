"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, controlClass } from "@/components/ui/field";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton, hitArea } from "@/components/ui/gradient-button";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
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
  supportWhatsapp: settings.supportWhatsapp,
  liveTradingEnabled: settings.liveTradingEnabled,
  minDeposit: settings.minDeposit,
  depositAddresses: settings.depositAddresses.map((item) => ({ network: item.network, address: item.address, memo: item.memo ?? "" })),
  maintenanceMode: settings.maintenanceMode,
  maintenanceMessage: settings.maintenanceMessage,
  practiceAmount: settings.practiceAmount,
  convertSpreadPercent: toPercent(settings.convertSpread),
  takerFeePercent: toPercent(settings.takerFeeRate),
  maintenanceMarginPercent: toPercent(settings.maintenanceMarginRate),
  maxLeverage: settings.maxLeverage,
  timedDurations: settings.timedDurations.map((item) => ({ seconds: item.seconds, payoutPercent: toPercent(item.payoutRate), minAmount: item.minAmount })),
});

// Panels stay mounted and are only hidden, so field arrays and the values of
// whichever tab is not on screen survive until submit.
const tabFields = {
  general: ["siteName", "tagline", "description", "supportEmail", "supportWhatsapp", "maintenanceMode", "maintenanceMessage"],
  trading: ["practiceAmount", "convertSpreadPercent", "takerFeePercent", "maintenanceMarginPercent", "maxLeverage", "timedDurations"],
  live: ["liveTradingEnabled", "minDeposit", "depositAddresses"],
};

const tabOrder = ["general", "trading", "live"];
const tabTitles = { general: "General", trading: "Trading", live: "Live funds" };

const tabOf = (field) => tabOrder.find((tab) => tabFields[tab].includes(field));

const Panel = ({ active, className, children }) => <div className={cn("flex flex-col gap-4 lg:gap-6", className, !active && "hidden")}>{children}</div>;

const TextField = ({ id, label, hint, error, register, type = "text", className, ...props }) => (
  <Field id={id} label={label} hint={hint} error={error} className={className}>
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
  const addresses = useFieldArray({ control, name: "depositAddresses" });
  const { pending, submit } = useActionSubmit({ action: savePlatformSettings, setError, successMessage: "Settings saved.", onSuccess: () => reset(getValues()) });

  const [tab, setTab] = useState("general");

  // A hidden panel would swallow its own error, so jump to the first tab that has one.
  const handleInvalid = (fieldErrors) => {
    const failed = Object.keys(fieldErrors).map(tabOf).filter(Boolean);
    const first = tabOrder.find((item) => failed.includes(item));
    if (first) setTab(first);
  };

  const tabs = tabOrder.map((value) => {
    const failed = tabFields[value].some((field) => errors[field]);
    return {
      value,
      label: (
        <span className="flex items-center gap-1.5">
          {tabTitles[value]}
          {failed && <span className="size-1.5 rounded-full bg-down" aria-label="has errors" />}
        </span>
      ),
    };
  });

  const handleAddDuration = () => durations.append({ seconds: 60, payoutPercent: 80, minAmount: 10 });
  const handleAddAddress = () => addresses.append({ network: "TRC20", address: "", memo: "" });

  return (
    <form onSubmit={handleSubmit(submit, handleInvalid)} noValidate className="flex flex-col gap-4 lg:gap-6">
      <SegmentedTabs items={tabs} value={tab} onChange={setTab} label="Settings section" />

      <Panel active={tab === "general"}>
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
              <TextField
                id="supportWhatsapp"
                label="Support WhatsApp"
                hint="Full number with country code, digits only, e.g. 447700900123. Leave empty to hide it."
                inputMode="numeric"
                error={errors.supportWhatsapp?.message}
                register={register}
              />
            </CardBody>
          </GlowCard>
          <GlowCard as="section" aria-labelledby="maintenance-title">
            <CardHeader id="maintenance-title" title="Maintenance mode" description="Closes the client app for everyone. The admin panel stays open, so you can always switch it back off from here." />
            <CardBody className="flex flex-col gap-5">
              <Controller
                name="maintenanceMode"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start gap-3 text-sm text-white">
                    <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} className={cn(hitArea, "mt-0.5 after:-inset-3")} aria-label="Maintenance mode" />
                    <span>
                      Turn on maintenance mode
                      <span className="mt-1 block text-xs text-neutral-500">Everyone sees the notice below instead of the app, including you. Open trades keep settling in the background.</span>
                    </span>
                  </label>
                )}
              />
              <Field id="maintenanceMessage" label="Notice shown to clients" error={errors.maintenanceMessage?.message}>
                <textarea
                  id="maintenanceMessage"
                  rows={3}
                  aria-invalid={Boolean(errors.maintenanceMessage)}
                  className={cn(controlClass, "h-auto py-3")}
                  {...register("maintenanceMessage")}
                />
              </Field>
            </CardBody>
          </GlowCard>
        </div>
      </Panel>

      <Panel active={tab === "trading"}>
        <GlowCard as="section" aria-labelledby="funds-title">
          <CardHeader id="funds-title" title="Funds and fees" description="Rates are percentages. Open positions keep the fee they were opened with." />
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField id="practiceAmount" label="Practice amount (USDT)" hint="Sign-up bonus and faucet cap" type="number" error={errors.practiceAmount?.message} register={register} />
            <TextField id="convertSpreadPercent" label="Convert spread (%)" type="number" error={errors.convertSpreadPercent?.message} register={register} />
            <TextField id="takerFeePercent" label="Futures taker fee (%)" type="number" error={errors.takerFeePercent?.message} register={register} />
            <TextField id="maintenanceMarginPercent" label="Maintenance margin (%)" type="number" error={errors.maintenanceMarginPercent?.message} register={register} />
            <TextField id="maxLeverage" label="Platform max leverage" hint="Caps every pair" type="number" error={errors.maxLeverage?.message} register={register} />
          </CardBody>
        </GlowCard>
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
      </Panel>

      <Panel active={tab === "live"}>
        <GlowCard as="section" aria-labelledby="live-title">
          <CardHeader
            id="live-title"
            title="Live trading"
            description="Master switch for real funds. While this is off, every account trades practice balances no matter what they have selected."
          />
          <CardBody>
            <Controller
              name="liveTradingEnabled"
              control={control}
              render={({ field }) => (
                <label className="flex items-start gap-3 text-sm text-white">
                  <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} className={cn(hitArea, "mt-0.5 after:-inset-3")} aria-label="Live trading" />
                  <span>
                    Allow live accounts
                    <span className="mt-1 block text-xs text-neutral-500">
                      Only turn this on once deposits, withdrawals and identity checks are live. Clients still need approved KYC before they can switch.
                    </span>
                  </span>
                </label>
              )}
            />
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="deposits-title">
          <CardHeader
            id="deposits-title"
            title="Live deposit addresses"
            description="Where clients send real USDT. Every deposit is credited by hand after an admin checks the transaction."
            actions={
              <GradientButton variant="dark" size="sm" onClick={handleAddAddress} disabled={addresses.fields.length >= 6}>
                <Plus className="size-3.5" />
                Add Network
              </GradientButton>
            }
          />
          <CardBody className="flex flex-col gap-3">
            <TextField id="minDeposit" label="Smallest deposit (USDT)" type="number" error={errors.minDeposit?.message} register={register} className="sm:max-w-60" />
            {addresses.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 items-end gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)_minmax(0,0.7fr)_auto] sm:border-b-0 sm:pb-0">
                <TextField id={`depositAddresses.${index}.network`} label="Network" error={errors.depositAddresses?.[index]?.network?.message} register={register} />
                <TextField id={`depositAddresses.${index}.address`} label="Address" error={errors.depositAddresses?.[index]?.address?.message} register={register} />
                <TextField id={`depositAddresses.${index}.memo`} label="Memo (optional)" error={errors.depositAddresses?.[index]?.memo?.message} register={register} />
                <IconButton label={`Remove network ${index + 1}`} onClick={() => addresses.remove(index)} className="mb-1 justify-self-start sm:justify-self-auto">
                  <Trash2 className="size-4 text-down" />
                </IconButton>
              </div>
            ))}
            {!addresses.fields.length && <p className="text-xs text-neutral-500">No address published. Clients cannot deposit real funds until you add one.</p>}
            {errors.depositAddresses?.message && <p className="text-xs text-down">{errors.depositAddresses.message}</p>}
            {errors.depositAddresses?.root?.message && <p className="text-xs text-down">{errors.depositAddresses.root.message}</p>}
          </CardBody>
        </GlowCard>
      </Panel>

      <div className="flex justify-end">
        <GradientButton type="submit" disabled={pending || !isDirty}>
          {pending ? "Saving…" : "Save Settings"}
        </GradientButton>
      </div>
    </form>
  );
};
