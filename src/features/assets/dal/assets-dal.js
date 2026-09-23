import "server-only";
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { FAUCET_COOLDOWN_MS } from "@/lib/ledger-labels";
import { LedgerError, getBalance, getBalances, postEntries, withTransaction } from "@/lib/ledger";
import { fetchLatestPrices, fetchTickers } from "@/lib/market/binance-rest";
import { readPairs } from "@/lib/market/pair-store";
import { QUOTE, assetsOf } from "@/lib/market/pairs";
import { toAmount, toAmountString, toBig } from "@/lib/money";
import { collections } from "@/lib/mongo";
import { readPlatformSettings } from "@/lib/platform-settings";
import { verifyPin } from "@/lib/pin";
import { rateLimit, retryAfterText } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

const priceMap = async (assets, latest = false) => {
  const listed = new Set((await readPairs()).map((pair) => pair.symbol));
  const symbols = [...new Set(assets.map((asset) => `${asset}${QUOTE}`).filter((symbol) => listed.has(symbol)))];
  if (!symbols.length) return { USDT: "1" };
  const prices = latest
    ? await fetchLatestPrices(symbols)
    : Object.fromEntries((await fetchTickers(symbols)).map((ticker) => [ticker.symbol, String(ticker.price)]));
  return { USDT: "1", ...Object.fromEntries(Object.entries(prices).map(([symbol, price]) => [symbol.replace(/USDT$/, ""), price])) };
};

let securityIndexReady;

const ensureSecurityIndex = () => {
  securityIndexReady ??= collections.security().createIndex({ userId: 1 }, { unique: true });
  return securityIndexReady;
};

export const getAssetsOverview = async (userId) => {
  const balances = await getBalances(userId);
  let prices;
  let pricesStale = false;
  try {
    prices = await priceMap(balances.map((item) => item.asset));
  } catch {
    prices = { USDT: "1" };
    pricesStale = true;
  }
  const holdings = {};
  const walletTotals = { spot: toBig(0), timed: toBig(0), perpetual: toBig(0) };
  let total = toBig(0);
  for (const item of balances) {
    const value = item.balance.times(prices[item.asset] ?? 0);
    holdings[item.asset] ??= { total: toBig(0), byWallet: {} };
    holdings[item.asset].total = holdings[item.asset].total.plus(item.balance);
    holdings[item.asset].byWallet[item.wallet] = toAmountString(item.balance);
    walletTotals[item.wallet] = (walletTotals[item.wallet] ?? toBig(0)).plus(value);
    total = total.plus(value);
  }
  return {
    totalUsdt: toAmount(total),
    walletTotals: Object.fromEntries(Object.entries(walletTotals).map(([wallet, value]) => [wallet, toAmount(value)])),
    holdings: Object.fromEntries(Object.entries(holdings).map(([asset, item]) => [asset, { total: toAmountString(item.total), byWallet: item.byWallet }])),
    pricesStale,
  };
};

export const RECORDS_LIMIT = 500;

export const listRecords = async (userId, { asset, limit = RECORDS_LIMIT } = {}) => {
  const filter = asset ? { userId, asset } : { userId };
  const docs = await collections.ledger().find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    time: doc.createdAt.toISOString(),
    type: doc.type,
    wallet: doc.wallet,
    asset: doc.asset,
    amount: toAmountString(doc.amount),
    balanceAfter: toAmountString(doc.balanceAfter),
    note: doc.note,
  }));
};

const sumField = async (collection, filter, field, session) => {
  const [row] = await collection.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: `$${field}` } } }], { session }).toArray();
  return toBig(row?.total ?? 0);
};

const totalUsdt = async (userId, session) => {
  const balances = await getBalances(userId, session);
  const positionMargin = await sumField(collections.positions(), { userId, status: { $in: ["open", "pending"] } }, "margin", session);
  const timedStakes = await sumField(collections.orders(), { userId, status: "open" }, "amount", session);
  const wallets = balances.filter((item) => item.asset === "USDT").reduce((sum, item) => sum.plus(item.balance), toBig(0));
  return wallets.plus(positionMargin).plus(timedStakes);
};

export const getFaucetStatus = async (userId) => {
  const [total, security] = await Promise.all([totalUsdt(userId), collections.security().findOne({ userId })]);
  const nextClaim = security?.faucetClaimedAt ? security.faucetClaimedAt.getTime() + FAUCET_COOLDOWN_MS : 0;
  return { usdtTotal: toAmount(total), nextClaimAt: nextClaim > Date.now() ? new Date(nextClaim).toISOString() : null };
};

export const claimFaucet = async (userId) => {
  const { practiceAmount } = await readPlatformSettings();
  if ((await totalUsdt(userId)).gte(practiceAmount)) throw new LedgerError("Your wallets already hold the full practice amount of USDT.");
  await ensureSecurityIndex();
  const now = new Date();
  const cutoff = new Date(now.getTime() - FAUCET_COOLDOWN_MS);
  const lock = await collections
    .security()
    .findOneAndUpdate(
      { userId, $or: [{ faucetClaimedAt: { $exists: false } }, { faucetClaimedAt: { $lte: cutoff } }] },
      { $set: { faucetClaimedAt: now } },
      { upsert: true, returnDocument: "after" },
    )
    .catch((error) => (error?.code === 11000 ? null : Promise.reject(error)));
  if (!lock) {
    const current = await collections.security().findOne({ userId });
    const hours = Math.max(1, Math.ceil((current.faucetClaimedAt.getTime() + FAUCET_COOLDOWN_MS - now.getTime()) / 3600000));
    throw new LedgerError(`You can claim practice assets again in about ${hours}h.`);
  }
  await withTransaction(async (session) => {
    const topUp = toBig(practiceAmount).minus(await totalUsdt(userId, session));
    if (topUp.lte(0)) return;
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: topUp, note: "Practice top-up" }], session);
  });
};

export const convertAssets = async (userId, { from, to, amount }) => {
  const [prices, { convertSpread }] = await Promise.all([priceMap([from, to], true), readPlatformSettings()]);
  if (!prices[from] || !prices[to]) throw new LedgerError("Live price unavailable for this pair. Try again shortly.");
  const receive = toBig(amount).times(prices[from]).div(prices[to]).times(1 - convertSpread);
  if (toBig(toAmount(receive)).lte(0)) throw new LedgerError(`Amount is too small to convert into ${to}.`);
  const refId = randomUUID();
  await withTransaction((session) =>
    postEntries(
      [
        { userId, wallet: "spot", asset: from, type: "convert", amount: toBig(amount).times(-1), refId, note: `To ${to}` },
        { userId, wallet: "spot", asset: to, type: "convert", amount: receive, refId, note: `From ${from}` },
      ],
      session,
    ),
  );
};

export const transferAssets = async (userId, { from, to, asset, amount }) => {
  const refId = randomUUID();
  await withTransaction((session) =>
    postEntries(
      [
        { userId, wallet: from, asset, type: "transfer", amount: toBig(amount).times(-1), refId, note: `To ${to}` },
        { userId, wallet: to, asset, type: "transfer", amount, refId, note: `From ${from}` },
      ],
      session,
    ),
  );
};

export const checkWithdrawal = async (userId, { asset, amount, pin }) => {
  const limit = await rateLimit(`withdraw-pin:${userId}`, { limit: 5, windowSeconds: 900 });
  if (!limit.allowed) throw new LedgerError(`Too many PIN attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`);
  if (!(await verifyPin(userId, pin))) throw new LedgerError("Withdrawal PIN is incorrect or not set. Set it in Security first.");
  const spot = await getBalance(userId, "spot", asset);
  if (spot.lt(amount)) throw new LedgerError(`Insufficient ${asset} in your Spot Wallet.`);
  throw new LedgerError("Practice balances cannot be sent to external wallets. Your details were checked successfully.");
};

export const listAddresses = async (userId) => {
  const docs = await collections.addresses().find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => ({ id: doc._id.toString(), label: doc.label, asset: doc.asset, network: doc.network, address: doc.address, createdAt: doc.createdAt.toISOString() }));
};

export const saveAddress = async (userId, input) => {
  const limit = await rateLimit(`address-save:${userId}`, { limit: 30, windowSeconds: 3600 });
  if (!limit.allowed) throw new LedgerError(`You can save up to 30 addresses per hour. Try again in ${retryAfterText(limit.retryAfter)}.`);
  if (!assetsOf(await readPairs()).some((item) => item.symbol === input.asset)) throw new LedgerError("This asset is not supported.");
  const count = await collections.addresses().countDocuments({ userId });
  if (count >= 20) throw new LedgerError("You can save up to 20 addresses.");
  await collections.addresses().insertOne({ userId, ...input, createdAt: new Date() });
};

export const deleteAddress = async (userId, id) => {
  if (!ObjectId.isValid(id)) return;
  await collections.addresses().deleteOne({ _id: new ObjectId(id), userId });
};

export const loadAssetsPage = async ({ records = false, addresses = false, asset } = {}) => {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, overview: null, records: null, addresses: [] };
  const [overview, recordList, addressList] = await Promise.all([
    getAssetsOverview(user.id),
    records ? listRecords(user.id, { asset }) : null,
    addresses ? listAddresses(user.id) : [],
  ]);
  return { signedIn: true, overview, records: recordList, addresses: addressList };
};
