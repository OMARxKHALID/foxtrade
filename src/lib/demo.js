export const DEMO_FAUCET_AMOUNT = 100000;

export const FAUCET_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const walletLabels = {
  spot: "Spot Wallet",
  timed: "Futures Wallet",
  perpetual: "Option Wallet",
};

export const CONVERT_SPREAD = 0.001;

export const ledgerTypeLabels = {
  faucet: "Demo deposit",
  convert: "Convert",
  transfer: "Transfer",
  timed_stake: "Timed trade",
  timed_payout: "Timed payout",
  perp_margin: "Position margin",
  perp_close: "Position close",
  perp_fee: "Trading fee",
  admin_reset: "Balance reset",
};
