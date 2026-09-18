"use client";

import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { hitArea } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

const ease = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

export const BottomSheet = ({ open, onOpenChange, title, description, aside, className, children }) => (
  <Drawer.Root open={open} onOpenChange={onOpenChange}>
    <Drawer.Portal>
      <Drawer.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/70 opacity-[calc(1-var(--drawer-swipe-progress,0))] backdrop-blur-sm transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0 data-swiping:duration-0",
          ease,
        )}
      />
      <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <Drawer.Popup
          className={cn(
            "relative flex max-h-[calc(100dvh-3rem)] w-full touch-none flex-col rounded-t-2xl border border-white/10 bg-panel pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_50px_rgba(0,0,0,0.7)] outline-none",
            "[transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform data-swiping:select-none data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]",
            "after:absolute after:inset-x-0 after:top-full after:h-12 after:bg-panel",
            "sm:w-[min(26rem,calc(100vw-2rem))] sm:rounded-2xl sm:pb-0 sm:after:hidden",
            ease,
            className,
          )}
        >
          <span aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 select-none sm:px-6">
            <div className="min-w-0">
              <Drawer.Title className="font-heading text-lg font-semibold text-white">{title}</Drawer.Title>
              {description && <Drawer.Description className="mt-0.5 text-sm text-neutral-400 tabular-nums">{description}</Drawer.Description>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {aside}
              <Drawer.Close aria-label="Close" className={cn(hitArea, "flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400")}>
                <X className="size-4" />
              </Drawer.Close>
            </div>
          </div>
          <Drawer.Content className="min-h-0 touch-auto overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  </Drawer.Root>
);
