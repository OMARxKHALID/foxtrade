import { LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";

export const SignInPrompt = ({ title = "Log in to continue", text, className }) => (
  <EmptyState
    icon={LockKeyhole}
    title={title}
    text={text}
    className={className}
    action={
      <div className="mt-2 flex gap-3">
        <GradientButton href="/login" variant="dark" size="sm">
          Log In
        </GradientButton>
        <GradientButton href="/register" size="sm">
          Sign Up
        </GradientButton>
      </div>
    }
  />
);
