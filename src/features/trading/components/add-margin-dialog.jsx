"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatPrice } from "@/lib/format";
import { addMargin } from "@/features/trading/actions/place-order";
import { pairLabel } from "@/features/trading/components/trade-format";

export const AddMarginDialog = ({ position, available, onClose, onDone }) => {
  const [amount, setAmount] = useState("");
  const { pending, submit } = useActionSubmit({
    action: addMargin,
    successMessage: "Margin added.",
    onSuccess: () => {
      setAmount("");
      onDone();
      onClose();
    },
  });

  const handleAmount = (event) => setAmount(event.target.value);
  const handleMax = () => setAmount(String(available));
  const handleOpenChange = (open) => !open && onClose();
  const handleSubmit = (event) => {
    event.preventDefault();
    submit({ id: position.id, amount });
  };

  return (
    <Dialog.Root open={Boolean(position)} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-panel p-6 shadow-[0_24px_60px_rgba(0,0,0,0.7)] outline-none">
          <Dialog.Title className="font-heading text-lg font-semibold text-white">Add margin</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-neutral-400">
            {position && `${pairLabel(position.symbol)} ${position.side} ${position.leverage}x. More margin moves the liquidation price further away.`}
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="add-margin-amount" className="text-neutral-300">
                Amount (USDT)
              </label>
              <button type="button" onClick={handleMax} className="text-brand">
                Max
              </button>
            </div>
            <input id="add-margin-amount" type="number" step="any" inputMode="decimal" value={amount} onChange={handleAmount} className={controlClass} />
            <p className="text-xs text-neutral-500">Available: {formatPrice(available)} USDT</p>
            <div className="mt-4 flex justify-end gap-3">
              <Dialog.Close render={<GradientButton variant="dark" size="sm" />}>Cancel</Dialog.Close>
              <GradientButton type="submit" size="sm" disabled={pending || !(Number(amount) > 0)}>
                {pending ? "Adding…" : "Add Margin"}
              </GradientButton>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
