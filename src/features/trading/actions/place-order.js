"use server";

import { serverFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import {
  addMargin as addPositionMargin,
  cancelPendingOrder,
  closeAllPositions as closeAll,
  closePosition as close,
  placePerpetualOrder as openPosition,
  placeTimedOrder as openTimed,
} from "@/features/trading/dal/trading-engine";
import { addMarginSchema, perpetualOrderSchema, positionIdSchema, timedOrderSchema } from "@/features/trading/schemas/order-schema";

const asTrader = async (message, work) => {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return signInRequired(message);
  try {
    const limit = await rateLimit(`trade:${user.id}`, { limit: 40, windowSeconds: 60 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    return { ok: true, data: await work(user) };
  } catch (error) {
    return serverFailure(error);
  }
};

export const placeTimedOrder = async (input) => {
  const parsed = timedOrderSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asTrader("Log in to place timed trades.", (user) => openTimed(user.id, parsed.data));
};

export const placePerpetualOrder = async (input) => {
  const parsed = perpetualOrderSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asTrader("Log in to open positions.", (user) => openPosition(user.id, parsed.data));
};

export const closePosition = async (id) => {
  const parsed = positionIdSchema.safeParse(id);
  if (!parsed.success) return validationFailure(parsed.error);
  return asTrader("Log in to manage positions.", (user) => close(user.id, parsed.data));
};

export const closeAllPositions = async () => asTrader("Log in to manage positions.", (user) => closeAll(user.id));

export const cancelOrder = async (id) => {
  const parsed = positionIdSchema.safeParse(id);
  if (!parsed.success) return validationFailure(parsed.error);
  return asTrader("Log in to manage orders.", (user) => cancelPendingOrder(user.id, parsed.data));
};

export const addMargin = async (input) => {
  const parsed = addMarginSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asTrader("Log in to manage positions.", (user) => addPositionMargin(user.id, parsed.data.id, parsed.data.amount));
};
