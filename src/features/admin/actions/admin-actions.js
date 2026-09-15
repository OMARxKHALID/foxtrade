"use server";

import { headers } from "next/headers";
import { formFailure, validationFailure } from "@/lib/action-result";
import { getAuth } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { readPlatformSettings } from "@/lib/platform-settings";
import { getBalances, postEntries, withTransaction } from "@/lib/ledger";
import { readPairs } from "@/lib/market/pair-store";
import { assetsOf } from "@/lib/market/pairs";
import { collections } from "@/lib/mongo";
import { addTicketMessage, setTicketStatus } from "@/lib/ticket-store";
import { asAdmin, findClient, findUser, reviewVerification, writeAudit } from "@/features/admin/dal/admin-dal";
import { closeAllPositions } from "@/features/trading/dal/trading-engine";
import {
  balanceAdjustSchema,
  banSchema,
  clientPasswordSchema,
  clientProfileSchema,
  clientRoleSchema,
  objectIdSchema,
  reviewSchema,
  ticketReplySchema,
  ticketStatusSchema,
} from "@/features/admin/schemas/admin-schema";

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
    const { demoAmount } = await readPlatformSettings();
    await withTransaction(async (session) => {
      const now = new Date();
      await collections.positions().updateMany({ userId: parsed.data, status: { $in: ["open", "pending"] } }, { $set: { status: "cancelled", closeReason: "admin_reset", closedAt: now } }, { session });
      await collections.orders().updateMany({ userId: parsed.data, status: "open" }, { $set: { status: "cancelled", payout: 0, settledAt: now } }, { session });
      const balances = await getBalances(parsed.data, session);
      const clearing = balances
        .filter((item) => !item.balance.eq(0))
        .map((item) => ({ userId: parsed.data, wallet: item.wallet, asset: item.asset, type: "admin_reset", amount: item.balance.times(-1), note: "Reset by admin" }));
      await postEntries([...clearing, { userId: parsed.data, wallet: "spot", asset: "USDT", type: "admin_reset", amount: demoAmount, note: "Reset by admin" }], session);
    });
    await writeAudit(admin, "client.reset_balance", client.email, `Reset to ${demoAmount} USDT`);
  });
};

export const reviewClientVerification = async (input) => {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const updated = await reviewVerification(parsed.data.id, parsed.data.decision, parsed.data.reason);
    if (!updated) return formFailure(`This submission is already ${parsed.data.decision}.`);
    await writeAudit(admin, `kyc.${parsed.data.decision}`, updated.email, parsed.data.reason ?? null);
  });
};

export const replyAsAdmin = async (input) => {
  const parsed = ticketReplySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const updated = await addTicketMessage({ id: parsed.data.id, from: "admin", author: `${(await readPlatformSettings()).siteName} Support`, body: parsed.data.message });
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

const targetUser = async (admin, userId, { allowSelf = false } = {}) => {
  const user = await findUser(userId);
  if (!user) return { failure: formFailure("User not found.") };
  if (!allowSelf && user._id.toString() === admin.id) return { failure: formFailure("You cannot do this to your own account.") };
  return { user };
};

export const updateClientProfile = async (input) => {
  const parsed = clientProfileSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data.userId, { allowSelf: true });
    if (failure) return failure;
    const email = parsed.data.email.toLowerCase();
    await getAuth().api.adminUpdateUser({ body: { userId: parsed.data.userId, data: { name: parsed.data.name, email } }, headers: await headers() });
    if (email !== user.email) {
      await Promise.all([
        collections.tickets().updateMany({ userId: parsed.data.userId }, { $set: { email } }),
        collections.verifications().updateMany({ userId: parsed.data.userId }, { $set: { email } }),
      ]);
    }
    await writeAudit(admin, "client.update_profile", email, email !== user.email ? `Email changed from ${user.email}` : "Name updated");
  });
};

export const setClientPassword = async (input) => {
  const parsed = clientPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data.userId);
    if (failure) return failure;
    const requestHeaders = await headers();
    await getAuth().api.setUserPassword({ body: { userId: parsed.data.userId, newPassword: parsed.data.password }, headers: requestHeaders });
    await getAuth().api.revokeUserSessions({ body: { userId: parsed.data.userId }, headers: requestHeaders });
    await writeAudit(admin, "client.set_password", user.email, "Password replaced and sessions signed out");
  });
};

export const setClientRole = async (input) => {
  const parsed = clientRoleSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data.userId);
    if (failure) return failure;
    if (parsed.data.role === "user" && user.email === getEnv().ADMIN_EMAIL?.toLowerCase()) return formFailure("This account is ADMIN_EMAIL and is made admin again on every login. Change ADMIN_EMAIL first.");
    await getAuth().api.setRole({ body: { userId: parsed.data.userId, role: parsed.data.role }, headers: await headers() });
    await writeAudit(admin, parsed.data.role === "admin" ? "client.promote" : "client.demote", user.email);
  });
};

export const revokeClientSessions = async (userId) => {
  const parsed = objectIdSchema.safeParse(userId);
  if (!parsed.success) return formFailure("Invalid user.");
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data);
    if (failure) return failure;
    await getAuth().api.revokeUserSessions({ body: { userId: parsed.data }, headers: await headers() });
    await writeAudit(admin, "client.revoke_sessions", user.email);
  });
};

export const adjustClientBalance = async (input) => {
  const parsed = balanceAdjustSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data.userId, { allowSelf: true });
    if (failure) return failure;
    const { userId, wallet, asset, amount, note } = parsed.data;
    if (!assetsOf(await readPairs()).some((item) => item.symbol === asset)) return formFailure(`${asset} is not a listed asset.`);
    await withTransaction((session) => postEntries([{ userId, wallet, asset, type: "admin_adjust", amount, note }], session));
    await writeAudit(admin, amount > 0 ? "client.credit" : "client.debit", user.email, `${amount > 0 ? "+" : ""}${amount} ${asset} (${wallet}): ${note}`);
  });
};

export const closeClientPositions = async (userId) => {
  const parsed = objectIdSchema.safeParse(userId);
  if (!parsed.success) return formFailure("Invalid user.");
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data, { allowSelf: true });
    if (failure) return failure;
    const { closed, total } = await closeAllPositions(parsed.data);
    await writeAudit(admin, "client.close_positions", user.email, `${closed} of ${total} closed at market`);
    return { ok: true, data: { closed, total } };
  });
};

export const deleteClient = async (userId) => {
  const parsed = objectIdSchema.safeParse(userId);
  if (!parsed.success) return formFailure("Invalid user.");
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data);
    if (failure) return failure;
    if (user.role === "admin") return formFailure("Remove the admin role before deleting this account.");
    const owned = { userId: parsed.data };
    await Promise.all(
      [collections.wallets(), collections.ledger(), collections.orders(), collections.positions(), collections.tickets(), collections.verifications(), collections.addresses(), collections.security()].map(
        (collection) => collection.deleteMany(owned),
      ),
    );
    await getAuth().api.removeUser({ body: { userId: parsed.data }, headers: await headers() });
    await writeAudit(admin, "client.delete", user.email);
  });
};
