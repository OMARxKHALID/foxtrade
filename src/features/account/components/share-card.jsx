"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, UserPlus } from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";
import { usePlatform } from "@/hooks/use-platform";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export const ShareCard = ({ inviteUrl, inviteCode, invited }) => {
  const { siteName } = usePlatform().settings;
  const [copied, setCopied] = useState(null);

  const handleCopy = (value, key) => async () => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      <GlowCard variant="warm">
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="self-center rounded-xl bg-white p-3 sm:self-auto">
            <QRCodeSVG value={inviteUrl} size={140} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">Invite friends to {siteName}</h2>
            <p className="mt-2 text-sm text-neutral-400">Share your link. Friends get their own demo account to practice with.</p>
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-field p-1 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">{inviteUrl}</span>
              <GradientButton variant="light" size="xs" onClick={handleCopy(inviteUrl, "link")}>
                {copied === "link" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied === "link" ? "Copied" : "Copy"}
              </GradientButton>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
              Invite code
              <button
                type="button"
                onClick={handleCopy(inviteCode, "code")}
                className="rounded-md border border-white/10 bg-field px-2 py-1 font-mono text-sm tracking-widest text-white outline-none transition-colors hover:bg-cell focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {copied === "code" ? "Copied" : inviteCode}
              </button>
            </div>
          </div>
        </CardBody>
      </GlowCard>
      <GlowCard as="section" aria-labelledby="invited-title">
        <CardHeader id="invited-title" title="Invited friends" description={invited.length ? `${invited.length} joined with your link` : undefined} />
        {invited.length ? (
          <ul className="flex flex-col">
            {invited.map((friend) => (
              <li key={friend.id} className="flex items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-sm first:border-t-0 sm:px-6">
                <span className="min-w-0 truncate text-white">{friend.email}</span>
                <span className="shrink-0 text-xs text-neutral-500">{dateFormat.format(new Date(friend.joinedAt))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={UserPlus} title="No friends yet" text="Friends who sign up with your link appear here." />
        )}
      </GlowCard>
    </div>
  );
};
