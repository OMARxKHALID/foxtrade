"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { applyFieldErrors } from "@/lib/action-result";
import { notifyResult } from "@/lib/notify";

export const useActionSubmit = ({ action, setError, successMessage, onSuccess }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const locked = useRef(false);

  const submit = (values) => {
    if (locked.current) return;
    locked.current = true;
    startTransition(async () => {
      try {
        const result = await action(values);
        if (!result) return;
        if (setError) applyFieldErrors(result, setError);
        notifyResult(result, successMessage);
        if (!result.ok) return;
        onSuccess?.(result);
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        locked.current = false;
      }
    });
  };

  return { pending, submit };
};
