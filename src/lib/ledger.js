import "server-only";
import { collections, getMongoClient } from "@/lib/mongo";
import { toBig, toDecimal } from "@/lib/money";
import { walletLabelFor } from "@/lib/ledger-labels";

export class LedgerError extends Error {
  name = "LedgerError";
}

export const PRACTICE = "practice";
export const LIVE = "live";

// Practice and live funds are separate ledgers that must never mix, so mode is
// part of the wallet identity rather than a flag on it.
export const isMode = (value) => value === PRACTICE || value === LIVE;

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    collections.wallets().createIndex({ userId: 1, wallet: 1, asset: 1, mode: 1 }, { unique: true }),
    collections.ledger().createIndex({ userId: 1, mode: 1, createdAt: -1 }),
    collections.ledger().createIndex({ type: 1, createdAt: -1 }),
  ]);
  return indexesReady;
};

export const withTransaction = async (work) => {
  await ensureIndexes();
  const session = getMongoClient().startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const postEntries = async (entries, session) => {
  const now = new Date();
  for (const entry of entries) {
    const amount = toBig(entry.amount);
    if (amount.eq(0)) continue;
    const mode = entry.mode ?? PRACTICE;
    if (!isMode(mode)) throw new LedgerError("Unknown wallet mode.");
    const filter = { userId: entry.userId, wallet: entry.wallet, asset: entry.asset, mode };
    if (amount.lt(0)) filter.balance = { $gte: toDecimal(amount.abs()) };
    const wallet = await collections.wallets().findOneAndUpdate(
      filter,
      { $inc: { balance: toDecimal(amount) }, $set: { updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: amount.gt(0), returnDocument: "after", session },
    );
    if (!wallet) throw new LedgerError(`Insufficient ${entry.asset} in your ${walletLabelFor(entry.wallet)}.`);
    await collections.ledger().insertOne(
      {
        userId: entry.userId,
        wallet: entry.wallet,
        asset: entry.asset,
        mode,
        type: entry.type,
        amount: toDecimal(amount),
        balanceAfter: wallet.balance,
        refId: entry.refId ?? null,
        note: entry.note ?? null,
        createdAt: now,
      },
      { session },
    );
  }
};

export const getBalances = async (userId, session, mode = PRACTICE) => {
  const docs = await collections.wallets().find({ userId, mode }, { session }).toArray();
  return docs.map((doc) => ({ wallet: doc.wallet, asset: doc.asset, mode: doc.mode, balance: toBig(doc.balance) }));
};

export const getBalance = async (userId, wallet, asset, session, mode = PRACTICE) => {
  const doc = await collections.wallets().findOne({ userId, wallet, asset, mode }, { session });
  return toBig(doc?.balance ?? 0);
};
