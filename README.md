# Foxtrade

A practice crypto trading platform. Users trade timed options and leveraged perpetual futures with **virtual USDT** against **live Binance market data**. Nothing is deposited and nothing can be withdrawn.

It also includes an admin back office for clients, identity verification (KYC), trading pairs, platform settings, site content and an audit log.

## Features

**Traders**
- **Markets:** live prices, candle charts, order book and recent trades, streamed through the app's market data gateway (originating from Binance public data).
- **Timed options:** predict up or down over 30 seconds to 15 minutes. Payout rates are set per duration.
- **Perpetual futures:** market and limit orders, up to 100x leverage, take profit and stop loss, add margin, and automatic liquidation.
- **Assets:** spot, timed and perpetual wallets, plus convert, transfer, transaction records and a practice top-up faucet.
- **Account:** withdrawal PIN, password change, and basic and document-based identity verification.
- **Also:** support tickets, notices, help center, trading rules, a copy-trading leaderboard, and an installable app (PWA).

**Admins**
- Dashboard stats; client management (ban, role, password, balance adjustments, force win toggle, delete).
- KYC review with private document viewing.
- Trading pairs (enable or disable, leverage limits).
- Platform settings: site name, practice amount, fees, maintenance margin, timed durations.
- Content editor for legal pages, help, trading rules and About; banners and notices.
- Support ticket inbox and an audit log of every admin action.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components, `src/proxy.js`) and React 19 |
| Language | JavaScript (ES modules) |
| Styling | Tailwind CSS v4, shadcn / Base UI primitives, Motion |
| Data | MongoDB (official driver, transactions) |
| Auth | better-auth (email and password, email codes, admin plugin) |
| Validation | zod 4 and react-hook-form |
| Client state | TanStack Query and zustand |
| Money math | big.js (8-decimal ledger stored as Decimal128) |
| Files | Cloudinary (private storage for KYC documents) |
| Email | Resend |
| Tests | Vitest and mongodb-memory-server |
| Runtime and package manager | Bun |

## Requirements

- **Bun**, latest version
- **Node.js 24.x** (the version Next.js runs on)
- **MongoDB running as a replica set.** MongoDB Atlas works, including the free tier. The ledger uses multi-document transactions, which a standalone `mongod` does not support.
- **Optional for local development, required in production:** Resend, Cloudinary, and a cron scheduler. See [External services](#external-services).

## Getting started

```bash
bun install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)). At minimum you need `MONGODB_URI` and `BETTER_AUTH_SECRET`. To generate a secret:

```bash
openssl rand -base64 32
```

Create the first admin and a test client (see [Creating the admin account](#creating-the-admin-account)), then start the dev server:

```bash
bun dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string, including the database name. Must be a replica set. |
| `BETTER_AUTH_SECRET` | Yes | At least 32 random characters. Signs sessions. Changing it logs everyone out. |
| `BETTER_AUTH_URL` | Yes in production | Public site URL, for example `https://app.example.com`. Defaults to `http://localhost:3000`. |
| `ADMIN_EMAIL` | No | An account with this email and a verified email address becomes admin every time it logs in. |
| `RESEND_API_KEY` | Production | Sends verification and password-reset codes. **If unset, emails are only printed to the server log.** |
| `EMAIL_FROM` | Production | Sender, for example `Foxtrade <no-reply@example.com>`. Its domain must be verified in Resend. |
| `CRON_SECRET` | Production | Bearer token that protects `/api/cron/settle`. |
| `CLOUDINARY_CLOUD_NAME` | For KYC | Cloudinary account for identity documents. |
| `CLOUDINARY_API_KEY` | For KYC | |
| `CLOUDINARY_API_SECRET` | For KYC | If any Cloudinary variable is missing, document upload shows "not available yet". |

Never commit `.env.local`. It is already in `.gitignore`.

## Creating the admin account

The seed script creates one verified admin and one verified client:

```bash
SEED_ADMIN_EMAIL=admin@example.com \
SEED_ADMIN_PASSWORD='a-strong-password' \
SEED_CLIENT_EMAIL=client@example.com \
SEED_CLIENT_PASSWORD='another-strong-password' \
bun run db:seed
```

> **Warning:** `db:seed` **drops every collection** in the database before creating the accounts. Run it only on an empty database or a local or dev database. Never run it against production data.

After that, manage roles from **Admin → Clients**. To keep one account as admin permanently, set `ADMIN_EMAIL` to its email.

## Scripts

| Command | What it does |
|---|---|
| `bun dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint |
| `bun run test` | Vitest (starts an in-memory MongoDB replica set) |
| `bun run check` | Lint, then build |
| `bun run db:seed` | Wipe the database and create the admin and client accounts |

To run a single test file:

```bash
bun run test src/features/trading/dal/trading-engine.test.js
```

## Project structure

```text
src/
  app/
    (app)/          trader pages: home, markets, trade, assets, account, support
    (auth)/         login, register, forgot and reset password
    (admin)/admin/  back office
    api/            auth, cron settlement, admin KYC file proxy, trading
  features/<name>/
    actions/        "use server" entry points (validate, authenticate, rate limit)
    dal/            server-only business logic and database access
    schemas/        zod schemas
    components/     feature UI
    queries/        TanStack Query definitions
  components/       shared ui/, layout/, motion/ components
  hooks/            client hooks (use-*.js)
  lib/              ledger, money, auth, session, market data, content, settings
  store/            zustand stores
  proxy.js          auth gate (Next.js 16 replacement for middleware)
scripts/            seed script
tests/              Vitest global setup
```

## How it works

### Market data gateway
The browser never talks to Binance directly. All client market traffic goes through first-party endpoints, which the server can transform per user:

- **REST:** `/api/market/klines`, `/api/market/tickers`, `/api/market/trades` proxy and normalize Binance responses.
- **Stream:** `/api/market/stream` is an SSE endpoint backed by a single shared WebSocket to Binance per server process (`src/lib/market/upstream.js`), with heartbeats and per-client stream filters.
- **Overlay:** for clients flagged with *force win*, `src/lib/market/overlay.js` steers a synthetic price during their forced trades. The chart, order book, trade feed, tickers and settlement all read the same deterministic path, so the payout always matches what the trader saw. The chart snaps back to the real price once the trade settles.

### Ledger
Every balance change goes through `postEntries` in `src/lib/ledger.js`, inside a MongoDB transaction:
- **Debits** are applied only if the balance covers them, checked atomically in the update itself.
- **Every movement** writes a ledger row with the resulting balance.
- **Amounts** are big.js values rounded down to 8 decimals.

New accounts automatically receive the configured practice amount.

### Settlement
There is no always-running worker. Open orders and positions are settled by replaying Binance candles since they were last checked. That happens:
- when the user opens trading or asset pages (at most every 5 seconds per user),
- before the user closes, cancels or adds margin,
- on the scheduled cron call to `/api/cron/settle`.

Settlement is safe to run concurrently. Each order's status change is claimed atomically, so a payout is credited at most once.

### Limits
- **Positions:** up to 50 open positions plus pending orders per user.
- **Leverage:** capped by both the pair and the platform setting, and must stay below `1 / maintenance margin`.
- **Rate limits:** auth, trading, asset actions, KYC uploads and PIN checks are all rate limited.

## External services

### MongoDB (required)
- **Atlas:** create a cluster, a database user, and allow access from your host. Vercel needs `0.0.0.0/0` or its Atlas integration.
- **Connection string:** put it in `MONGODB_URI`, including the database name: `...mongodb.net/foxtrade?retryWrites=true&w=majority`.

### Resend (email)
Resend sends the 6-digit codes for email verification and password reset.
1. Create an API key and verify your sending domain in Resend (DNS records).
2. Set `RESEND_API_KEY` and `EMAIL_FROM` with an address on that domain.

**Without it, users cannot reset forgotten passwords in production.**

### Cloudinary (KYC documents)
Identity documents (JPG, PNG or PDF, up to 4 MB) are uploaded as **private** assets.
- **Viewing:** only admins can see them, through `/api/admin/kyc/...`, which issues a 60-second signed link.
- **Cleanup:** replaced files and deleted clients' files are removed from Cloudinary.

Set the three `CLOUDINARY_*` variables from your Cloudinary dashboard.

### Scheduled settlement (cron)
Call this endpoint every minute or so:

```http
GET /api/cron/settle
Authorization: Bearer <CRON_SECRET>
```

Without it, a trade only settles when its owner comes back to the app, and the leaderboard and admin stats go stale in the meantime.

**On Vercel**, `vercel.json` already declares the job. Vercel sends `CRON_SECRET` as the bearer token automatically:

```json
{
  "crons": [{ "path": "/api/cron/settle", "schedule": "0 0 * * *" }]
}
```

**The schedule is daily because Vercel Hobby allows only one cron run per day**, and a more frequent schedule makes the deployment fail outright. A daily sweep is a backstop, not real-time settlement. For settlement every minute, either:
- upgrade to Vercel Pro and change the schedule to `* * * * *`, or
- keep the daily job and add an external scheduler (cron-job.org, GitHub Actions, Upstash QStash) that calls the same URL every minute with the `Authorization: Bearer <CRON_SECRET>` header.

## Deployment (Vercel)

1. Import the repository in Vercel. Bun is detected from `bun.lock`.
2. Add every production environment variable. Set `BETTER_AUTH_URL` to the production domain.
3. Deploy, then run the seed script once against the **empty** production database from your machine, with `MONGODB_URI` pointing to it.
4. Configure the cron job (see above).
5. Log in as admin. In **Admin → Settings**, set the site name, support email and practice amount. In **Admin → Content**, replace the legal pages.

Security headers (CSP, HSTS, frame denial) are set in `next.config.mjs`. If you add a third-party script, image host or API, update the Content Security Policy there.

## Content and legal pages

Legal pages (Terms, Privacy, Risk Disclosure), help topics, trading rules and the About page have defaults in `src/lib/content/`. Admins can override them in **Admin → Content** without a code change, and "Restore default" goes back to the version in code.

Text can use these placeholders:
- `{siteName}`
- `{supportEmail}`
- `{takerFee}`
- `{demoAmount}`

> The default legal texts are **drafts**. Have a qualified lawyer review and complete them (company name, address, governing law, data protection details) before going live.

## Code review tooling

The repo includes configuration for [Open Code Review](https://github.com/alibaba/open-code-review):
- `.opencodereview/rule.json`: project review rules
- `.opencodereview/background.md` and `design-notes.md`: context for the reviewer

In Claude Code, run `/delegate-review` (optionally with `--from main --to <branch>`) to review changes.

### Developer tooling you can remove

These directories only help AI coding assistants and are safe to delete if you do not use them:
- `.opencodereview/` — review rules and context
- `.claude/` — the `/delegate-review` command and the dev-server launch config
- `AGENTS.md` and `CLAUDE.md` — `next dev` rewrites `AGENTS.md` on every run, so deleting it brings it back as an uncommitted change

## Continuous integration

Two GitHub Actions workflows live in `.github/workflows`:
- `ci.yml` runs lint, tests and the production build on every push and pull request.
- `settle.yml` calls `/api/cron/settle` every 5 minutes. It needs the repository secret `CRON_SECRET` and the repository variable `SITE_URL` (your production URL). This exists because Vercel Hobby only allows a cron job to run once per day; if you move to Pro, raise the schedule in `vercel.json` and delete this workflow.

## Code conventions

- JavaScript ES modules, `const` arrow functions, early returns, event handlers named `handleX`.
- Tailwind only. Merge classes with `cn()`.
- No code comments.
- kebab-case file names. Hooks and stores start with `use-`.
- Use Bun for everything (`bun add`, `bun run`). Do not use npm or npx.
