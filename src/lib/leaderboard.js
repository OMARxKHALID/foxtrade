import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongo";

const DAY = 24 * 60 * 60 * 1000;
const MIN_TRADES = 5;

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain ?? ""}`;
};

export const getLeaderboard = async () => {
  "use cache";
  cacheTag("leaderboard");
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  if (!process.env.MONGODB_URI) return [];
  const since = new Date(Date.now() - 30 * DAY);
  const [timed, positions] = await Promise.all([
    collections.orders().aggregate([
      { $match: { status: { $in: ["won", "lost", "draw"] }, settledAt: { $gte: since } } },
      { $group: { _id: "$userId", trades: { $sum: 1 }, wins: { $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] } }, staked: { $sum: "$amount" }, pnl: { $sum: { $subtract: [{ $ifNull: ["$payout", 0] }, "$amount"] } } } },
    ]).toArray(),
    collections.positions().aggregate([
      { $match: { status: { $in: ["closed", "liquidated"] }, closedAt: { $gte: since } } },
      { $group: { _id: "$userId", trades: { $sum: 1 }, wins: { $sum: { $cond: [{ $gt: ["$pnl", 0] }, 1, 0] } }, staked: { $sum: "$margin" }, pnl: { $sum: { $ifNull: ["$pnl", 0] } } } },
    ]).toArray(),
  ]);
  const totals = {};
  [...timed, ...positions].forEach((row) => {
    const current = (totals[row._id] ??= { trades: 0, wins: 0, staked: 0, pnl: 0 });
    current.trades += row.trades;
    current.wins += row.wins;
    current.staked += row.staked;
    current.pnl += row.pnl;
  });
  const active = Object.entries(totals).filter(([, stats]) => stats.trades >= MIN_TRADES && stats.staked > 0);
  if (!active.length) return [];
  const verified = new Set(
    await collections.verifications().distinct("userId", { userId: { $in: active.map(([id]) => id) }, status: "approved" }),
  );
  const qualified = active.filter(([id]) => verified.has(id) && ObjectId.isValid(id));
  if (!qualified.length) return [];
  const users = await collections
    .users()
    .find({ _id: { $in: qualified.map(([id]) => new ObjectId(id)) }, role: { $ne: "admin" }, banned: { $ne: true } }, { projection: { email: 1 } })
    .toArray();
  const emails = Object.fromEntries(users.map((user) => [user._id.toString(), user.email]));
  return qualified
    .filter(([id]) => emails[id])
    .map(([id, stats]) => ({
      id,
      trader: maskEmail(emails[id]),
      trades: stats.trades,
      winRate: Math.round((stats.wins / stats.trades) * 100),
      pnl: stats.pnl,
      roi: (stats.pnl / stats.staked) * 100,
    }))
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 50)
    .map((row, index) => ({ ...row, rank: index + 1 }));
};
