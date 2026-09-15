import { defaultPairs } from "@/lib/market/pairs";

export const wallets = [
  { value: "spot", label: "Spot Wallet", description: "Convert and hold coins" },
  { value: "timed", label: "Options Wallet", description: "Stakes for timed trades" },
  { value: "perpetual", label: "Futures Wallet", description: "Margin for perpetual positions" },
];

export const assets = [
  { symbol: "USDT", name: "Tether", color: "#26a17b" },
  ...defaultPairs.filter((pair) => pair.base !== "USDC").map((pair) => ({ symbol: pair.base, name: pair.name, color: pair.color })),
];

export const networks = ["TRC20", "ERC20", "BEP20"];

export { DEMO_FAUCET_AMOUNT } from "@/lib/demo";
