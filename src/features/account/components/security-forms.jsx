"use client";

import { SchemaForm } from "@/components/forms/schema-form";
import { changePassword, setWithdrawalPin } from "@/features/account/actions/account-actions";
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
