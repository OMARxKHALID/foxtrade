"use client";

import { useState } from "react";
import { Headset, UserRound } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const ticketStatusBadges = {
  open: { tone: "brand", label: "Open" },
  answered: { tone: "success", label: "Answered" },
  closed: { tone: "neutral", label: "Closed" },
};

export const TicketThread = ({ ticket, viewer, replyAction, statusAction, statusLabel, statusValue }) => {
  const [message, setMessage] = useState("");
  const reply = useActionSubmit({ action: replyAction, successMessage: "Reply sent.", onSuccess: () => setMessage("") });
  const status = useActionSubmit({ action: statusAction, successMessage: statusValue === "closed" || !statusValue ? "Ticket closed." : "Ticket reopened." });
  const closed = ticket.status === "closed";
  const badge = ticketStatusBadges[ticket.status];

  const handleMessage = (event) => setMessage(event.target.value);
  const handleReply = (event) => {
    event.preventDefault();
    reply.submit({ id: ticket.id, message });
  };
  const handleStatus = () => status.submit(statusValue ? { id: ticket.id, status: statusValue } : ticket.id);

  return (
    <GlowCard as="section" aria-labelledby="ticket-thread-title" className="overflow-hidden">
      <CardHeader
        id="ticket-thread-title"
        title={ticket.subject}
        description={`${ticket.category} · opened ${dateFormat.format(new Date(ticket.createdAt))}${viewer === "admin" ? ` · ${ticket.email}` : ""}`}
        actions={
          <>
            <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
            {statusAction && (
              <GradientButton variant="dark" size="xs" onClick={handleStatus} disabled={status.pending}>
                {statusLabel}
              </GradientButton>
            )}
          </>
        }
      />
      <ol className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        {ticket.messages.map((item) => {
          const mine = item.from === viewer || (viewer === "client" && item.from === "client");
          const Icon = item.from === "admin" ? Headset : UserRound;
          return (
            <li key={item.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Icon className={cn("size-4", item.from === "admin" ? "text-brand" : "text-neutral-300")} />
              </span>
              <div className={cn("max-w-[80%] rounded-2xl border px-4 py-3", item.from === "admin" ? "border-brand/20 bg-brand/5" : "border-white/10 bg-field")}>
                <p className="text-xs text-neutral-500">
                  {item.from === "admin" ? "Foxtrade Support" : viewer === "admin" ? item.author : "You"} · {dateFormat.format(new Date(item.at))}
                </p>
                <p className="mt-1.5 text-sm leading-6 break-words whitespace-pre-line text-neutral-200">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <CardBody className="border-t border-white/10">
        {closed ? (
          <p className="text-sm text-neutral-500">{viewer === "admin" ? "This ticket is closed. Reopen it to reply." : "This ticket is closed. Open a new ticket if you still need help."}</p>
        ) : (
          <form onSubmit={handleReply} className="flex flex-col gap-3">
            <label htmlFor="ticket-reply" className="text-xs text-neutral-300">
              {viewer === "admin" ? "Reply to client" : "Add a reply"}
            </label>
            <textarea id="ticket-reply" rows={4} value={message} onChange={handleMessage} maxLength={4000} className={cn(controlClass, "h-auto py-3")} />
            <GradientButton type="submit" size="sm" disabled={reply.pending || message.trim().length < 2} className="self-end">
              {reply.pending ? "Sending…" : "Send Reply"}
            </GradientButton>
          </form>
        )}
      </CardBody>
    </GlowCard>
  );
};
