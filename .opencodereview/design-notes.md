# foxtrade: design notes for reviewers

## What it is
foxtrade is a **demo** crypto trading platform. Users trade with fake balances against live Binance prices. Nothing can be withdrawn: `checkWithdrawal` validates the PIN and balance, then always refuses. Even so, ledger integrity is treated as if the money were real. A bug that lets a user mint balance, avoid a loss, or corrupt another user's data is **High**.

## Stack
Next.js 16 (App Router, `src/proxy.js` instead of middleware), React 19, JavaScript only (no TypeScript), Tailwind v4, MongoDB driver (no ORM), better-auth, zod 4, react-hook-form, TanStack Query, zustand, big.js, Cloudinary (private KYC files), Resend (email), vitest with mongodb-memory-server. Package manager and runtime: Bun.

## Layout
- `src/app`: routes. `(app)` for traders, `(auth)` for login flows, `admin` for the back office, `api` for route handlers (auth, admin KYC file proxy, cron settle, trading).
- `src/features/<feature>/{actions,dal,schemas,components,queries}`: `actions` are `"use server"` entry points, `dal` is server-only business logic, `schemas` are zod.
- `src/lib`: shared server and client utilities. Server-only modules import `"server-only"`.
- `src/components/{ui,layout,motion}`: presentational components.

## Trust boundaries
- **Server actions are public endpoints.** Each one validates with zod, then resolves the user from the better-auth session through `asTrader` (trading), `withUser` (assets) or `asAdmin` (admin). These wrappers also rate limit and map errors with `serverFailure`. A userId, role, price or fee coming from the client is never trusted.
- **Admin** is `user.role === "admin"`. Admin mutations run inside `asAdmin` and call `writeAudit`. The KYC file route returns 404 to non-admins.
- **Only `LedgerError` messages reach users.** Any other error becomes "Something went wrong". Throwing a plain `Error` with a user-facing message is a bug.
- **Cron** `GET /api/cron/settle` requires `Authorization: Bearer CRON_SECRET`, checked with `timingSafeEqual`.
- **KYC files** are uploaded to Cloudinary as `type: private` and are only readable through the admin route, which uses a 60-second signed URL. File type is checked with magic bytes (JPG, PNG, PDF), max 4 MB.

## Money model
- `wallets` hold one balance per `(userId, wallet, asset)` as Decimal128, with a unique index. Wallets are `spot`, `timed` and `perpetual`.
- **All** balance changes go through `postEntries(entries, session)` inside `withTransaction`. Each entry does a conditional `$inc` (debits require `balance >= amount` in the filter; credits may upsert) and inserts a `ledger` row with `balanceAfter`.
- Amounts are big.js or decimal strings on the server, rounded to 8 decimals with `Big.roundDown` (`toDecimal`, `toAmountString`). `toAmount` returns a Number and is only for display or DTOs. Client-side math is preview only; the server recomputes everything.
- `positions` and `orders` documents store margin, size, fees and payouts as plain Numbers (a known limitation, not a new bug).

## Trading engine (`src/features/trading/dal/trading-engine.js`)
- **Timed options:** the stake is debited at placement. The order settles at the Binance 1s kline close at expiry, falling back to a later price after 5 minutes. Win pays `stake × (1 + payoutRate)`, a draw refunds, a loss pays 0.
- **Perpetuals:** margin and open fee are debited at placement. Limit orders stay `pending` until filled. Leverage must satisfy `leverage × maintenanceMarginRate < 1`. A user can have at most 50 open plus pending positions.
- **Lazy settlement:** there is no always-on worker. `evaluatePosition` replays Binance klines from `lastCheckedAt` to now. It runs on the cron sweep, when a user opens trading pages (debounced to 5 seconds per user), and before a close, cancel or add-margin. Replays run 10 at a time.
- **Race safety** comes from status claims: each transition uses `findOneAndUpdate` on the expected status, plus `margin` for closes, and the payout or refund is posted in the same transaction. Concurrent replays, cron and user actions are expected and must credit at most once.

## Intentional design decisions (do not flag)
- **Trigger order within a candle:** liquidation beats stop loss, which beats take profit.
- **Fill candle:** a limit order can hit liquidation or stop loss on the candle it fills in (pessimistic, because order within a candle is unknown). Take profit only triggers on candles that start after `openedAt`.
- **Cancelling a pending order needs market data.** The replay must run first so a filled-and-liquidated order is never refunded. During a Binance outage the cancel fails with a clear `LedgerError`; that is intended.
- **Proxy in production:** `proxy.js` returns 503 when `MONGODB_URI` is missing.
- **Faucet** tops the user up to `demoAmount` total USDT (wallets + open margin + open stakes), with a 24h cooldown lock in `security`.

## Code style (project rules)
- const arrow functions only, handlers named `handleX`, early returns, ES modules.
- Tailwind only; `cn()` for class merging; `focusRing` for focus styles.
- **Zero comments** in code. Never suggest adding comments or JSDoc.
- kebab-case file names.

## What matters most in review
1. Minting, double crediting, or skipping a debit (races, rounding asymmetry, missing claims).
2. Authorization gaps (a missing session check, trusting client ids, admin actions outside `asAdmin`).
3. Settling or refunding on stale or missing price data.
4. Unbounded work per user (Binance calls, queries) that one account could abuse.
5. Server-only code or secrets reaching the client bundle.
