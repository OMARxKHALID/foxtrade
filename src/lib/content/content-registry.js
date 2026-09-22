import { helpTopics } from "@/lib/content/help";
import { legalPages } from "@/lib/content/legal";
import { tradingGuides } from "@/lib/content/trading-guide";

const aboutDefaults = {
  title: "Practice trading without risking money",
  summary:
    "{siteName} is a simulated trading platform. It pairs live crypto market data with practice wallets so you can learn how timed trades, leverage, margin and liquidation work before trading real assets anywhere else.",
  sections: [
    { heading: "Real market data", body: "Prices, candles, order books and trades stream live from Binance public market data." },
    { heading: "Practice balances only", body: "Every account trades with practice USDT. Nothing is deposited, nothing leaves the platform." },
    { heading: "Honest settlement", body: "Trades settle at the recorded market price. The platform never sets prices or results." },
    { heading: "Two ways to trade", body: "Timed options for short predictions and perpetual futures with leverage and TP/SL." },
  ],
};

export const contentDocuments = [
  ...Object.entries(legalPages).map(([slug, page]) => ({
    key: `legal-${slug}`,
    slug,
    group: "Legal",
    labels: { heading: "Heading", body: "Text" },
    hasSummary: false,
    meta: { updated: page.updated },
    defaults: { title: page.title, summary: "", sections: page.sections.map((section) => ({ heading: section.heading, body: section.text })) },
  })),
  ...helpTopics.map((topic) => ({
    key: `help-${topic.id}`,
    slug: topic.id,
    group: "Help Center",
    labels: { heading: "Question", body: "Answer" },
    hasSummary: false,
    defaults: { title: topic.title, summary: "", sections: topic.questions.map((item) => ({ heading: item.question, body: item.answer })) },
  })),
  ...Object.entries(tradingGuides).map(([market, guide]) => ({
    key: `guide-${market}`,
    slug: market,
    group: "Trading rules",
    labels: { heading: "Heading", body: "Points (one per line)" },
    hasSummary: true,
    meta: { label: guide.label, tradeHref: guide.tradeHref },
    defaults: { title: guide.title, summary: guide.summary, sections: guide.sections.map((section) => ({ heading: section.heading, body: section.items.join("\n") })) },
  })),
  { key: "about", slug: "about", group: "About", labels: { heading: "Card title", body: "Card text" }, hasSummary: true, defaults: aboutDefaults },
];

export const contentByKey = Object.fromEntries(contentDocuments.map((doc) => [doc.key, doc]));

export const documentsInGroup = (group) => contentDocuments.filter((doc) => doc.group === group);

export const fillPlaceholders = (text, { siteName, supportEmail, takerFeeRate, demoAmount }) =>
  String(text ?? "")
    .replaceAll("{siteName}", siteName)
    .replaceAll("{supportEmail}", supportEmail)
    .replaceAll("{takerFee}", `${+(takerFeeRate * 100).toFixed(4)}%`)
    .replaceAll("{demoAmount}", `${Number(demoAmount).toLocaleString("en-US")} USDT`);

export const bodyLines = (body) => String(body).split("\n").map((line) => line.trim()).filter(Boolean);
