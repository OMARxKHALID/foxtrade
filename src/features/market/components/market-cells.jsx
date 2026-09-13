import Link from "next/link";
import { CoinIcon } from "@/components/icons/coin-icon";
import { formatCompact, formatPrice } from "@/lib/format";

export const PairCell = ({ pair, href }) => (
  <Link href={href} className="flex min-w-0 items-center gap-3">
    <CoinIcon symbol={pair.base} color={pair.color} />
    <span className="min-w-0">
      <span className="block text-sm font-medium text-white">
        {pair.base}
        <span className="font-normal text-neutral-500"> / {pair.quote}</span>
      </span>
      <span className="block truncate text-xs text-neutral-500">{pair.name}</span>
    </span>
  </Link>
);

export const tickerSortValues = (ticker) => ({
  pair: ticker.symbol,
  price: ticker.price,
  change: ticker.changePercent,
  high: ticker.high,
  low: ticker.low,
  turnover: ticker.quoteVolume,
});

export const priceText = (value) => (
  <span suppressHydrationWarning className="text-white">
    {formatPrice(value)}
  </span>
);

export const mutedPrice = (value) => (
  <span suppressHydrationWarning className="text-neutral-300">
    {formatPrice(value)}
  </span>
);

export const compactText = (value) => (
  <span suppressHydrationWarning className="text-neutral-300">
    {formatCompact(value)}
  </span>
);

export const marketColumns = [
  { key: "pair", header: "Pair", sortable: true },
  { key: "price", header: "Price", align: "right", sortable: true },
  { key: "change", header: "24h Change", align: "right", sortable: true },
  { key: "high", header: "24h High", align: "right", sortable: true, hideBelow: "lg" },
  { key: "low", header: "24h Low", align: "right", sortable: true, hideBelow: "lg" },
  { key: "turnover", header: "24h Turnover", align: "right", sortable: true, hideBelow: "md" },
];
