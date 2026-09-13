import { collections, getMongoClient } from "@/lib/mongo";
import { toBig, toDecimal } from "@/lib/money";
import { walletLabels } from "@/lib/demo";

export class LedgerError extends Error {
  name = "LedgerError";
}

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    collections.wallets().createIndex({ userId: 1, wallet: 1, asset: 1 }, { unique: true }),
    collections.ledger().createIndex({ userId: 1, createdAt: -1 }),
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
    const filter = { userId: entry.userId, wallet: entry.wallet, asset: entry.asset };
    if (amount.lt(0)) filter.balance = { $gte: toDecimal(amount.abs()) };
    const wallet = await collections.wallets().findOneAndUpdate(
      filter,
      { $inc: { balance: toDecimal(amount) }, $set: { updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: amount.gt(0), returnDocument: "after", session },
    );
    if (!wallet) throw new LedgerError(`Insufficient ${entry.asset} in your ${walletLabels[entry.wallet] ?? entry.wallet}.`);
    await collections.ledger().insertOne(
      {
        userId: entry.userId,
        wallet: entry.wallet,
        asset: entry.asset,
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

export const getBalances = async (userId, session) => {
  const docs = await collections.wallets().find({ userId }, { session }).toArray();
  return docs.map((doc) => ({ wallet: doc.wallet, asset: doc.asset, balance: toBig(doc.balance) }));
};

export const getBalance = async (userId, wallet, asset, session) => {
  const doc = await collections.wallets().findOne({ userId, wallet, asset }, { session });
  return toBig(doc?.balance ?? 0);
};
