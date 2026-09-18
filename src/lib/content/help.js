export const helpTopics = [
  {
    id: "getting-started",
    title: "Getting started",
    questions: [
      {
        question: "What is {siteName}?",
        answer: "{siteName} is a demo trading platform with live Binance market data. You can practice timed trades and leveraged perpetual positions using demo funds.",
      },
      {
        question: "Do I need to deposit real money?",
        answer: "No. Accounts receive demo USDT. Real deposits and withdrawals are not supported.",
      },
      {
        question: "Where do prices come from?",
        answer: "Tickers, candles, order books and trades are streamed from Binance public market data in real time.",
      },
    ],
  },
  {
    id: "trading",
    title: "Trading",
    questions: [
      {
        question: "How do timed trades work?",
        answer: "Choose Buy High if you expect the price to be higher when the timer ends, or Buy Low if lower. A correct prediction returns your stake plus the payout rate shown for that duration. Equal prices refund your stake.",
      },
      {
        question: "How is the liquidation price calculated?",
        answer: "For isolated margin, a long position is liquidated near entry × (1 − 1/leverage + maintenance margin rate) and a short near entry × (1 + 1/leverage − maintenance margin rate).",
      },
      {
        question: "What fees apply?",
        answer: "Perpetual positions pay a {takerFee} taker fee on position size when opened and closed. Timed trades have no fee.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & security",
    questions: [
      {
        question: "How do I protect my account?",
        answer: "Use a strong password and set a withdrawal PIN in Account → Security. Changing your password signs out every other device.",
      },
      {
        question: "Why verify my identity?",
        answer: "Verification is required to appear on the copy trading leaderboard. Submissions are reviewed manually by the admin and never shared.",
      },
    ],
  },
];
