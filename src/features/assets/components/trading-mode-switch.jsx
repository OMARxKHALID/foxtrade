"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { ModeBadge } from "@/features/assets/components/mode-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { switchTradingMode } from "@/features/assets/actions/trading-mode-actions";

const items = [
  { value: "practice", label: "Practice" },
  { value: "live", label: "Live" },
];

const notes = {
  disabled: "Live accounts are not open yet. Everything here is practice money.",
  unverified: "Verify your identity to unlock a live account.",
};

export const TradingModeSwitch = ({ mode, liveAvailable, reason }) => {
  const router = useRouter();
  const { pending, submit } = useActionSubmit({ action: switchTradingMode, onSuccess: () => router.refresh() });

  const handleChange = (value) => {
    if (value === mode || pending) return;
    submit({ mode: value });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedTabs items={items} value={mode} onChange={handleChange} variant="pill" label="Account type" />
        <ModeBadge mode={mode} />
      </div>
      {!liveAvailable && notes[reason] && (
        <p className="text-xs text-neutral-500">
          {notes[reason]}{" "}
          {reason === "unverified" && (
            <Link href="/account/verification" className="text-brand">
              Verify now
            </Link>
          )}
        </p>
      )}
    </div>
  );
};
