"use client";

import { useState } from "react";
import { Field, FieldAction, controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatUsdt } from "@/lib/format";
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
    <FormDialog
      open={Boolean(position)}
      onOpenChange={handleOpenChange}
      size="sm"
      title="Add margin"
      description={position && `${pairLabel(position.symbol)} ${position.side} ${position.leverage}x. More margin moves the liquidation price further away.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          id="add-margin-amount"
          label="Amount (USDT)"
          hint={`Available: ${formatUsdt(available)} USDT`}
          aside={
            <FieldAction onClick={handleMax}>Max</FieldAction>
          }
        >
          <input id="add-margin-amount" type="number" step="any" inputMode="decimal" value={amount} onChange={handleAmount} className={controlClass} />
        </Field>
        <GradientButton type="submit" disabled={pending || !(Number(amount) > 0)} className="self-end">
          {pending ? "Adding…" : "Add Margin"}
        </GradientButton>
      </form>
    </FormDialog>
  );
};
