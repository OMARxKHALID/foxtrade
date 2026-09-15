import "server-only";
import { ObjectId } from "mongodb";
import { formFailure, serverFailure, signInRequired } from "@/lib/action-result";
import { toAmount } from "@/lib/money";
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
  return Object.fromEntries(rows.map((row) => [row._id, toAmount(row.total)]));
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
  const users = await collections.users().find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).limit(1000).toArray();
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
      createdAt: user.createdAt.toISOString(),
      banned: Boolean(user.banned),
      banReason: user.banReason ?? null,
      usdt: balances[id] ?? 0,
      kyc: kyc[id] ?? "none",
    };
  });
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
  }));
};

export const reviewVerification = async (id, decision, reason) => {
  if (!ObjectId.isValid(id)) return null;
  return collections.verifications().findOneAndUpdate(
    { _id: new ObjectId(id), status: "pending" },
    { $set: { status: decision, reason: decision === "rejected" ? reason : null, reviewedAt: new Date() } },
    { returnDocument: "after" },
  );
};

export const listAudit = async () => {
  await requireAdmin();
  return (await collections.audit().find().sort({ createdAt: -1 }).limit(1000).toArray()).map(toAuditDTO);
};
