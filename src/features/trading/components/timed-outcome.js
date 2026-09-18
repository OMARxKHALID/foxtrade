export const isWinning = (direction, openPrice, markPrice) => {
  if (!markPrice || !openPrice || markPrice === openPrice) return null;
  return direction === "call" ? markPrice > openPrice : markPrice < openPrice;
};

export const expectedReturn = (order, markPrice) => {
  const winning = isWinning(order.direction, order.openPrice, markPrice);
  if (winning === null) return null;
  return winning ? order.amount * order.payoutRate : -order.amount;
};

export const secondsLeft = (expiresAt, now) => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));

export const remainingFraction = (openedAt, expiresAt, now) => {
  const start = new Date(openedAt).getTime();
  const end = new Date(expiresAt).getTime();
  if (!(end > start)) return 0;
  return Math.min(1, Math.max(0, (end - now) / (end - start)));
};

export const settledProfit = (order) => {
  if (["open", "cancelled"].includes(order.status) || order.payout === null) return null;
  return order.payout - order.amount;
};
