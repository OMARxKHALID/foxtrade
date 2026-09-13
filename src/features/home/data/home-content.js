export const quickActions = [
  { label: "Withdraw", href: "/assets/withdraw", icon: "withdraw" },
  { label: "Deposit", href: "/assets/deposit", icon: "deposit" },
  { label: "Convert", href: "/assets/convert", icon: "convert" },
  { label: "More", href: "/more", icon: "more" },
];

export const moreGroups = [
  {
    title: "Conventional",
    items: [
      { label: "Deposit", href: "/assets/deposit", icon: "deposit" },
      { label: "Withdraw", href: "/assets/withdraw", icon: "withdraw" },
      { label: "Convert", href: "/assets/convert", icon: "convert" },
      { label: "Transfer", href: "/assets/transfer", icon: "transfer" },
      { label: "Records", href: "/assets/records", icon: "records" },
    ],
  },
  {
    title: "Trade",
    items: [
      { label: "Option", href: "/trade/perpetual/btcusdt", icon: "option" },
      { label: "Futures", href: "/trade/timed/btcusdt", icon: "futures" },
      { label: "Markets", href: "/markets", icon: "markets" },
      { label: "Copy Trading", href: "/copy-trading", icon: "copy" },
      { label: "Futures Rules", href: "/trade/rules/timed", icon: "rules" },
      { label: "Option Rules", href: "/trade/rules/perpetual", icon: "rules" },
    ],
  },
  {
    title: "Other",
    items: [
      { label: "Help", href: "/help", icon: "help" },
      { label: "Contact Us", href: "/support", icon: "support" },
      { label: "Notices", href: "/notices", icon: "notices" },
      { label: "Invite Friends", href: "/account/share", icon: "share" },
      { label: "Security", href: "/account/security", icon: "security" },
      { label: "Language", href: "/account/language", icon: "language" },
      { label: "Download App", href: "/download", icon: "download" },
      { label: "About Us", href: "/about", icon: "about" },
    ],
  },
];
