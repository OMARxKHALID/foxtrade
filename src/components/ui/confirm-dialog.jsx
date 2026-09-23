"use client";

import { useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export const ConfirmDialog = ({ open, onOpenChange, title, description, confirmLabel = "Confirm", tone = "orange", reasonLabel, reasonKind = "text", reasonDefault = "", pending, onConfirm }) => {
  const [reason, setReason] = useState(reasonDefault);
  const amount = reasonKind === "amount";

  const handleOpenChange = (value) => {
    if (!value) setReason(reasonDefault);
    onOpenChange(value);
  };
  const handleReason = (event) => setReason(event.target.value);
  const handleConfirm = () => onConfirm(reason.trim());

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-panel p-6 shadow-[0_24px_60px_rgba(0,0,0,0.7)] outline-none">
          <AlertDialog.Title className="font-heading text-lg font-semibold text-white">{title}</AlertDialog.Title>
          {description && <AlertDialog.Description className="mt-2 text-sm leading-6 text-neutral-400">{description}</AlertDialog.Description>}
          {reasonLabel && (
            <label className="mt-5 flex flex-col gap-2 text-xs text-neutral-300">
              {reasonLabel}
              {amount ? (
                <input type="number" inputMode="decimal" step="any" min="0" value={reason} onChange={handleReason} className={controlClass} />
              ) : (
                <textarea rows={3} value={reason} onChange={handleReason} className={cn(controlClass, "h-auto py-3")} />
              )}
            </label>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Close render={<GradientButton variant="dark" size="sm" />}>Cancel</AlertDialog.Close>
            <GradientButton variant={tone} size="sm" onClick={handleConfirm} disabled={pending || (reasonLabel && (amount ? !(Number(reason) > 0) : reason.trim().length < 3))}>
              {pending ? "Working…" : confirmLabel}
            </GradientButton>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
