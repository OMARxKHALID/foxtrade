"use server";

import { redirect } from "next/navigation";
import { formFailure, serverFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { addTicketMessage, countOpenTickets, createTicket as insertTicket, setTicketStatus } from "@/lib/ticket-store";
import { replySchema, ticketIdSchema, ticketSchema } from "@/features/support/schemas/ticket-schema";

const MAX_OPEN_TICKETS = 5;

export const createTicket = async (input) => {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser().catch(() => null);
  if (!user) return signInRequired("Sign in to open a support ticket so we can reply to your account.");
  let ticketId;
  try {
    const limit = await rateLimit(`ticket-create:${user.id}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    if ((await countOpenTickets(user.id)) >= MAX_OPEN_TICKETS) return formFailure("You already have 5 open tickets. Close one or wait for a reply.");
    ticketId = await insertTicket(user, parsed.data);
  } catch (error) {
    return serverFailure(error);
  }
  redirect(`/support/tickets/${ticketId}`);
};

export const replyToTicket = async (input) => {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser().catch(() => null);
  if (!user) return signInRequired();
  try {
    const limit = await rateLimit(`ticket-reply:${user.id}`, { limit: 20, windowSeconds: 600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    const updated = await addTicketMessage({ id: parsed.data.id, userId: user.id, from: "client", author: user.email, body: parsed.data.message });
    if (!updated) return formFailure("This ticket is closed or no longer exists.");
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const closeTicket = async (id) => {
  const parsed = ticketIdSchema.safeParse(id);
  if (!parsed.success) return formFailure("Invalid ticket.");
  const user = await getCurrentUser().catch(() => null);
  if (!user) return signInRequired();
  try {
    const updated = await setTicketStatus({ id: parsed.data, userId: user.id, status: "closed" });
    if (!updated) return formFailure("Ticket not found.");
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};
