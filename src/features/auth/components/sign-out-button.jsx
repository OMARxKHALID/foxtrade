"use client";

import { LogOut } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { signOut } from "@/features/auth/actions/auth-actions";

export const SignOutButton = ({ className, size = "sm" }) => {
  const { pending, submit } = useActionSubmit({ action: signOut });

  const handleSignOut = () => submit();

  return (
    <GradientButton variant="dark" size={size} onClick={handleSignOut} disabled={pending} className={className}>
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Log Out"}
    </GradientButton>
  );
};
