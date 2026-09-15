"use client";

import { CircleAlert, CircleCheck, Info, LoaderCircle } from "lucide-react";
import { Toaster } from "sonner";

const icons = {
  error: <CircleAlert className="size-4 text-down" />,
  success: <CircleCheck className="size-4 text-up" />,
  info: <Info className="size-4 text-brand" />,
  warning: <CircleAlert className="size-4 text-warning" />,
  loading: <LoaderCircle className="size-4 animate-spin text-brand" />,
};

export const AppToaster = () => (
  <Toaster
    theme="dark"
    position="top-right"
    offset={{ top: 80, right: 16 }}
    mobileOffset={{ top: 72, left: 16, right: 16 }}
    icons={icons}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast: "flex w-full items-start gap-3 rounded-xl border border-white/10 bg-field px-4 py-3 font-sans shadow-lg sm:w-[356px]",
        icon: "mt-0.5 flex shrink-0",
        content: "flex min-w-0 flex-col gap-0.5",
        title: "text-sm leading-5 text-white",
        description: "text-xs leading-5 text-neutral-400",
      },
    }}
  />
);
