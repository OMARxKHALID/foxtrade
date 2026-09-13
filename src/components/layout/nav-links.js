export const appNavLinks = [
  { label: "Home", href: "/", icon: "home", match: (path) => path === "/" },
  { label: "Markets", href: "/markets", icon: "markets", match: (path) => path.startsWith("/markets") },
  { label: "Futures", href: "/trade/timed/btcusdt", icon: "futures", match: (path) => path.startsWith("/trade/timed") },
  { label: "Option", href: "/trade/perpetual/btcusdt", icon: "option", match: (path) => path.startsWith("/trade/perpetual") },
  { label: "Assets", href: "/assets", icon: "assets", match: (path) => path.startsWith("/assets") },
];
