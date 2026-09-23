export const FAUCET_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const walletLabels = {
  spot: "Spot Wallet",
  timed: "Options Wallet",
  perpetual: "Futures Wallet",
};

// Held funds are a real balance a client can see in their history, but not a
// wallet they can trade from, so it stays out of walletLabels and the wallet
// cards that iterate it.
export const holdWalletLabel = "Pending Withdrawal";

export const walletLabelFor = (wallet) => (wallet === "withdrawal_hold" ? holdWalletLabel : (walletLabels[wallet] ?? wallet));

export const ledgerTypeLabels = {
  faucet: "Practice deposit",
  deposit: "Deposit",
  convert: "Convert",
  transfer: "Transfer",
  timed_stake: "Timed trade",
  timed_payout: "Timed payout",
  perp_margin: "Position margin",
  perp_close: "Position close",
  perp_fee: "Trading fee",
  withdraw_hold: "Withdrawal requested",
  withdraw_sent: "Withdrawal sent",
  withdraw_refund: "Withdrawal returned",
  admin_reset: "Balance reset",
  admin_adjust: "Admin adjustment",
};
