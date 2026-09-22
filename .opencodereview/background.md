foxtrade is a practice crypto trading platform: fake balances, live Binance prices, no real withdrawals. Ledger integrity is still treated as critical.

Stack: Next.js 16 (src/proxy.js replaces middleware), React 19, JavaScript, Tailwind v4, MongoDB driver, better-auth, zod 4, big.js, Cloudinary private KYC files, Bun.

Server actions are public endpoints. They validate with zod, then take the user from the session via asTrader, withUser or asAdmin (these also rate limit). Never trust a userId, role, price or fee from the client. Only LedgerError messages reach users.

Money: every balance change goes through postEntries inside withTransaction. Debits are guarded by balance >= amount in the update filter. Amounts are big.js or decimal strings rounded to 8 decimals with roundDown. toAmount (Number) is for display only.

Trading: settlement is lazy. evaluatePosition replays Binance klines from lastCheckedAt, on cron, on page views and before close, cancel or add-margin. State changes are claimed with findOneAndUpdate on the expected status, and the payout is posted in the same transaction.

Intentional, do not flag: liquidation beats stop loss beats take profit in one candle; stop loss and liquidation can trigger on the fill candle but take profit cannot; cancelling a pending order fails during a Binance outage; limit of 50 active positions per user; the proxy returns 503 in production when MONGODB_URI is missing.

Style: const arrow functions, handleX handlers, Tailwind with cn(), zero code comments (never suggest comments).
