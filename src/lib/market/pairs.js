export const defaultPairs = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", name: "Bitcoin", color: "#f7931a" },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", name: "Ethereum", color: "#627eea" },
  { symbol: "TRXUSDT", base: "TRX", quote: "USDT", name: "TRON", color: "#ef0027" },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", name: "Solana", color: "#9945ff" },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", name: "BNB", color: "#f3ba2f" },
  { symbol: "XRPUSDT", base: "XRP", quote: "USDT", name: "XRP", color: "#6b7280" },
  { symbol: "DOGEUSDT", base: "DOGE", quote: "USDT", name: "Dogecoin", color: "#c2a633" },
  { symbol: "ADAUSDT", base: "ADA", quote: "USDT", name: "Cardano", color: "#0033ad" },
  { symbol: "LTCUSDT", base: "LTC", quote: "USDT", name: "Litecoin", color: "#a6a9aa" },
  { symbol: "LINKUSDT", base: "LINK", quote: "USDT", name: "Chainlink", color: "#2a5ada" },
  { symbol: "DOTUSDT", base: "DOT", quote: "USDT", name: "Polkadot", color: "#e6007a" },
  { symbol: "AVAXUSDT", base: "AVAX", quote: "USDT", name: "Avalanche", color: "#e84142" },
  { symbol: "SUIUSDT", base: "SUI", quote: "USDT", name: "Sui", color: "#4da2ff" },
  { symbol: "ARBUSDT", base: "ARB", quote: "USDT", name: "Arbitrum", color: "#28a0f0" },
  { symbol: "OPUSDT", base: "OP", quote: "USDT", name: "Optimism", color: "#ff0420" },
  { symbol: "ATOMUSDT", base: "ATOM", quote: "USDT", name: "Cosmos", color: "#6f7390" },
  { symbol: "ICPUSDT", base: "ICP", quote: "USDT", name: "Internet Computer", color: "#29abe2" },
  { symbol: "FILUSDT", base: "FIL", quote: "USDT", name: "Filecoin", color: "#0090ff" },
  { symbol: "PAXGUSDT", base: "PAXG", quote: "USDT", name: "Gold (PAXG)", color: "#e4ce4e" },
  { symbol: "USDCUSDT", base: "USDC", quote: "USDT", name: "USD Coin", color: "#2775ca" },
];

export const featuredSymbols = ["BTCUSDT", "ETHUSDT", "TRXUSDT"];

export const pairBySymbol = Object.fromEntries(defaultPairs.map((pair) => [pair.symbol, pair]));

export const allSymbols = defaultPairs.map((pair) => pair.symbol);

export const findPair = (value) => pairBySymbol[String(value ?? "").toUpperCase()];
