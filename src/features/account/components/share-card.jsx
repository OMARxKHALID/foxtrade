"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, UserPlus } from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { EmptyState } from "@/components/ui/empty-state";

export const ShareCard = ({ inviteUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      <GlowCard variant="warm">
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="self-center rounded-xl bg-white p-3 sm:self-auto">
            <QRCodeSVG value={inviteUrl} size={140} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl font-bold text-white">Invite friends to Foxtrade</h2>
            <p className="mt-2 text-sm text-neutral-400">Share your link. Friends get their own demo account to practice with.</p>
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-field p-1 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">{inviteUrl}</span>
              <button type="button" onClick={handleCopy} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-semibold text-neutral-900">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </CardBody>
      </GlowCard>
      <GlowCard as="section" aria-labelledby="invited-title">
        <CardHeader id="invited-title" title="Invited friends" />
        <EmptyState icon={UserPlus} title="Invite tracking is coming soon" text="Friends who join with your link will appear here." />
      </GlowCard>
    </div>
  );
};
