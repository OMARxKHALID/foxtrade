const basePairs = [
  { base: "BTC", name: "Bitcoin", color: "#f7931a" },
  { base: "ETH", name: "Ethereum", color: "#627eea" },
  { base: "TRX", name: "TRON", color: "#ef0027" },
  { base: "SOL", name: "Solana", color: "#9945ff" },
  { base: "BNB", name: "BNB", color: "#f3ba2f" },
  { base: "XRP", name: "XRP", color: "#6b7280" },
  { base: "DOGE", name: "Dogecoin", color: "#c2a633" },
  { base: "ADA", name: "Cardano", color: "#0033ad" },
  { base: "LTC", name: "Litecoin", color: "#a6a9aa" },
  { base: "LINK", name: "Chainlink", color: "#2a5ada" },
  { base: "DOT", name: "Polkadot", color: "#e6007a" },
  { base: "AVAX", name: "Avalanche", color: "#e84142" },
  { base: "SUI", name: "Sui", color: "#4da2ff" },
  { base: "ARB", name: "Arbitrum", color: "#28a0f0" },
  { base: "OP", name: "Optimism", color: "#ff0420" },
  { base: "ATOM", name: "Cosmos", color: "#6f7390" },
  { base: "ICP", name: "Internet Computer", color: "#29abe2" },
  { base: "FIL", name: "Filecoin", color: "#0090ff" },
  { base: "PAXG", name: "Gold (PAXG)", color: "#e4ce4e" },
  { base: "USDC", name: "USD Coin", color: "#2775ca" },
];

const featuredBases = ["BTC", "ETH", "TRX"];

export const QUOTE = "USDT";

export const toPair = ({ base, name, color, timedEnabled = true, perpetualEnabled = true, maxLeverage = 100, featured = false }) => ({
  symbol: `${base}${QUOTE}`,
  base,
  quote: QUOTE,
  name,
  color,
  timedEnabled,
  perpetualEnabled,
  maxLeverage,
  featured,
});

export const defaultPairs = basePairs.map((pair) => toPair({ ...pair, featured: featuredBases.includes(pair.base) }));

export const indexPairs = (pairs) => Object.fromEntries(pairs.map((pair) => [pair.symbol, pair]));

export const findPair = (pairs, value) => {
  const symbol = String(value ?? "").toUpperCase();
  return pairs.find((pair) => pair.symbol === symbol);
};

export const featuredSymbolsOf = (pairs) => {
  const featured = pairs.filter((pair) => pair.featured);
  return (featured.length ? featured : pairs).slice(0, 3).map((pair) => pair.symbol);
};

export const assetsOf = (pairs) => [
  { symbol: QUOTE, name: "Tether", color: "#26a17b" },
  ...pairs.filter((pair) => pair.base !== "USDC").map((pair) => ({ symbol: pair.base, name: pair.name, color: pair.color })),
];

export const pairLabel = (symbol) => (String(symbol).endsWith(QUOTE) ? `${String(symbol).slice(0, -QUOTE.length)}/${QUOTE}` : String(symbol));
