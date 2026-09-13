"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const FormDialog = ({ open, onOpenChange, title, description, className, children }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <Dialog.Popup
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-white/10 bg-panel shadow-[0_24px_60px_rgba(0,0,0,0.7)] outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <Dialog.Title className="font-heading text-lg font-semibold text-white">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-1 text-sm text-neutral-400">{description}</Dialog.Description>}
          </div>
          <Dialog.Close aria-label="Close" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400">
            <X className="size-4" />
          </Dialog.Close>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
);
