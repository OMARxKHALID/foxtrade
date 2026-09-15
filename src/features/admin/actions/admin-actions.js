"use server";

import { headers } from "next/headers";
import { formFailure, validationFailure } from "@/lib/action-result";
import { getAuth } from "@/lib/auth";
import { DEMO_FAUCET_AMOUNT } from "@/lib/demo";
import { getBalances, postEntries, withTransaction } from "@/lib/ledger";
import { collections } from "@/lib/mongo";
import { addTicketMessage, setTicketStatus } from "@/lib/ticket-store";
import { asAdmin, findClient, reviewVerification, writeAudit } from "@/features/admin/dal/admin-dal";
import { banSchema, objectIdSchema, reviewSchema, ticketReplySchema, ticketStatusSchema } from "@/features/admin/schemas/admin-schema";

export const banClient = async (input) => {
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const client = await findClient(parsed.data.userId);
    if (!client) return formFailure("Client not found.");
    await getAuth().api.banUser({ body: { userId: parsed.data.userId, banReason: parsed.data.reason }, headers: await headers() });
    await writeAudit(admin, "client.ban", client.email, parsed.data.reason);
  });
};

export const unbanClient = async (userId) => {
  const parsed = objectIdSchema.safeParse(userId);
  if (!parsed.success) return formFailure("Invalid client.");
  return asAdmin(async (admin) => {
    const client = await findClient(parsed.data);
    if (!client) return formFailure("Client not found.");
    await getAuth().api.unbanUser({ body: { userId: parsed.data }, headers: await headers() });
    await writeAudit(admin, "client.unban", client.email);
  });
};

export const resetClientBalance = async (userId) => {
  const parsed = objectIdSchema.safeParse(userId);
  if (!parsed.success) return formFailure("Invalid client.");
  return asAdmin(async (admin) => {
    const client = await findClient(parsed.data);
    if (!client) return formFailure("Client not found.");
    await withTransaction(async (session) => {
      const now = new Date();
      await collections.positions().updateMany({ userId: parsed.data, status: { $in: ["open", "pending"] } }, { $set: { status: "cancelled", closeReason: "admin_reset", closedAt: now } }, { session });
      await collections.orders().updateMany({ userId: parsed.data, status: "open" }, { $set: { status: "cancelled", payout: 0, settledAt: now } }, { session });
      const balances = await getBalances(parsed.data, session);
      const clearing = balances
        .filter((item) => !item.balance.eq(0))
        .map((item) => ({ userId: parsed.data, wallet: item.wallet, asset: item.asset, type: "admin_reset", amount: item.balance.times(-1), note: "Reset by admin" }));
      await postEntries([...clearing, { userId: parsed.data, wallet: "spot", asset: "USDT", type: "admin_reset", amount: DEMO_FAUCET_AMOUNT, note: "Reset by admin" }], session);
    });
    await writeAudit(admin, "client.reset_balance", client.email, `Reset to ${DEMO_FAUCET_AMOUNT} USDT`);
  });
};

export const reviewClientVerification = async (input) => {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const updated = await reviewVerification(parsed.data.id, parsed.data.decision, parsed.data.reason);
    if (!updated) return formFailure("This submission was already reviewed.");
    await writeAudit(admin, `kyc.${parsed.data.decision}`, updated.email, parsed.data.reason ?? null);
  });
};

export const replyAsAdmin = async (input) => {
  const parsed = ticketReplySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const updated = await addTicketMessage({ id: parsed.data.id, from: "admin", author: "Foxtrade Support", body: parsed.data.message });
    if (!updated) return formFailure("This ticket is closed. Reopen it to reply.");
    await writeAudit(admin, "ticket.reply", updated.subject, updated.email);
  });
};

export const updateTicketStatus = async (input) => {
  const parsed = ticketStatusSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const updated = await setTicketStatus(parsed.data);
    if (!updated) return formFailure("Ticket not found.");
    await writeAudit(admin, `ticket.${parsed.data.status === "closed" ? "close" : "reopen"}`, updated.subject, updated.email);
  });
};
