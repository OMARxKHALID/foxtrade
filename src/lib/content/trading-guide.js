export const tradingGuides = {
  timed: {
    title: "Options Rules",
    label: "Options · Timed",
    tradeHref: "/trade/timed/btcusdt",
    summary: "Predict whether the price will be higher or lower when the timer ends.",
    sections: [
      {
        heading: "Placing a trade",
        items: [
          "Choose a pair, a duration and a stake in USDT.",
          "Pick Call if you expect the price to be higher at expiry, or Put if you expect it to be lower.",
          "The opening price is the live market price recorded by the server when the order is accepted.",
        ],
      },
      {
        heading: "Settlement",
        items: [
          "The closing price is the market price at the exact second the timer ends.",
          "A correct prediction returns your stake plus the payout rate for the chosen duration.",
          "An incorrect prediction loses the stake. If the closing price equals the opening price, the stake is refunded.",
          "Prices come from Binance public market data and are never adjusted by the platform.",
        ],
      },
      {
        heading: "Limits",
        items: ["Each duration has a minimum stake shown in the table below.", "Open trades cannot be cancelled once accepted."],
      },
    ],
  },
  perpetual: {
    title: "Futures Rules",
    label: "Futures · Perpetual",
    tradeHref: "/trade/perpetual/btcusdt",
    summary: "Open leveraged long or short positions with isolated margin and no expiry.",
    sections: [
      {
        heading: "Orders",
        items: [
          "Market orders fill at the live price. Limit orders fill when the market reaches your price.",
          "Take-profit and stop-loss prices close the position automatically when touched.",
          "Leverage from 1x up to the maximum shown in the table above, which can be lower on some pairs.",
        ],
      },
      {
        heading: "Margin and liquidation",
        items: [
          "Each position uses isolated margin: only the margin assigned to it can be lost.",
          "The maintenance margin rate shown above is applied to position value.",
          "Long liquidation price ≈ entry × (1 − 1/leverage + maintenance margin rate).",
          "Short liquidation price ≈ entry × (1 + 1/leverage − maintenance margin rate).",
          "You can add margin to an open position to move its liquidation price further away.",
        ],
      },
      {
        heading: "Fees and PnL",
        items: [
          "The taker fee shown above is charged on position value when opening and closing.",
          "Unrealised PnL = (mark price − entry price) × size for longs, reversed for shorts.",
          "Realised PnL is credited to your Futures Wallet when the position closes.",
        ],
      },
    ],
  },
};
