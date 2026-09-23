import "server-only";
import { ObjectId } from "mongodb";
import { LIVE, LedgerError, getBalance, postEntries, withTransaction } from "@/lib/ledger";
import { toAmount, toBig } from "@/lib/money";
import { collections } from "@/lib/mongo";

// Funds leaving spot sit here between the user asking and the payout actually
// leaving, so the same balance cannot be requested twice.
export const HOLD_WALLET = "withdrawal_hold";

const MIN_WITHDRAWAL = 10;

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    // The provider decides what a payment is called; this is what stops a
    // retried webhook from crediting the same money twice. Partial, because a
    // deposit has no reference until it is credited and every pending one would
    // otherwise collide on null.
    collections
      .deposits()
      .createIndex({ provider: 1, providerRef: 1 }, { unique: true, partialFilterExpression: { providerRef: { $type: "string" } } }),
    collections.deposits().createIndex({ userId: 1, createdAt: -1 }),
    collections.deposits().createIndex({ status: 1, createdAt: 1 }),
    collections.withdrawals().createIndex({ userId: 1, createdAt: -1 }),
    collections.withdrawals().createIndex({ status: 1, createdAt: 1 }),
  ]);
  return indexesReady;
};

const requireLive = (mode) => {
  if (mode !== LIVE) throw new LedgerError("Only live accounts move real funds.");
};

export const isVerified = async (userId) => {
  const verification = await collections.verifications().findOne({ userId }, { projection: { status: 1 } });
  return verification?.status === "approved";
};

export const requireVerified = async (userId) => {
  if (!(await isVerified(userId))) throw new LedgerError("Verify your identity before moving real funds.");
};

export const createDepositIntent = async (userId, { asset, amount, provider, network = "", reference = "" }, mode = LIVE) => {
  await ensureIndexes();
  requireLive(mode);
  await requireVerified(userId);
  if (toBig(amount).lte(0)) throw new LedgerError("Enter an amount above zero.");
  // The amount here is only what the client claims to have sent. Nothing is
  // credited until an admin or a provider webhook confirms the real figure.
  if (reference && (await collections.deposits().findOne({ reference, status: { $ne: "rejected" } }))) {
    throw new LedgerError("That transaction has already been submitted.");
  }
  const doc = {
    userId,
    mode,
    asset,
    amount: toAmount(amount),
    provider,
    network,
    reference,
    providerRef: null,
    status: "pending",
    createdAt: new Date(),
    creditedAt: null,
  };
  const { insertedId } = await collections.deposits().insertOne(doc);
  return insertedId.toString();
};

export const rejectDeposit = async (depositId, { adminId, reason }) => {
  const _id = ObjectId.isValid(depositId) ? new ObjectId(depositId) : null;
  const claimed = await collections
    .deposits()
    .findOneAndUpdate({ _id, status: "pending" }, { $set: { status: "rejected", reason, reviewedBy: adminId, reviewedAt: new Date() } }, { returnDocument: "after" });
  if (!claimed) throw new LedgerError("This deposit was already reviewed.");
  return claimed;
};

export const listDeposits = async (userId, mode = LIVE) =>
  collections.deposits().find({ userId, mode }).sort({ createdAt: -1 }).limit(20).toArray();

// Only ever called from a verified provider webhook. Never from user input, and
// never trusting an amount the client supplied.
export const creditDeposit = async ({ provider, providerRef, depositId, amount }) => {
  await ensureIndexes();
  if (!provider || !providerRef) throw new LedgerError("A deposit needs a provider reference.");
  const _id = ObjectId.isValid(depositId) ? new ObjectId(depositId) : null;
  if (!_id) throw new LedgerError("Unknown deposit.");

  return withTransaction(async (session) => {
    const claimed = await collections
      .deposits()
      .findOneAndUpdate(
        { _id, status: "pending" },
        { $set: { status: "credited", providerRef, amount: toAmount(amount), creditedAt: new Date() } },
        { returnDocument: "after", session },
      );
    // Already credited, or never existed. Either way the caller should not
    // retry into a second credit.
    if (!claimed) return { credited: false };
    await postEntries(
      [
        {
          userId: claimed.userId,
          mode: claimed.mode,
          wallet: "spot",
          asset: claimed.asset,
          type: "deposit",
          amount: toAmount(amount),
          refId: claimed._id.toString(),
          note: `${provider} ${providerRef}`,
        },
      ],
      session,
    );
    return { credited: true, userId: claimed.userId, amount: toAmount(amount) };
  });
};

export const requestWithdrawal = async (userId, { asset, amount, address, network }, mode = LIVE) => {
  await ensureIndexes();
  requireLive(mode);
  await requireVerified(userId);
  if (toBig(amount).lt(MIN_WITHDRAWAL)) throw new LedgerError(`The smallest withdrawal is ${MIN_WITHDRAWAL} ${asset}.`);
  const available = await getBalance(userId, "spot", asset, null, mode);
  if (available.lt(amount)) throw new LedgerError(`Insufficient ${asset} in your Spot Wallet.`);

  return withTransaction(async (session) => {
    const withdrawalId = new ObjectId();
    // Hold first: if this debit fails there is nothing to review.
    await postEntries(
      [
        { userId, mode, wallet: "spot", asset, type: "withdraw_hold", amount: toBig(amount).times(-1), refId: withdrawalId.toString(), note: "Withdrawal requested" },
        { userId, mode, wallet: HOLD_WALLET, asset, type: "withdraw_hold", amount: toAmount(amount), refId: withdrawalId.toString(), note: "Awaiting review" },
      ],
      session,
    );
    await collections.withdrawals().insertOne(
      {
        _id: withdrawalId,
        userId,
        mode,
        asset,
        amount: toAmount(amount),
        address,
        network,
        status: "requested",
        reviewedBy: null,
        reason: null,
        createdAt: new Date(),
        reviewedAt: null,
        sentAt: null,
      },
      { session },
    );
    return withdrawalId.toString();
  });
};

const claimForReview = async (withdrawalId, session) => {
  const _id = ObjectId.isValid(withdrawalId) ? new ObjectId(withdrawalId) : null;
  if (!_id) throw new LedgerError("Unknown withdrawal.");
  const claimed = await collections.withdrawals().findOne({ _id, status: "requested" }, { session });
  if (!claimed) throw new LedgerError("This withdrawal was already reviewed.");
  return claimed;
};

export const rejectWithdrawal = async (withdrawalId, { adminId, reason }) =>
  withTransaction(async (session) => {
    const withdrawal = await claimForReview(withdrawalId, session);
    await collections
      .withdrawals()
      .updateOne({ _id: withdrawal._id, status: "requested" }, { $set: { status: "rejected", reason, reviewedBy: adminId, reviewedAt: new Date() } }, { session });
    await postEntries(
      [
        { userId: withdrawal.userId, mode: withdrawal.mode, wallet: HOLD_WALLET, asset: withdrawal.asset, type: "withdraw_refund", amount: toBig(withdrawal.amount).times(-1), refId: withdrawal._id.toString(), note: "Withdrawal rejected" },
        { userId: withdrawal.userId, mode: withdrawal.mode, wallet: "spot", asset: withdrawal.asset, type: "withdraw_refund", amount: withdrawal.amount, refId: withdrawal._id.toString(), note: reason ?? "Withdrawal rejected" },
      ],
      session,
    );
    return { refunded: withdrawal.amount };
  });

// Approval only clears it for payout. The money leaves in markWithdrawalSent,
// once the provider confirms, so a failed payout can still be refunded.
export const approveWithdrawal = async (withdrawalId, { adminId }) =>
  withTransaction(async (session) => {
    const withdrawal = await claimForReview(withdrawalId, session);
    await collections
      .withdrawals()
      .updateOne({ _id: withdrawal._id, status: "requested" }, { $set: { status: "approved", reviewedBy: adminId, reviewedAt: new Date() } }, { session });
    return { approved: true };
  });

export const markWithdrawalSent = async (withdrawalId, { providerRef }) =>
  withTransaction(async (session) => {
    const _id = ObjectId.isValid(withdrawalId) ? new ObjectId(withdrawalId) : null;
    const claimed = await collections
      .withdrawals()
      .findOneAndUpdate({ _id, status: "approved" }, { $set: { status: "sent", providerRef, sentAt: new Date() } }, { returnDocument: "after", session });
    if (!claimed) return { sent: false };
    await postEntries(
      [
        {
          userId: claimed.userId,
          mode: claimed.mode,
          wallet: HOLD_WALLET,
          asset: claimed.asset,
          type: "withdraw_sent",
          amount: toBig(claimed.amount).times(-1),
          refId: claimed._id.toString(),
          note: `Sent ${providerRef ?? ""}`.trim(),
        },
      ],
      session,
    );
    return { sent: true };
  });
