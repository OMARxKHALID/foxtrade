"use client";

import { useState } from "react";
import { SchemaForm } from "@/components/forms/schema-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { changePassword, setWithdrawalPin, signOutOtherDevices } from "@/features/account/actions/account-actions";
import { changePasswordSchema, withdrawalPinSchema } from "@/features/account/schemas/account-schema";

export const ChangePasswordForm = () => (
  <SchemaForm
    schema={changePasswordSchema}
    action={changePassword}
    defaultValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
    successMessage="Password updated."
    submitLabel="Update Password"
    fields={[
      { name: "currentPassword", label: "Current password", type: "password", autoComplete: "current-password", span: "full" },
      { name: "newPassword", label: "New password", type: "password", autoComplete: "new-password", hint: "8+ characters with an uppercase letter and a number" },
      { name: "confirmPassword", label: "Confirm new password", type: "password", autoComplete: "new-password" },
    ]}
    columns={2}
  />
);

export const WithdrawalPinForm = () => (
  <SchemaForm
    schema={withdrawalPinSchema}
    action={setWithdrawalPin}
    defaultValues={{ pin: "", confirmPin: "" }}
    successMessage="Withdrawal PIN saved."
    submitLabel="Save PIN"
    fields={[
      { name: "pin", label: "6-digit PIN", type: "password", inputMode: "numeric", maxLength: 6, autoComplete: "off" },
      { name: "confirmPin", label: "Confirm PIN", type: "password", inputMode: "numeric", maxLength: 6, autoComplete: "off" },
    ]}
    columns={2}
  />
);

export const SignOutOtherDevicesButton = ({ count }) => {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useActionSubmit({ action: signOutOtherDevices, successMessage: "Other devices signed out.", onSuccess: () => setOpen(false) });

  return (
    <>
      <GradientButton variant="dark" size="sm" onClick={() => setOpen(true)}>
        Log Out Other Devices
      </GradientButton>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Log out other devices"
        description={`${count} other session(s) will be signed out. This device stays logged in.`}
        confirmLabel="Log Out"
        tone="down"
        pending={pending}
        onConfirm={() => submit()}
      />
    </>
  );
};
