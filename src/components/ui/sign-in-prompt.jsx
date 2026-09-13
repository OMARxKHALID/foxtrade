import { LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";

export const SignInPrompt = ({ title = "Sign in to continue", text, className }) => (
  <EmptyState
    icon={LockKeyhole}
    title={title}
    text={text}
    className={className}
    action={
      <div className="mt-2 flex gap-3">
        <GradientButton href="/login" variant="dark" size="sm">
          Login
        </GradientButton>
        <GradientButton href="/register" size="sm">
          Register
        </GradientButton>
      </div>
    }
  />
);
