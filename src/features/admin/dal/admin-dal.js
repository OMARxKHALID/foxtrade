import "server-only";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { formFailure, signInRequired } from "@/lib/action-result";
import { serverFailure } from "@/lib/server-result";
import { getAuth } from "@/lib/auth";
import { getBalances } from "@/lib/ledger";
import { toAmountString } from "@/lib/money";
import { listUserTickets } from "@/lib/ticket-store";
import { listRecords } from "@/features/assets/dal/assets-dal";
import { getTradingSummary } from "@/features/trading/dal/trading-engine";
import { collections } from "@/lib/mongo";
import { getCurrentUser, isAdmin, requireAdmin } from "@/lib/session";

const DAY = 24 * 60 * 60 * 1000;

export const asAdmin = async (work) => {
  const admin = await getCurrentUser().catch(() => null);
  if (!admin) return signInRequired();
  if (!isAdmin(admin)) return formFailure("Only the admin can do this.");
  try {
    return (await work(admin)) ?? { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const writeAudit = async (admin, action, target, detail = null) => {
  await collections.audit().insertOne({ adminId: admin.id, adminEmail: admin.email, action, target, detail, createdAt: new Date() });
};

const usdtByUser = async (userIds) => {
  const rows = await collections
    .wallets()
    .aggregate([{ $match: { userId: { $in: userIds }, asset: "USDT" } }, { $group: { _id: "$userId", total: { $sum: "$balance" } } }])
    .toArray();
  return Object.fromEntries(rows.map((row) => [row._id, toAmountString(row.total)]));
};

export const getDashboardStats = async () => {
  await requireAdmin();
  const now = new Date();
  const [clients, newClients, activeSessions, pendingKyc, openTickets, openPositions, tradesToday, recentClients, recentAudit] = await Promise.all([
    collections.users().countDocuments({ role: { $ne: "admin" } }),
    collections.users().countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: new Date(now - 7 * DAY) } }),
    collections.sessions().countDocuments({ expiresAt: { $gt: now } }),
    collections.verifications().countDocuments({ status: "pending" }),
    collections.tickets().countDocuments({ status: { $in: ["open", "answered"] } }),
    collections.positions().countDocuments({ status: "open" }),
    collections.ledger().countDocuments({ type: { $in: ["timed_stake", "perp_margin"] }, createdAt: { $gte: new Date(now - DAY) } }),
    collections.users().find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).limit(5).toArray(),
    collections.audit().find().sort({ createdAt: -1 }).limit(6).toArray(),
  ]);
  return {
    clients,
    newClients,
    activeSessions,
    pendingKyc,
    openTickets,
    openPositions,
    tradesToday,
    recentClients: recentClients.map((user) => ({ id: user._id.toString(), email: user.email, createdAt: user.createdAt.toISOString() })),
    recentAudit: recentAudit.map(toAuditDTO),
  };
};

const toAuditDTO = (doc) => ({
  id: doc._id.toString(),
  adminEmail: doc.adminEmail,
  action: doc.action,
  target: doc.target,
  detail: doc.detail,
  createdAt: doc.createdAt.toISOString(),
});

export const listClients = async () => {
  await requireAdmin();
  const users = await collections.users().find().sort({ createdAt: -1 }).limit(1000).toArray();
  const ids = users.map((user) => user._id.toString());
  const [balances, verifications] = await Promise.all([
    usdtByUser(ids),
    collections.verifications().find({ userId: { $in: ids } }, { projection: { userId: 1, status: 1 } }).toArray(),
  ]);
  const kyc = Object.fromEntries(verifications.map((item) => [item.userId, item.status]));
  return users.map((user) => {
    const id = user._id.toString();
    return {
      id,
      email: user.email,
      name: user.name ?? "",
      role: user.role === "admin" ? "admin" : "user",
      createdAt: user.createdAt.toISOString(),
      banned: Boolean(user.banned),
      banReason: user.banReason ?? null,
      forceWin: Boolean(user.forceWin),
      usdt: balances[id] ?? 0,
      kyc: kyc[id] ?? "none",
    };
  });
};

export const findUser = async (userId) => {
  if (!ObjectId.isValid(userId)) return null;
  return collections.users().findOne({ _id: new ObjectId(userId) });
};

export const getClientDetail = async (userId) => {
  await requireAdmin();
  const user = await findUser(userId);
  if (!user) return null;
  const id = user._id.toString();
  const [balances, trading, records, tickets, verification, sessions] = await Promise.all([
    Promise.all([getBalances(id, null, "practice"), getBalances(id, null, "live")]).then(([practice, live]) => [...practice, ...live]),
    getTradingSummary(id),
    listRecords(id, { limit: 100 }),
    listUserTickets(id),
    collections.verifications().findOne({ userId: id }),
    getAuth()
      .api.listUserSessions({ body: { userId: id }, headers: await headers() })
      .then((result) => result.sessions ?? [])
      .catch(() => []),
  ]);
  return {
    user: {
      id,
      email: user.email,
      name: user.name ?? "",
      role: user.role === "admin" ? "admin" : "user",
      banned: Boolean(user.banned),
      banReason: user.banReason ?? null,
      forceWin: Boolean(user.forceWin),
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt.toISOString(),
    },
    balances: balances.filter((item) => !item.balance.eq(0)).map((item) => ({ wallet: item.wallet, asset: item.asset, mode: item.mode, balance: toAmountString(item.balance) })),
    trading,
    records,
    tickets,
    verification: verification
      ? {
          id: verification._id.toString(),
          status: verification.status,
          fullName: verification.fullName,
          country: verification.country,
          city: verification.city,
          idNumber: `•••• ${String(verification.idNumber).slice(-4)}`,
          reason: verification.reason ?? null,
          documentsStatus: verification.documents?.status ?? "none",
          submittedAt: verification.submittedAt.toISOString(),
        }
      : null,
    sessions: sessions.map((session) => ({
      id: String(session.id),
      userAgent: session.userAgent ?? "",
      ipAddress: session.ipAddress ?? "",
      createdAt: new Date(session.createdAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
    })),
  };
};

export const findClient = async (userId) => {
  if (!ObjectId.isValid(userId)) return null;
  return collections.users().findOne({ _id: new ObjectId(userId), role: { $ne: "admin" } });
};

export const listVerifications = async () => {
  await requireAdmin();
  const docs = await collections.verifications().find().sort({ submittedAt: -1 }).limit(500).toArray();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    userId: doc.userId,
    email: doc.email,
    fullName: doc.fullName,
    country: doc.country,
    city: doc.city,
    idNumber: `•••• ${String(doc.idNumber).slice(-4)}`,
    status: doc.status,
    reason: doc.reason,
    submittedAt: doc.submittedAt.toISOString(),
    documents: {
      status: doc.documents?.status ?? "none",
      reason: doc.documents?.reason ?? null,
      hasFront: Boolean(doc.documents?.front),
      hasBack: Boolean(doc.documents?.back),
      formats: { front: doc.documents?.front?.format ?? null, back: doc.documents?.back?.format ?? null },
      combined: Boolean(doc.documents?.front && doc.documents.front.publicId === doc.documents?.back?.publicId),
      submittedAt: doc.documents?.submittedAt?.toISOString() ?? null,
    },
  }));
};

export const reviewVerificationDocuments = async (id, decision, reason) => {
  if (!ObjectId.isValid(id)) return null;
  const filter = { _id: new ObjectId(id), "documents.status": { $in: decision === "approved" ? ["pending", "rejected"] : ["pending", "approved"] }, "documents.front": { $exists: true }, "documents.back": { $exists: true } };
  const update =
    decision === "approved"
      ? { $set: { "documents.status": "approved", "documents.reason": null, "documents.reviewedAt": new Date() } }
      : { $set: { "documents.status": "rejected", "documents.reason": reason, "documents.reviewedAt": new Date() } };
  return collections.verifications().findOneAndUpdate(filter, update, { returnDocument: "before" });
};

export const reviewVerification = async (id, decision, reason) => {
  if (!ObjectId.isValid(id)) return null;
  return collections.verifications().findOneAndUpdate(
    { _id: new ObjectId(id), status: { $ne: decision } },
    { $set: { status: decision, reason: decision === "rejected" ? reason : null, reviewedAt: new Date() } },
    { returnDocument: "after" },
  );
};

export const listPendingApprovals = async () => {
  const admin = await requireAdmin();
  const [withdrawals, adjustments, deposits] = await Promise.all([
    collections.withdrawals().find({ status: { $in: ["requested", "approved"] } }).sort({ createdAt: 1 }).limit(200).toArray(),
    collections.adjustments().find({ status: "pending" }).sort({ createdAt: 1 }).limit(200).toArray(),
    collections.deposits().find({ status: "pending" }).sort({ createdAt: 1 }).limit(200).toArray(),
  ]);
  const userIds = [...withdrawals, ...deposits].map((item) => (ObjectId.isValid(item.userId) ? new ObjectId(item.userId) : null)).filter(Boolean);
  const emails = await collections.users().find({ _id: { $in: userIds } }, { projection: { email: 1 } }).toArray();
  const emailById = Object.fromEntries(emails.map((user) => [user._id.toString(), user.email]));

  return {
    deposits: deposits.map((doc) => ({
      id: doc._id.toString(),
      email: emailById[doc.userId] ?? doc.userId,
      asset: doc.asset,
      amount: doc.amount,
      network: doc.network ?? "",
      reference: doc.reference ?? "",
      createdAt: doc.createdAt.toISOString(),
    })),
    withdrawals: withdrawals.map((doc) => ({
      id: doc._id.toString(),
      email: emailById[doc.userId] ?? doc.userId,
      asset: doc.asset,
      amount: doc.amount,
      address: doc.address,
      network: doc.network ?? "",
      status: doc.status,
      approvedByYou: doc.status === "approved" && doc.reviewedBy === admin.id,
      createdAt: doc.createdAt.toISOString(),
    })),
    adjustments: adjustments.map((doc) => ({
      id: doc._id.toString(),
      email: doc.targetEmail,
      requestedBy: doc.requestedByEmail,
      wallet: doc.wallet,
      asset: doc.asset,
      amount: doc.amount,
      note: doc.note,
      createdAt: doc.createdAt.toISOString(),
    })),
  };
};

export const listAudit = async () => {
  await requireAdmin();
  return (await collections.audit().find().sort({ createdAt: -1 }).limit(1000).toArray()).map(toAuditDTO);
};
