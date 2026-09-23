"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, controlClass } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { usePlatform } from "@/hooks/use-platform";
import { walletOptions, toAssetOptions } from "@/features/assets/components/asset-options";
import {
  adjustClientBalance,
  banClient,
  closeClientPositions,
  deleteClient,
  resetClientBalance,
  revokeClientSessions,
  setClientForceWin,
  setClientPassword,
  setClientRole,
  unbanClient,
  updateClientProfile,
} from "@/features/admin/actions/admin-actions";
import { balanceAdjustSchema, clientPasswordSchema, clientProfileSchema } from "@/features/admin/schemas/admin-schema";

export const ClientProfileForm = ({ user }) => {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(clientProfileSchema), defaultValues: { userId: user.id, name: user.name, email: user.email } });
  const { pending, submit } = useActionSubmit({ action: updateClientProfile, setError, successMessage: "Profile updated.", onSuccess: () => reset(getValues()) });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <Field id="client-name" label="Name" error={errors.name?.message}>
        <input id="client-name" aria-invalid={Boolean(errors.name)} className={controlClass} {...register("name")} />
      </Field>
      <Field id="client-email" label="Email" error={errors.email?.message}>
        <input id="client-email" type="email" autoComplete="off" aria-invalid={Boolean(errors.email)} className={controlClass} {...register("email")} />
      </Field>
      <GradientButton type="submit" size="sm" disabled={pending || !isDirty} className="self-end">
        {pending ? "Saving…" : "Save Profile"}
      </GradientButton>
    </form>
  );
};

export const ClientPasswordForm = ({ userId }) => {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(clientPasswordSchema), defaultValues: { userId, password: "" } });
  const { pending, submit } = useActionSubmit({ action: setClientPassword, setError, successMessage: "Password replaced.", onSuccess: () => reset({ userId, password: "" }) });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <Field id="client-password" label="New password" hint="8+ characters with an uppercase letter and a number" error={errors.password?.message}>
        <input id="client-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} className={controlClass} {...register("password")} />
      </Field>
      <GradientButton type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "Saving…" : "Set Password"}
      </GradientButton>
    </form>
  );
};

export const ClientBalanceForm = ({ userId }) => {
  const assetOptions = toAssetOptions(usePlatform().assets);
  const defaultValues = { userId, mode: "practice", wallet: "spot", asset: "USDT", amount: "", note: "" };
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(balanceAdjustSchema), defaultValues });
  const { pending, submit } = useActionSubmit({
    action: adjustClientBalance,
    setError,
    onSuccess: ({ data }) => {
      toast.success(data?.pending ? "Sent for a second admin to approve." : "Balance updated.");
      reset(defaultValues);
    },
  });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="adjust-mode" label="Account" hint="Live changes need a second admin" error={errors.mode?.message}>
          <Controller name="mode" control={control} render={({ field }) => <SelectMenu id="adjust-mode" options={modeOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        </Field>
        <Field id="adjust-wallet" label="Wallet" error={errors.wallet?.message}>
          <Controller name="wallet" control={control} render={({ field }) => <SelectMenu id="adjust-wallet" options={walletOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        </Field>
        <Field id="adjust-asset" label="Asset" error={errors.asset?.message}>
          <Controller name="asset" control={control} render={({ field }) => <SelectMenu id="adjust-asset" options={assetOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        </Field>
        <Field id="adjust-amount" label="Amount" hint="Negative debits" error={errors.amount?.message}>
          <input id="adjust-amount" type="number" step="any" inputMode="decimal" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
        </Field>
      </div>
      <Field id="adjust-note" label="Reason" hint="Shown in their transaction history" error={errors.note?.message}>
        <input id="adjust-note" aria-invalid={Boolean(errors.note)} className={controlClass} {...register("note")} />
      </Field>
      <GradientButton type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "Applying…" : "Apply"}
      </GradientButton>
    </form>
  );
};

const modeOptions = [
  { value: "practice", label: "Practice" },
  { value: "live", label: "Live" },
];

const dialogs = {
  role: { title: "Change role", confirmLabel: "Change Role", tone: "orange" },
  sessions: { title: "Sign out everywhere", confirmLabel: "Sign Out", tone: "orange" },
  positions: { title: "Close open positions", confirmLabel: "Close All", tone: "down" },
  ban: { title: "Ban account", confirmLabel: "Ban", tone: "down", reasonLabel: "Reason (shown to the client)" },
  reset: { title: "Reset practice balance", confirmLabel: "Reset Balance", tone: "orange" },
  delete: { title: "Delete account", confirmLabel: "Delete", tone: "down" },
  forceWin: { title: "Force win", tone: "orange" },
};

export const ClientAccessPanel = ({ user, isSelf, isConfiguredAdmin, openCount, sessionCount }) => {
  const router = useRouter();
  const [dialog, setDialog] = useState(null);
  const handleClose = () => setDialog(null);
  const role = useActionSubmit({ action: setClientRole, successMessage: "Role updated.", onSuccess: handleClose });
  const sessions = useActionSubmit({ action: revokeClientSessions, successMessage: "Sessions signed out.", onSuccess: handleClose });
  const positions = useActionSubmit({
    action: closeClientPositions,
    onSuccess: ({ data }) => {
      toast.success(`Closed ${data.closed} of ${data.total} positions.`);
      handleClose();
    },
  });
  const ban = useActionSubmit({ action: banClient, successMessage: "Account banned.", onSuccess: handleClose });
  const unban = useActionSubmit({ action: unbanClient, successMessage: "Account unbanned." });
  const forceWin = useActionSubmit({ action: setClientForceWin, successMessage: "Force win updated.", onSuccess: handleClose });
  const reset = useActionSubmit({ action: resetClientBalance, successMessage: "Balance reset.", onSuccess: handleClose });
  const remove = useActionSubmit({
    action: deleteClient,
    successMessage: "Account deleted.",
    onSuccess: () => router.push("/admin/users"),
  });
  const isAdmin = user.role === "admin";
  const nextRole = isAdmin ? "user" : "admin";

  const descriptions = {
    role: isAdmin ? `${user.email} will lose access to the admin panel.` : `${user.email} will get full access to the admin panel.`,
    sessions: `All ${sessionCount} session(s) of ${user.email} will be signed out.`,
    positions: `${openCount} open position(s) will be closed at the live market price.`,
    ban: `${user.email} will be signed out and blocked from logging in.`,
    reset: `Open trades of ${user.email} will be cancelled, and all wallets cleared and refilled with the starting practice USDT.`,
    delete: `${user.email} and all their wallets, trades, tickets and KYC data will be permanently deleted.`,
    forceWin: user.forceWin
      ? `${user.email} goes back to normal settlement, including trades already open. Trades that already settled keep their outcome.`
      : `Every trade ${user.email} places while this is active will be settled as a win, regardless of the market.`,
  };

  const handleConfirm = (reason) => {
    if (dialog === "role") role.submit({ userId: user.id, role: nextRole });
    if (dialog === "sessions") sessions.submit(user.id);
    if (dialog === "positions") positions.submit(user.id);
    if (dialog === "ban") ban.submit({ userId: user.id, reason });
    if (dialog === "reset") reset.submit(user.id);
    if (dialog === "delete") remove.submit(user.id);
    if (dialog === "forceWin") forceWin.submit({ userId: user.id, enabled: !user.forceWin });
  };

  const pending = role.pending || sessions.pending || positions.pending || ban.pending || reset.pending || remove.pending || forceWin.pending;

  return (
    <div className="flex flex-col gap-3">
      {isSelf && <p className="text-sm leading-6 text-neutral-400">This is your account. Role, sessions, ban and delete are not available for yourself.</p>}
      {!isSelf && isConfiguredAdmin && <p className="text-sm leading-6 text-neutral-400">This account is ADMIN_EMAIL, so it stays an admin. Change ADMIN_EMAIL to remove its role.</p>}
      {!isSelf && !isConfiguredAdmin && (
        <GradientButton variant="dark" size="sm" onClick={() => setDialog("role")}>
          {isAdmin ? "Remove Admin Role" : "Make Admin"}
        </GradientButton>
      )}
      {!isSelf && (
        <GradientButton variant="dark" size="sm" onClick={() => setDialog("sessions")} disabled={!sessionCount}>
          Sign Out Everywhere
        </GradientButton>
      )}
      <GradientButton variant="dark" size="sm" onClick={() => setDialog("positions")} disabled={!openCount}>
        Close Open Positions
      </GradientButton>
      {!isAdmin && user.forceWin && <p className="text-sm leading-6 text-warning">Force win is active. New trades placed by this client are settled as wins.</p>}
      {!isAdmin && (
        <GradientButton variant="dark" size="sm" onClick={() => setDialog("forceWin")}>
          {user.forceWin ? "Disable Force Win" : "Enable Force Win"}
        </GradientButton>
      )}
      {!isAdmin && (
        <GradientButton variant="dark" size="sm" onClick={() => setDialog("reset")}>
          Reset Practice Balance
        </GradientButton>
      )}
      {!isAdmin &&
        (user.banned ? (
          <GradientButton variant="dark" size="sm" disabled={unban.pending} onClick={() => unban.submit(user.id)}>
            Unban Account
          </GradientButton>
        ) : (
          <GradientButton variant="dark" size="sm" onClick={() => setDialog("ban")}>
            Ban Account
          </GradientButton>
        ))}
      {!isAdmin && (
        <GradientButton variant="down" size="sm" onClick={() => setDialog("delete")}>
          Delete Account
        </GradientButton>
      )}
      <ConfirmDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => !open && handleClose()}
        title={dialogs[dialog]?.title}
        description={descriptions[dialog]}
        confirmLabel={dialog === "forceWin" ? (user.forceWin ? "Turn Off" : "Turn On") : dialogs[dialog]?.confirmLabel}
        tone={dialogs[dialog]?.tone}
        reasonLabel={dialogs[dialog]?.reasonLabel}
        pending={pending}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
