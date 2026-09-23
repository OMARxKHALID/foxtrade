import { collections, getMongoClient } from "@/lib/mongo";

const PRACTICE = "practice";

const LEGACY_WALLET_INDEX = "userId_1_wallet_1_asset_1";

const backfill = async (name, collection) => {
  const result = await collection.updateMany({ mode: { $exists: false } }, { $set: { mode: PRACTICE } });
  console.log(`${name}: tagged ${result.modifiedCount} document(s) as ${PRACTICE}`);
  return result.modifiedCount;
};

const dropLegacyWalletIndex = async () => {
  const indexes = await collections.wallets().indexes();
  if (!indexes.some((index) => index.name === LEGACY_WALLET_INDEX)) {
    console.log(`wallets: ${LEGACY_WALLET_INDEX} already gone`);
    return;
  }
  await collections.wallets().dropIndex(LEGACY_WALLET_INDEX);
  console.log(`wallets: dropped ${LEGACY_WALLET_INDEX}`);
};

// Slot counters are keyed "<userId>:<mode>" now. Left alone, the old rows would
// be orphaned and everyone with open positions would get a fresh set of slots.
const rekeyPositionCounters = async () => {
  const legacy = await collections.positionCounters().find({ _id: { $not: /:/ } }).toArray();
  for (const counter of legacy) {
    await collections.positionCounters().updateOne(
      { _id: `${counter._id}:practice` },
      { $setOnInsert: { count: counter.count ?? 0 } },
      { upsert: true },
    );
    await collections.positionCounters().deleteOne({ _id: counter._id });
  }
  console.log(`positionCounters: rekeyed ${legacy.length} counter(s)`);
};

const run = async () => {
  // Order matters: every row must carry a mode before the unique index starts
  // counting it, or one wallet splits into a legacy row and a practice row.
  await backfill("wallets", collections.wallets());
  await backfill("ledger", collections.ledger());
  await backfill("orders", collections.orders());
  await backfill("positions", collections.positions());

  const untagged = await collections.wallets().countDocuments({ mode: { $exists: false } });
  if (untagged) throw new Error(`${untagged} wallet(s) still have no mode; not touching the index`);

  await rekeyPositionCounters();
  await dropLegacyWalletIndex();
  await collections.wallets().createIndex({ userId: 1, wallet: 1, asset: 1, mode: 1 }, { unique: true });
  console.log("wallets: unique index now includes mode");
};

try {
  await run();
  console.log("Migration complete.");
} finally {
  await getMongoClient().close();
}
