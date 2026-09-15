"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, CandlestickChart, ReceiptText } from "lucide-react";
import { CoinIcon } from "@/components/icons/coin-icon";
import { ChangePill } from "@/components/ui/change-pill";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatCompact, formatPrice, formatQuantity } from "@/lib/format";
import { toRecordRow } from "@/features/assets/components/record-rows";
import { wallets } from "@/features/assets/data/assets-config";

const columns = [
  { key: "time", header: "Time", sortable: true },
  { key: "type", header: "Type" },
  { key: "wallet", header: "Wallet", hideBelow: "md" },
  { key: "amount", header: "Amount", align: "right", sortable: true },
  { key: "balance", header: "Balance After", align: "right", hideBelow: "sm" },
];

const LiveQuote = ({ pairSymbol }) => {
  const [ticker] = useLiveTickers([pairSymbol]);
  if (!ticker) return <p className="text-sm text-neutral-500">Price unavailable</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-heading text-3xl font-bold text-white tabular-nums sm:text-4xl">{formatPrice(ticker.price)}</span>
        <ChangePill value={ticker.changePercent} size="sm" />
      </div>
      <dl className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <dt className="text-neutral-500">24h High</dt>
          <dd className="mt-1 text-white tabular-nums">{formatPrice(ticker.high)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">24h Low</dt>
          <dd className="mt-1 text-white tabular-nums">{formatPrice(ticker.low)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">24h Turnover</dt>
          <dd className="mt-1 text-white tabular-nums">{formatCompact(ticker.quoteVolume)}</dd>
        </div>
      </dl>
    </div>
  );
};

export const AssetDetail = ({ asset, pairSymbol, holding, records }) => {
  const actions = [
    { label: "Deposit", href: "/assets/deposit", icon: ArrowDownToLine },
    { label: "Withdraw", href: "/assets/withdraw", icon: ArrowUpFromLine },
    { label: "Convert", href: "/assets/convert", icon: ArrowLeftRight },
    ...(pairSymbol ? [{ label: "Trade", href: `/trade/perpetual/${pairSymbol.toLowerCase()}`, icon: CandlestickChart }] : []),
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <GlowCard variant="warm">
          <CardBody>
            <div className="flex items-center gap-3">
              <CoinIcon symbol={asset.symbol} color={asset.color} />
              <div>
                <p className="font-heading text-lg font-semibold text-white">{asset.symbol}</p>
                <p className="text-xs text-neutral-500">{asset.name}</p>
              </div>
            </div>
            <div className="mt-6">{pairSymbol ? <LiveQuote pairSymbol={pairSymbol} /> : <p className="font-heading text-3xl font-bold text-white sm:text-4xl">1.00 USDT</p>}</div>
            <ul className="mt-6 grid grid-cols-4 gap-2 sm:mt-8 sm:gap-4">
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
        <GlowCard as="section" aria-labelledby="asset-balances-title">
          <CardHeader id="asset-balances-title" title="Balances" description={`${asset.symbol} held in each wallet`} />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {wallets.map((wallet) => (
                <li key={wallet.value} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-field px-4 py-3">
                  <p className="text-sm text-white">{wallet.label}</p>
                  <p className="shrink-0 text-sm text-neutral-400 tabular-nums">
                    {holding ? formatQuantity(holding.byWallet?.[wallet.value] ?? 0) : "--"} {asset.symbol}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
      </div>
      <DataTable
        title={`${asset.symbol} history`}
        titleId="asset-history-title"
        searchPlaceholder="Search history"
        columns={columns}
        rows={(records ?? []).map(toRecordRow)}
        initialSort={{ key: "time", direction: "desc" }}
        emptyState={
          records ? (
            <EmptyState icon={ReceiptText} title={`No ${asset.symbol} activity yet`} text="Conversions, transfers and trades of this asset appear here." />
          ) : (
            <SignInPrompt title="Log in to see this asset's history" text={`Deposits, conversions and transfers of ${asset.symbol} appear here.`} />
          )
        }
      />
    </div>
  );
};
