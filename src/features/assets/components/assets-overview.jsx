"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowRightLeft, ArrowUpFromLine, ReceiptText } from "lucide-react";
import { CoinIcon } from "@/components/icons/coin-icon";
import { ChangePill } from "@/components/ui/change-pill";
import { DataTable } from "@/components/ui/data-table";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatPrice, formatQuantity, formatUsdt } from "@/lib/format";
import { usePlatform } from "@/hooks/use-platform";
import { wallets } from "@/features/assets/data/assets-config";

const actions = [
  { label: "Deposit", href: "/assets/deposit", icon: ArrowDownToLine },
  { label: "Withdraw", href: "/assets/withdraw", icon: ArrowUpFromLine },
  { label: "Convert", href: "/assets/convert", icon: ArrowLeftRight },
  { label: "Transfer", href: "/assets/transfer", icon: ArrowRightLeft },
  { label: "Records", href: "/assets/records", icon: ReceiptText },
];

const columns = [
  { key: "asset", header: "Asset", sortable: true },
  { key: "price", header: "Price", align: "right", sortable: true },
  { key: "change", header: "24h Change", align: "right", sortable: true, hideBelow: "sm" },
  { key: "balance", header: "Balance", align: "right", sortable: true, hideBelow: "md" },
  { key: "value", header: "Value (USDT)", align: "right", sortable: true },
];

export const AssetsOverview = ({ overview }) => {
  const { assets, symbols } = usePlatform();
  const tickers = useLiveTickers(symbols);
  const bySymbol = Object.fromEntries(tickers.map((ticker) => [ticker.symbol, ticker]));
  const priceOf = (symbol) => (symbol === "USDT" ? 1 : bySymbol[`${symbol}USDT`]?.price ?? 0);

  const rows = assets.map((asset) => {
    const price = priceOf(asset.symbol);
    const change = bySymbol[`${asset.symbol}USDT`]?.changePercent ?? 0;
    const balance = Number(overview?.holdings[asset.symbol]?.total ?? 0);
    const value = balance * price;
    return {
      id: asset.symbol,
      searchText: `${asset.symbol} ${asset.name}`,
      sortValues: { asset: asset.symbol, price, change, balance, value },
      cells: {
        asset: (
          <Link href={`/assets/${asset.symbol.toLowerCase()}`} className="flex items-center gap-3">
            <CoinIcon symbol={asset.symbol} color={asset.color} />
            <span>
              <span className="block text-sm font-medium text-white">{asset.symbol}</span>
              <span className="block text-xs text-neutral-500">{asset.name}</span>
            </span>
          </Link>
        ),
        price: <span className="text-white">{price ? formatPrice(price) : "--"}</span>,
        change: <ChangePill value={change} size="sm" />,
        balance: <span className={balance ? "text-white" : "text-neutral-500"}>{overview ? formatQuantity(balance) : "--"}</span>,
        value: <span className={value ? "text-white" : "text-neutral-500"}>{overview ? formatUsdt(value) : "--"}</span>,
      },
    };
  });

  const liveTotal = overview ? rows.reduce((sum, row) => sum + row.sortValues.value, 0) : null;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <GlowCard variant="warm">
          <CardBody>
            <p className="text-sm text-neutral-400">Total Assets (USDT)</p>
            <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl">{liveTotal === null ? "--" : formatUsdt(liveTotal)}</p>
            <p className="mt-2 text-sm text-neutral-400">
              {overview?.pricesStale ? "Live prices unavailable — non-USDT balances valued at 0" : "Valued at live market prices"}
            </p>
            <ul className="mt-6 grid grid-cols-5 gap-2 sm:mt-8 sm:gap-4">
              {actions.map((action) => (
                <li key={action.label}>
                  <Link href={action.href} className="flex flex-col items-center gap-2 text-center text-xs text-white">
                    <IconTile icon={action.icon} size="md" />
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="wallets-title">
          <CardHeader id="wallets-title" title="Wallets" />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {wallets.map((wallet) => (
                <li key={wallet.value} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-field px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white">{wallet.label}</p>
                    <p className="truncate text-xs text-neutral-500">{wallet.description}</p>
                  </div>
                  <p className="shrink-0 text-sm text-neutral-300 tabular-nums">{overview ? formatUsdt(overview.walletTotals[wallet.value] ?? 0) : "--"} USDT</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
      </div>

      <DataTable
        title="Holdings"
        titleId="holdings-title"
        searchPlaceholder="Search asset"
        columns={columns}
        rows={rows}
        initialSort={overview ? { key: "value", direction: "desc" } : undefined}
        footer={overview ? null : <SignInPrompt title="Log in to see your balances" text="Every new account receives demo USDT to start trading." className="border-t border-white/10" />}
      />
    </div>
  );
};
