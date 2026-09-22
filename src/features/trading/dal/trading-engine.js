import "server-only";
import { ObjectId } from "mongodb";
import { LedgerError, getBalance, postEntries, withTransaction } from "@/lib/ledger";
import { fetchKlineRange, fetchLatestPrices } from "@/lib/market/binance-rest";
import { forcedClosePrice, forcedExitPrice, invalidateOverlay, positionWindow, transformCandlesForWindow } from "@/lib/market/overlay";
import { readPairs } from "@/lib/market/pair-store";
import { findPair } from "@/lib/market/pairs";
import { toAmount, toAmountString, toBig } from "@/lib/money";
import { collections } from "@/lib/mongo";
import { defaultPlatformSettings, readPlatformSettings } from "@/lib/platform-settings";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const SETTLE_DELAY = 1500;
const SETTLE_FALLBACK_MS = 5 * MINUTE;
const SETTLE_DEBOUNCE_MS = 2000;
const CHECK_OVERLAP_MS = 2 * SECOND;
const SETTLE_BATCH_SIZE = 10;
const MAX_ACTIVE_POSITIONS = 50;

const inBatches = async (items, run, onRejected) => {
  for (let index = 0; index < items.length; index += SETTLE_BATCH_SIZE) {
    const results = await Promise.allSettled(items.slice(index, index + SETTLE_BATCH_SIZE).map(run));
    results.forEach((result) => {
      if (result.status === "rejected") onRejected(result.reason);
    });
  }
};

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    collections.orders().createIndex({ userId: 1, status: 1, expiresAt: 1 }),
    collections.orders().createIndex({ status: 1, expiresAt: 1 }),
    collections.positions().createIndex({ userId: 1, status: 1 }),
    collections.positions().createIndex({ status: 1 }),
  ]);
  return indexesReady;
};

const latestPrice = async (symbol) => {
  const prices = await fetchLatestPrices([symbol]);
  const price = Number(prices[symbol]);
  if (!Number.isFinite(price) || price <= 0) throw new LedgerError("Live price unavailable. Try again in a moment.");
  return price;
};

const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

const forcedWinFor = async (userId) => {
  const user = toObjectId(userId) ? await collections.users().findOne({ _id: toObjectId(userId) }, { projection: { forceWin: 1 } }) : null;
  return Boolean(user?.forceWin);
};

const claimActiveSlot = async (userId, session) => {
  await collections.positionCounters().updateOne({ _id: userId }, { $setOnInsert: { count: 0 } }, { upsert: true, session });
  const claimed = await collections.positionCounters().findOneAndUpdate(
    { _id: userId, $expr: { $lt: ["$count", MAX_ACTIVE_POSITIONS] } },
    { $inc: { count: 1 } },
    { session },
  );
  if (!claimed) throw new LedgerError(`You can have up to ${MAX_ACTIVE_POSITIONS} open positions and pending orders. Close or cancel some first.`);
};

const releaseActiveSlot = async (userId, session) => {
  await collections.positionCounters().updateOne({ _id: userId }, { $inc: { count: -1 } }, { session });
};

const liquidationPrice = ({ side, entryPrice, size, margin, maintenanceMarginRate = defaultPlatformSettings.maintenanceMarginRate }) => {
  const notional = toBig(entryPrice).times(size);
  const buffer = toBig(margin).minus(toBig(maintenanceMarginRate).times(notional)).div(size);
  const price = side === "long" ? toBig(entryPrice).minus(buffer) : toBig(entryPrice).plus(buffer);
  return toAmount(price.lt(0) ? toBig(0) : price);
};

const pnlAt = ({ side, entryPrice, size }, price) => {
  const difference = side === "long" ? toBig(price).minus(entryPrice) : toBig(entryPrice).minus(price);
  return difference.times(size);
};

export const placeTimedOrder = async (userId, { symbol, direction, duration, amount }) => {
  await ensureIndexes();
  const [pairs, settings] = await Promise.all([readPairs(), readPlatformSettings()]);
  const pair = findPair(pairs, symbol);
  const rule = settings.timedDurations.find((item) => item.seconds === duration);
  if (!pair || !rule) throw new LedgerError("This market is not available.");
  if (!pair.timedEnabled) throw new LedgerError(`Options trading on ${pair.base}/USDT is paused.`);
  if (amount < rule.minAmount) throw new LedgerError(`Minimum stake for ${duration}s is ${rule.minAmount} USDT.`);
  const forcedWin = await forcedWinFor(userId);
  const openPrice = await latestPrice(pair.symbol);
  const openedAt = new Date();
  const orderId = new ObjectId();
  await withTransaction(async (session) => {
    await postEntries([{ userId, wallet: "timed", asset: "USDT", type: "timed_stake", amount: -amount, refId: orderId.toString(), note: `${pair.base}/USDT ${direction}` }], session);
    await collections.orders().insertOne(
      {
        _id: orderId,
        userId,
        symbol: pair.symbol,
        direction,
        duration,
        amount,
        payoutRate: rule.payoutRate,
        openPrice,
        openedAt,
        expiresAt: new Date(openedAt.getTime() + duration * SECOND),
        forcedWin,
        status: "open",
      },
      { session },
    );
  });
  invalidateOverlay(userId);
  return orderId.toString();
};

const settleTimedOrder = async (order) => {
  if (order.forcedWin) {
    const closePrice = await forcedClosePrice(order);
    const status = "won";
    const payout = toAmount(toBig(order.amount).times(1 + order.payoutRate));
    await withTransaction(async (session) => {
      const claimed = await collections
        .orders()
        .findOneAndUpdate({ _id: order._id, status: "open" }, { $set: { status, closePrice, payout, settledAt: new Date() } }, { session });
      if (!claimed || !payout) return;
      await postEntries([{ userId: order.userId, wallet: "timed", asset: "USDT", type: "timed_payout", amount: payout, refId: order._id.toString(), note: "Payout" }], session);
    });
    invalidateOverlay(order.userId);
    return;
  }
  const expiry = order.expiresAt.getTime();
  const secondStart = Math.floor(expiry / SECOND) * SECOND;
  const [kline] = await fetchKlineRange({ symbol: order.symbol, interval: "1s", startTime: secondStart, limit: 1 });
  const fallbackDue = Date.now() >= expiry + SETTLE_FALLBACK_MS;
  const exact = Boolean(kline && kline.openTime === secondStart);
  if (!kline && !fallbackDue) return;
  if (!exact && !fallbackDue) return;
  if (!exact) console.error(`Timed settlement fallback for order ${order._id.toString()} (${order.symbol}): using ${kline ? `1s kline from ${new Date(kline.openTime).toISOString()}` : "latest market price"} instead of the exact close at ${new Date(secondStart).toISOString()}.`);
  const closePrice = kline ? kline.close : await latestPrice(order.symbol);
  const won = order.direction === "call" ? closePrice > order.openPrice : closePrice < order.openPrice;
  const draw = closePrice === order.openPrice;
  const status = draw ? "draw" : won ? "won" : "lost";
  const payout = draw ? order.amount : won ? toAmount(toBig(order.amount).times(1 + order.payoutRate)) : 0;
  await withTransaction(async (session) => {
    const claimed = await collections
      .orders()
      .findOneAndUpdate({ _id: order._id, status: "open" }, { $set: { status, closePrice, payout, settledAt: new Date() } }, { session });
    if (!claimed || !payout) return;
    await postEntries([{ userId: order.userId, wallet: "timed", asset: "USDT", type: "timed_payout", amount: payout, refId: order._id.toString(), note: status === "draw" ? "Refund" : "Payout" }], session);
  });
};

export const placePerpetualOrder = async (userId, { symbol, side, type, price, amount, leverage, takeProfit, stopLoss }) => {
  await ensureIndexes();
  const [pairs, settings] = await Promise.all([readPairs(), readPlatformSettings()]);
  const pair = findPair(pairs, symbol);
  if (!pair) throw new LedgerError("This market is not available.");
  if (!pair.perpetualEnabled) throw new LedgerError(`Futures trading on ${pair.base}/USDT is paused.`);
  const maxLeverage = Math.min(pair.maxLeverage, settings.maxLeverage);
  if (leverage > maxLeverage) throw new LedgerError(`Maximum leverage for ${pair.base}/USDT is ${maxLeverage}x.`);
  if (leverage * settings.maintenanceMarginRate >= 1) throw new LedgerError(`Leverage must be below ${Math.ceil(1 / settings.maintenanceMarginRate)}x at the current maintenance margin.`);
  const active = await collections.positions().countDocuments({ userId, status: { $in: ["open", "pending"] } });
  if (active >= MAX_ACTIVE_POSITIONS) throw new LedgerError(`You can have up to ${MAX_ACTIVE_POSITIONS} open positions and pending orders. Close or cancel some first.`);
  const market = await latestPrice(pair.symbol);
  if (type === "limit" && (side === "long" ? price >= market : price <= market)) {
    throw new LedgerError(`A ${side} limit price must be ${side === "long" ? "below" : "above"} the market price. Use a market order to fill now.`);
  }
  const entryPrice = type === "limit" ? price : market;
  const notional = toBig(amount).times(leverage);
  const size = toAmount(notional.div(entryPrice));
  const openFee = toAmount(notional.times(settings.takerFeeRate));
  const tp = takeProfit || null;
  const sl = stopLoss || null;
  if (side === "long" && ((tp && tp <= entryPrice) || (sl && sl >= entryPrice))) throw new LedgerError("For a long, take profit must be above and stop loss below the entry price.");
  if (side === "short" && ((tp && tp >= entryPrice) || (sl && sl <= entryPrice))) throw new LedgerError("For a short, take profit must be below and stop loss above the entry price.");
  const forcedWin = await forcedWinFor(userId);
  const now = new Date();
  const positionId = new ObjectId();
  const position = {
    _id: positionId,
    userId,
    symbol: pair.symbol,
    side,
    type,
    leverage,
    margin: amount,
    size,
    entryPrice,
    limitPrice: type === "limit" ? price : null,
    takeProfit: tp,
    stopLoss: sl,
    openFee,
    takerFeeRate: settings.takerFeeRate,
    maintenanceMarginRate: settings.maintenanceMarginRate,
    forcedWin,
    status: type === "limit" ? "pending" : "open",
    createdAt: now,
    openedAt: type === "limit" ? null : now,
    lastCheckedAt: now,
  };
  position.liquidationPrice = liquidationPrice(position);
  await withTransaction(async (session) => {
    await claimActiveSlot(userId, session);
    await postEntries(
      [
        { userId, wallet: "perpetual", asset: "USDT", type: "perp_margin", amount: -amount, refId: positionId.toString(), note: `${pair.base}/USDT ${side} ${leverage}x` },
        { userId, wallet: "perpetual", asset: "USDT", type: "perp_fee", amount: -openFee, refId: positionId.toString(), note: "Open fee" },
      ],
      session,
    );
    await collections.positions().insertOne(position, { session });
  });
  invalidateOverlay(userId);
  return positionId.toString();
};

const closePositionAt = async (position, exitPrice, reason) => {
  const liquidated = reason === "liquidation";
  let pnl = liquidated ? toBig(position.margin).times(-1) : pnlAt(position, exitPrice);
  let closeFee = liquidated ? toBig(0) : toBig(exitPrice).times(position.size).times(position.takerFeeRate ?? defaultPlatformSettings.takerFeeRate);
  if (position.forcedWin && !liquidated) {
    const worst = toBig(position.margin).plus(pnl).minus(closeFee);
    if (worst.lte(position.margin)) {
      pnl = toBig(0);
      closeFee = toBig(0);
    }
  }
  const payoutBig = toBig(position.margin).plus(pnl).minus(closeFee);
  const payout = payoutBig.gt(0) ? toAmount(payoutBig) : 0;
  await withTransaction(async (session) => {
    const claimed = await collections.positions().findOneAndUpdate(
      { _id: position._id, status: "open", margin: position.margin },
      { $set: { status: liquidated ? "liquidated" : "closed", exitPrice, pnl: toAmount(pnl), closeFee: toAmount(closeFee), payout, closeReason: reason, closedAt: new Date() } },
      { session },
    );
    if (!claimed) throw new LedgerError("This position is already closed or just changed. Try again.");
    await releaseActiveSlot(position.userId, session);
    if (payout > 0) {
      await postEntries([{ userId: position.userId, wallet: "perpetual", asset: "USDT", type: "perp_close", amount: payout, refId: position._id.toString(), note: reason === "manual" ? "Closed" : reason.replace("_", " ") }], session);
    }
  });
  if (position.forcedWin) invalidateOverlay(position.userId);
};

const triggerFor = (position, candle) => {
  const long = position.side === "long";
  if (!position.forcedWin) {
    if (long ? candle.low <= position.liquidationPrice : candle.high >= position.liquidationPrice) return ["liquidation", position.liquidationPrice];
    if (position.stopLoss && (long ? candle.low <= position.stopLoss : candle.high >= position.stopLoss)) return ["stop_loss", position.stopLoss];
  }
  const afterOpen = position.openedAt && candle.openTime > position.openedAt.getTime();
  if (afterOpen && position.takeProfit && (long ? candle.high >= position.takeProfit : candle.low <= position.takeProfit)) return ["take_profit", position.takeProfit];
  return null;
};

const evaluationWindow = (cursor) => {
  if (cursor % MINUTE === 0) return { interval: "1m", step: MINUTE, startTime: cursor, limit: 1000 };
  return { interval: "1s", step: SECOND, startTime: Math.floor(cursor / SECOND) * SECOND, endTime: Math.ceil(cursor / MINUTE) * MINUTE - 1, limit: 60 };
};

const evaluatePosition = async (position) => {
  let cursor = position.lastCheckedAt.getTime();
  let current = position;
  while (cursor < Date.now() - CHECK_OVERLAP_MS) {
    const requestedAt = Date.now();
    const { step, ...range } = evaluationWindow(cursor);
    const candles = await fetchKlineRange({ symbol: current.symbol, ...range });
    const steered = current.forcedWin && current.openedAt ? transformCandlesForWindow(positionWindow(current), candles, step) : candles;
    for (const candle of steered) {
      if (current.status === "pending") {
        const fills = current.side === "long" ? candle.low <= current.limitPrice : candle.high >= current.limitPrice;
        if (!fills) continue;
        const filled = await collections
          .positions()
          .findOneAndUpdate({ _id: current._id, status: "pending" }, { $set: { status: "open", openedAt: new Date(Math.max(candle.openTime, current.createdAt.getTime())) } }, { returnDocument: "after" });
        if (!filled) return;
        current = filled;
      }
      const trigger = triggerFor(current, candle);
      if (trigger) {
        await closePositionAt(current, trigger[1], trigger[0]).catch(async (error) => {
          if (!(error instanceof LedgerError)) {
            console.error(`Position ${current._id.toString()} (${current.userId}) ${trigger[0]} check failed:`, error);
            return;
          }
          const fresh = await collections.positions().findOne({ _id: current._id, status: "open" });
          if (!fresh) return;
          await closePositionAt(fresh, trigger[1], trigger[0]).catch((retryError) =>
            console.error(`Position ${current._id.toString()} (${current.userId}) ${trigger[0]} retry failed:`, retryError),
          );
        });
        return;
      }
    }
    const safeEnd = requestedAt - CHECK_OVERLAP_MS;
    const minuteDone = range.endTime !== undefined && range.endTime + 1 <= safeEnd;
    const reached = candles.length ? candles.at(-1).openTime + step : minuteDone ? range.endTime + 1 : cursor;
    const next = Math.max(cursor, Math.min(reached, safeEnd));
    if (next === cursor) return;
    await collections.positions().updateOne({ _id: current._id, status: { $in: ["open", "pending"] } }, { $set: { lastCheckedAt: new Date(next) } });
    const caughtUp = range.interval === "1m" ? candles.length < range.limit : reached > safeEnd;
    if (caughtUp) return;
    cursor = next;
  }
};

export const settleUser = async (userId) => {
  await ensureIndexes();
  const [dueOrders, activePositions] = await Promise.all([
    collections.orders().find({ userId, status: "open", expiresAt: { $lte: new Date(Date.now() - SETTLE_DELAY) } }).toArray(),
    collections.positions().find({ userId, status: { $in: ["open", "pending"] } }).toArray(),
  ]);
  const work = [...dueOrders.map((order) => () => settleTimedOrder(order)), ...activePositions.map((position) => () => evaluatePosition(position))];
  await inBatches(work, (run) => run(), (reason) => console.error(`Settlement failed for user ${userId}:`, reason));
};

export const settleAll = async () => {
  await ensureIndexes();
  const [orderUsers, positionUsers] = await Promise.all([
    collections.orders().distinct("userId", { status: "open", expiresAt: { $lte: new Date(Date.now() - SETTLE_DELAY) } }),
    collections.positions().distinct("userId", { status: { $in: ["open", "pending"] } }),
  ]);
  const users = [...new Set([...orderUsers, ...positionUsers])];
  await inBatches(users, settleUser, (reason) => console.error("Settlement sweep failed for a user:", reason));
  return users.length;
};

const settleGates = new Map();

const pruneSettleGates = (now) => {
  settleGates.forEach((at, userId) => {
    if (now - at >= SETTLE_DEBOUNCE_MS) settleGates.delete(userId);
  });
};

const settleIfDue = async (userId) => {
  const now = Date.now();
  const last = settleGates.get(userId) ?? 0;
  if (now - last < SETTLE_DEBOUNCE_MS) return;
  if (settleGates.size > 1000) pruneSettleGates(now);
  settleGates.set(userId, now);
  await settleUser(userId);
};

const ownPosition = async (userId, id, status) => {
  const _id = toObjectId(id);
  const position = _id ? await collections.positions().findOne({ _id, userId, status }) : null;
  if (!position) throw new LedgerError(status === "pending" ? "Order not found or already filled." : "Position not found or already closed.");
  return position;
};

export const closePosition = async (userId, id) => {
  const position = await ownPosition(userId, id, "open");
  await evaluatePosition(position);
  const open = await ownPosition(userId, id, "open");
  const exitPrice = open.forcedWin ? await forcedExitPrice(open) : await latestPrice(open.symbol);
  await closePositionAt(open, exitPrice, "manual");
};

export const closeAllPositions = async (userId) => {
  await settleUser(userId);
  const positions = await collections.positions().find({ userId, status: "open" }).toArray();
  if (!positions.length) throw new LedgerError("You have no open positions.");
  const symbols = [...new Set(positions.map((item) => item.symbol))];
  const prices = await fetchLatestPrices(symbols);
  const priced = positions.filter((position) => Number(prices[position.symbol]) > 0);
  if (!priced.length) throw new LedgerError("Live price unavailable. Try again in a moment.");
  const exits = await Promise.all(priced.map((position) => (position.forcedWin ? forcedExitPrice(position) : Promise.resolve(Number(prices[position.symbol])))));
  const results = await Promise.allSettled(priced.map((position, index) => closePositionAt(position, exits[index], "manual")));
  const closed = results.filter((item) => item.status === "fulfilled").length;
  if (!closed) throw new LedgerError("No positions could be closed. Try again in a moment.");
  return { closed, total: positions.length };
};

export const cancelPendingOrder = async (userId, id) => {
  await evaluatePosition(await ownPosition(userId, id, "pending")).catch((error) => {
    if (error instanceof LedgerError) throw error;
    console.error(`Could not replay pending order ${id} before cancelling:`, error);
    throw new LedgerError("Market data is unavailable, so this order can't be checked for a fill yet. Try again in a moment.");
  });
  const position = await ownPosition(userId, id, "pending");
  await withTransaction(async (session) => {
    const claimed = await collections.positions().findOneAndUpdate({ _id: position._id, status: "pending" }, { $set: { status: "cancelled", closedAt: new Date() } }, { session });
    if (!claimed) throw new LedgerError("Order was already filled.");
    await releaseActiveSlot(userId, session);
    await postEntries(
      [
        { userId, wallet: "perpetual", asset: "USDT", type: "perp_margin", amount: position.margin, refId: position._id.toString(), note: "Order cancelled" },
        { userId, wallet: "perpetual", asset: "USDT", type: "perp_fee", amount: position.openFee, refId: position._id.toString(), note: "Fee refund" },
      ],
      session,
    );
  });
};

export const addMargin = async (userId, id, amount) => {
  await evaluatePosition(await ownPosition(userId, id, "open"));
  const position = await ownPosition(userId, id, "open");
  const margin = toAmount(toBig(position.margin).plus(amount));
  const updated = { ...position, margin };
  await withTransaction(async (session) => {
    const claimed = await collections
      .positions()
      .findOneAndUpdate({ _id: position._id, status: "open", margin: position.margin }, { $set: { margin, liquidationPrice: liquidationPrice(updated) } }, { session });
    if (!claimed) throw new LedgerError("This position changed while you were adding margin. Check its current margin and try again.");
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "perp_margin", amount: -amount, refId: position._id.toString(), note: "Margin added" }], session);
  });
};

const timedDTO = (order) => ({
  id: order._id.toString(),
  symbol: order.symbol,
  direction: order.direction,
  duration: order.duration,
  amount: order.amount,
  payoutRate: order.payoutRate,
  openPrice: order.openPrice,
  closePrice: order.closePrice ?? null,
  payout: order.payout ?? null,
  status: order.status,
  openedAt: order.openedAt.toISOString(),
  expiresAt: order.expiresAt.toISOString(),
  settledAt: order.settledAt?.toISOString() ?? null,
});

const positionDTO = (position) => ({
  id: position._id.toString(),
  symbol: position.symbol,
  side: position.side,
  type: position.type,
  status: position.status,
  leverage: position.leverage,
  margin: position.margin,
  size: position.size,
  entryPrice: position.entryPrice,
  limitPrice: position.limitPrice,
  liquidationPrice: position.liquidationPrice,
  takeProfit: position.takeProfit,
  stopLoss: position.stopLoss,
  openFee: position.openFee,
  takerFeeRate: position.takerFeeRate ?? null,
  exitPrice: position.exitPrice ?? null,
  pnl: position.pnl ?? null,
  closeFee: position.closeFee ?? null,
  payout: position.payout ?? null,
  closeReason: position.closeReason ?? null,
  createdAt: position.createdAt.toISOString(),
  openedAt: position.openedAt?.toISOString() ?? null,
  closedAt: position.closedAt?.toISOString() ?? null,
});

export const getTradingSnapshot = async (userId, market) => {
  await settleIfDue(userId);
  const wallet = market === "timed" ? "timed" : "perpetual";
  const [balance, items] = await Promise.all([
    getBalance(userId, wallet, "USDT"),
    market === "timed"
      ? collections.orders().find({ userId }).sort({ openedAt: -1 }).limit(200).toArray()
      : collections.positions().find({ userId }).sort({ createdAt: -1 }).limit(200).toArray(),
  ]);
  return { available: toAmountString(balance), items: items.map(market === "timed" ? timedDTO : positionDTO) };
};

export const getOrderDetail = async (userId, market, id) => {
  const _id = toObjectId(id);
  if (!_id) return null;
  await settleIfDue(userId);
  const doc = market === "timed" ? await collections.orders().findOne({ _id, userId }) : await collections.positions().findOne({ _id, userId });
  if (!doc) return null;
  return market === "timed" ? timedDTO(doc) : positionDTO(doc);
};

export const getTradingSummary = async (userId) => {
  await settleIfDue(userId);
  const [openTimed, openPositions, recentTimed, recentPositions] = await Promise.all([
    collections.orders().find({ userId, status: "open" }).sort({ expiresAt: 1 }).toArray(),
    collections.positions().find({ userId, status: { $in: ["open", "pending"] } }).sort({ createdAt: -1 }).toArray(),
    collections.orders().find({ userId, status: { $ne: "open" } }).sort({ settledAt: -1 }).limit(50).toArray(),
    collections.positions().find({ userId, status: { $in: ["closed", "liquidated"] } }).sort({ closedAt: -1 }).limit(50).toArray(),
  ]);
  return {
    openTimed: openTimed.map(timedDTO),
    openPositions: openPositions.map(positionDTO),
    recentTimed: recentTimed.map(timedDTO),
    recentPositions: recentPositions.map(positionDTO),
  };
};
