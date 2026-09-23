"use server";

import Big from "big.js";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { formFailure, validationFailure } from "@/lib/action-result";
import { getAuth } from "@/lib/auth";
import { deletePrivateImages } from "@/lib/document-storage";
import { getEnv } from "@/lib/env";
import { readPlatformSettings } from "@/lib/platform-settings";
import { getBalances, postEntries, withTransaction } from "@/lib/ledger";
import { readPairs } from "@/lib/market/pair-store";
import { assetsOf } from "@/lib/market/pairs";
import { reportError } from "@/lib/error-log";
import { collections } from "@/lib/mongo";
import { addTicketMessage, setTicketStatus } from "@/lib/ticket-store";
import { asAdmin, findClient, findUser, reviewVerification, reviewVerificationDocuments, writeAudit } from "@/features/admin/dal/admin-dal";
import { closeAllPositions } from "@/features/trading/dal/trading-engine";
import { approveWithdrawal, creditDeposit, markWithdrawalSent, rejectDeposit, rejectWithdrawal } from "@/features/assets/dal/funding-dal";
import { invalidateOverlay } from "@/lib/market/overlay";
import {
  balanceAdjustSchema,
  banSchema,
  clientForceWinSchema,
  clientsForceWinSchema,
  clientPasswordSchema,
  clientProfileSchema,
  clientRoleSchema,
  documentsReviewSchema,
  objectIdSchema,
  reviewSchema,
  ticketReplySchema,
  ticketStatusSchema,
  depositConfirmSchema,
  depositRejectSchema,
  withdrawalRejectSchema,
  withdrawalSentSchema,
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
    const { practiceAmount } = await readPlatformSettings();
    await withTransaction(async (session) => {
      const now = new Date();
      await collections.positions().updateMany({ userId: parsed.data, mode: "practice", status: { $in: ["open", "pending"] } }, { $set: { status: "cancelled", closeReason: "admin_reset", closedAt: now } }, { session });
      await collections.orders().updateMany({ userId: parsed.data, mode: "practice", status: "open" }, { $set: { status: "cancelled", payout: 0, settledAt: now } }, { session });
      await collections.positionCounters().updateOne({ _id: `${parsed.data}:practice` }, { $set: { count: 0 } }, { session });
      // Practice only on purpose: a reset must never touch a client's real funds.
      const balances = await getBalances(parsed.data, session, "practice");
      const clearing = balances
        .filter((item) => !item.balance.eq(0))
        .map((item) => ({ userId: parsed.data, mode: "practice", wallet: item.wallet, asset: item.asset, type: "admin_reset", amount: item.balance.times(-1), note: "Reset by admin" }));
      await postEntries([...clearing, { userId: parsed.data, mode: "practice", wallet: "spot", asset: "USDT", type: "admin_reset", amount: practiceAmount, note: "Reset by admin" }], session);
    });
    await writeAudit(admin, "client.reset_balance", client.email, `Reset to ${practiceAmount} USDT`);
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

export const reviewClientDocuments = async (input) => {
  const parsed = documentsReviewSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const previous = await reviewVerificationDocuments(parsed.data.id, parsed.data.decision, parsed.data.reason);
    if (!previous) return formFailure(`These documents are already ${parsed.data.decision} or were not submitted.`);
    if (parsed.data.decision === "rejected") {
      await collections.verifications().updateOne({ _id: previous._id }, { $unset: { "documents.front": "", "documents.back": "" } });
      await deletePrivateImages([previous.documents.front.publicId, previous.documents.back.publicId]).catch((error) => reportError(error, { job: "deleteRejectedKycFiles", email: previous.email }));
    }
    await writeAudit(admin, `kyc.documents_${parsed.data.decision}`, previous.email, parsed.data.reason ?? null);
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

export const setClientForceWin = async (input) => {
  const parsed = clientForceWinSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const client = await findClient(parsed.data.userId);
    if (!client) return formFailure("Client not found.");
    await collections.users().updateOne({ _id: new ObjectId(parsed.data.userId) }, { $set: { forceWin: parsed.data.enabled } });
    if (!parsed.data.enabled) {
      await collections.orders().updateMany({ userId: parsed.data.userId, status: "open", forcedWin: true }, { $set: { forcedWin: false } });
      await collections.positions().updateMany({ userId: parsed.data.userId, status: { $in: ["open", "pending"] }, forcedWin: true }, { $set: { forcedWin: false } });
    }
    invalidateOverlay(parsed.data.userId);
    await writeAudit(admin, parsed.data.enabled ? "client.force_win_on" : "client.force_win_off", client.email, parsed.data.enabled ? "New trades always win" : "Back to normal settlement");
  });
};

export const setClientsForceWin = async (input) => {
  const parsed = clientsForceWinSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const ids = [...new Set(parsed.data.userIds)].map((id) => new ObjectId(id));
    const clients = await collections.users().find({ _id: { $in: ids }, role: { $ne: "admin" } }).toArray();
    if (!clients.length) return formFailure("No clients found.");
    const userIds = clients.map((client) => client._id.toString());
    await collections.users().updateMany({ _id: { $in: clients.map((client) => client._id) } }, { $set: { forceWin: parsed.data.enabled } });
    if (!parsed.data.enabled) {
      await collections.orders().updateMany({ userId: { $in: userIds }, status: "open", forcedWin: true }, { $set: { forcedWin: false } });
      await collections.positions().updateMany({ userId: { $in: userIds }, status: { $in: ["open", "pending"] }, forcedWin: true }, { $set: { forcedWin: false } });
    }
    userIds.forEach(invalidateOverlay);
    await writeAudit(admin, parsed.data.enabled ? "client.force_win_on" : "client.force_win_off", `${clients.length} clients`, clients.map((client) => client.email).join(", ").slice(0, 400));
    return { ok: true, data: { count: clients.length } };
  });
};

export const adjustClientBalance = async (input) => {
  const parsed = balanceAdjustSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const { user, failure } = await targetUser(admin, parsed.data.userId, { allowSelf: true });
    if (failure) return failure;
    const { userId, mode, wallet, asset, amount, note } = parsed.data;
    if (!assetsOf(await readPairs()).some((item) => item.symbol === asset)) return formFailure(`${asset} is not a listed asset.`);
    const credit = !amount.startsWith("-");

    // Practice balances are not money, so one admin is enough. Real funds need a
    // second pair of eyes, and the requester is never allowed to be both.
    if (mode === "live") {
      await collections.adjustments().insertOne({
        userId,
        mode,
        wallet,
        asset,
        amount,
        note,
        status: "pending",
        requestedBy: admin.id,
        requestedByEmail: admin.email,
        targetEmail: user.email,
        reviewedBy: null,
        createdAt: new Date(),
        reviewedAt: null,
      });
      await writeAudit(admin, "client.adjust_requested", user.email, `${credit ? "+" : ""}${amount} ${asset} (${wallet}, live): ${note}`);
      return { ok: true, data: { pending: true } };
    }

    await withTransaction((session) => postEntries([{ userId, mode, wallet, asset, type: "admin_adjust", amount, note }], session));
    await writeAudit(admin, credit ? "client.credit" : "client.debit", user.email, `${credit ? "+" : ""}${amount} ${asset} (${wallet}): ${note}`);
    return { ok: true, data: { pending: false } };
  });
};

const claimAdjustment = async (id, admin) => {
  if (!ObjectId.isValid(id)) return { failure: formFailure("Unknown request.") };
  const adjustment = await collections.adjustments().findOne({ _id: new ObjectId(id), status: "pending" });
  if (!adjustment) return { failure: formFailure("This request was already reviewed.") };
  if (adjustment.requestedBy === admin.id) return { failure: formFailure("A second admin has to approve a live balance change.") };
  return { adjustment };
};

export const approveAdjustment = async (id) =>
  asAdmin(async (admin) => {
    const { adjustment, failure } = await claimAdjustment(id, admin);
    if (failure) return failure;
    const { userId, mode, wallet, asset, amount, note } = adjustment;
    await withTransaction(async (session) => {
      const claimed = await collections
        .adjustments()
        .findOneAndUpdate({ _id: adjustment._id, status: "pending" }, { $set: { status: "approved", reviewedBy: admin.id, reviewedAt: new Date() } }, { session });
      if (!claimed) throw new Error("Adjustment already reviewed.");
      await postEntries([{ userId, mode, wallet, asset, type: "admin_adjust", amount, note }], session);
    });
    const credit = !amount.startsWith("-");
    await writeAudit(admin, credit ? "client.credit" : "client.debit", adjustment.targetEmail, `${credit ? "+" : ""}${amount} ${asset} (${wallet}, live) approved, requested by ${adjustment.requestedByEmail}`);
  });

export const rejectAdjustment = async (id) =>
  asAdmin(async (admin) => {
    const { adjustment, failure } = await claimAdjustment(id, admin);
    if (failure) return failure;
    await collections
      .adjustments()
      .updateOne({ _id: adjustment._id, status: "pending" }, { $set: { status: "rejected", reviewedBy: admin.id, reviewedAt: new Date() } });
    await writeAudit(admin, "client.adjust_rejected", adjustment.targetEmail, `${adjustment.amount} ${adjustment.asset} requested by ${adjustment.requestedByEmail}`);
  });

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

// The client only claims what they sent. The amount credited is the one the
// admin verified on-chain, and the transaction hash is what stops the same
// payment being credited twice.
//
// Crediting is single admin, unlike a live balance adjustment, which needs two.
// The claimed amount is the ceiling so that one admin still cannot mint live
// funds on their own: someone has to have reported that transfer first.
export const confirmClientDeposit = async (input) => {
  const parsed = depositConfirmSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const deposit = ObjectId.isValid(parsed.data.id) ? await collections.deposits().findOne({ _id: new ObjectId(parsed.data.id) }) : null;
    if (!deposit) return formFailure("Unknown deposit.");
    if (!deposit.reference) return formFailure("This deposit has no transaction reference.");
    if (new Big(parsed.data.amount).gt(deposit.amount)) {
      return formFailure(`The client reported ${deposit.amount} ${deposit.asset}. Credit that or less, or reject it and ask them to report the real amount.`);
    }
    const { credited } = await creditDeposit({ provider: deposit.provider, providerRef: deposit.reference, depositId: parsed.data.id, amount: parsed.data.amount });
    if (!credited) return formFailure("This deposit was already credited.");
    await writeAudit(admin, "deposit.confirm", deposit.userId, `${parsed.data.amount} ${deposit.asset} via ${deposit.network || deposit.provider} (${deposit.reference})`);
  });
};

export const rejectClientDeposit = async (input) => {
  const parsed = depositRejectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const deposit = await rejectDeposit(parsed.data.id, { adminId: admin.id, reason: parsed.data.reason });
    await writeAudit(admin, "deposit.reject", deposit.userId, `${deposit.amount} ${deposit.asset} claimed: ${parsed.data.reason}`);
  });
};

export const approveClientWithdrawal = async (id) =>
  asAdmin(async (admin) => {
    const withdrawal = ObjectId.isValid(id) ? await collections.withdrawals().findOne({ _id: new ObjectId(id) }) : null;
    if (!withdrawal) return formFailure("Unknown withdrawal.");
    await approveWithdrawal(id, { adminId: admin.id });
    await writeAudit(admin, "withdrawal.approve", withdrawal.userId, `${withdrawal.amount} ${withdrawal.asset} to ${withdrawal.address}`);
  });

export const confirmWithdrawalSent = async (input) => {
  const parsed = withdrawalSentSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const withdrawal = await collections.withdrawals().findOne({ _id: new ObjectId(parsed.data.id) });
    if (!withdrawal) return formFailure("Unknown withdrawal.");
    const { sent } = await markWithdrawalSent(parsed.data.id, { providerRef: parsed.data.reference, adminId: admin.id });
    if (!sent) return formFailure("This withdrawal is not waiting for payout.");
    await writeAudit(admin, "withdrawal.sent", withdrawal.userId, `${withdrawal.amount} ${withdrawal.asset} to ${withdrawal.address} (${parsed.data.reference})`);
  });
};

export const rejectClientWithdrawal = async (input) => {
  const parsed = withdrawalRejectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const withdrawal = ObjectId.isValid(parsed.data.id) ? await collections.withdrawals().findOne({ _id: new ObjectId(parsed.data.id) }) : null;
    if (!withdrawal) return formFailure("Unknown withdrawal.");
    const { refunded } = await rejectWithdrawal(parsed.data.id, { adminId: admin.id, reason: parsed.data.reason });
    await writeAudit(admin, "withdrawal.reject", withdrawal.userId, `${refunded} ${withdrawal.asset} returned: ${parsed.data.reason}`);
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
    const [liveEntry, deposit, withdrawal] = await Promise.all([
      collections.ledger().findOne({ ...owned, mode: "live" }, { projection: { _id: 1 } }),
      collections.deposits().findOne(owned, { projection: { _id: 1 } }),
      collections.withdrawals().findOne(owned, { projection: { _id: 1 } }),
    ]);
    if (liveEntry || deposit || withdrawal) return formFailure("This client has live funding records, which must be kept. Ban the account instead.");
    const verification = await collections.verifications().findOne(owned);
    const documents = [verification?.documents?.front?.publicId, verification?.documents?.back?.publicId].filter(Boolean);
    await withTransaction(async (session) => {
      for (const collection of [collections.wallets(), collections.ledger(), collections.orders(), collections.positions(), collections.tickets(), collections.verifications(), collections.addresses(), collections.security(), collections.invites()]) {
        await collection.deleteMany(owned, { session });
      }
      await collections.invites().updateMany({ referrerId: parsed.data }, { $set: { referrerId: null } }, { session });
      await collections.positionCounters().deleteMany({ _id: { $in: [`${parsed.data}:practice`, `${parsed.data}:live`] } }, { session });
    });
    await getAuth().api.removeUser({ body: { userId: parsed.data }, headers: await headers() });
    await deletePrivateImages(documents).catch((error) => reportError(error, { job: "deleteKycFiles", userId: parsed.data }));
    await writeAudit(admin, "client.delete", user.email);
  });
};
