export const legalPages = {
  terms: {
    title: "Terms of Service",
    updated: "2026-09-16",
    sections: [
      {
        heading: "About these terms",
        text: "These terms govern your use of {siteName}, operated by [Company legal name], [registered address] (\"we\", \"us\"). By creating an account or using the service you agree to these terms, our Privacy Policy and our Risk Disclosure. If you do not agree, do not use the service.",
      },
      {
        heading: "Eligibility",
        text: "You must be at least 18 years old and able to form a binding contract. You may not use {siteName} where doing so is prohibited by the laws that apply to you.",
      },
      {
        heading: "A practice service with no real money",
        text: "{siteName} is a trading simulator. All balances, deposits, profits, losses and payouts are virtual and have no monetary value. They cannot be withdrawn, sold, transferred or exchanged for money, cryptocurrency or anything else of value. Nothing on the service is an offer to trade real financial instruments.",
      },
      {
        heading: "Your account",
        text: "Provide accurate information and keep your password and withdrawal PIN confidential. You are responsible for all activity on your account. Tell us at {supportEmail} straight away if you suspect unauthorised access. One person may hold only one account.",
      },
      {
        heading: "Acceptable use",
        text: "You must not:\n- use bots, scripts or scrapers against the service;\n- create multiple accounts, for example to collect extra practice funds;\n- exploit bugs or pricing errors (report them to us instead);\n- submit false identity documents or someone else's documents;\n- interfere with the security or availability of the service;\n- use the service for any unlawful purpose.",
      },
      {
        heading: "Virtual balances and results",
        text: "We may reset, correct or adjust virtual balances, orders and positions at any time, for example to fix errors, reverse the effect of misuse or change practice settings. Trades settle using third-party market data recorded at the relevant time. If data is missing, delayed or wrong, results may be recalculated.",
      },
      {
        heading: "Market data",
        text: "Prices and charts come from third-party providers, including Binance public market data. We do not guarantee that market data is accurate, complete, timely or continuously available.",
      },
      {
        heading: "Identity verification",
        text: "Some features may require identity verification. By submitting information and documents you confirm they are genuine and belong to you. We may approve or reject a submission at our discretion.",
      },
      {
        heading: "Leaderboard",
        text: "If you are identity-verified and meet the activity threshold, your settled practice results may be ranked publicly. On the leaderboard you appear only by a masked version of your email address.",
      },
      {
        heading: "Suspension and termination",
        text: "We may suspend or close accounts that break these terms, pose a security risk or are inactive, and we may change or discontinue any part of the service. You can ask us to close your account at any time by contacting {supportEmail}.",
      },
      {
        heading: "Intellectual property",
        text: "The service, its software, design and content belong to us or our licensors. You receive a limited, personal, non-transferable right to use the service under these terms.",
      },
      {
        heading: "No warranties",
        text: "The service is provided \"as is\" and \"as available\", for educational and entertainment purposes. To the fullest extent permitted by law, we disclaim all warranties, express or implied.",
      },
      {
        heading: "Limitation of liability",
        text: "To the fullest extent permitted by law, we are not liable for any indirect or consequential loss, or for any decision you make, including trading decisions made with real funds elsewhere, based on your use of {siteName}. Our total liability for any claim is limited to [amount]. Nothing in these terms limits liability that cannot be limited by law.",
      },
      {
        heading: "Changes to these terms",
        text: "We may update these terms. We will change the \"last updated\" date above and, for material changes, notify you in the service. If you keep using {siteName} after a change takes effect, you accept the updated terms.",
      },
      {
        heading: "Governing law",
        text: "These terms are governed by the laws of [jurisdiction]. The courts of [jurisdiction] have exclusive jurisdiction over any dispute, subject to any mandatory consumer rights you have where you live.",
      },
      {
        heading: "Contact",
        text: "Questions about these terms: {supportEmail}.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "2026-09-16",
    sections: [
      {
        heading: "Who we are",
        text: "[Company legal name], [registered address], is the controller of the personal data processed through {siteName}. Contact us about privacy at {supportEmail}. [If applicable: our data protection officer or EU/UK representative is ...]",
      },
      {
        heading: "Data we collect",
        text: "- Account data: email address, name, and a securely hashed password and withdrawal PIN.\n- Verification data: full legal name, country, city, ID number, and images or PDFs of your identity document.\n- Activity data: practice balances, orders, positions, transaction records, and support ticket messages.\n- Technical data: IP address, browser and device information for signed-in sessions, and security and rate-limit records.\n- Preferences saved in your browser's local storage, such as display settings.",
      },
      {
        heading: "How we use it",
        text: "- To create and run your account and settle practice trades.\n- To verify identity, prevent fraud and multiple accounts, and keep the service secure.\n- To send service emails such as verification and password reset codes.\n- To answer support requests.\n- To show masked leaderboard rankings.\n- To comply with legal obligations.\nWe do not sell personal data or use it for advertising.",
      },
      {
        heading: "Legal bases",
        text: "[For users in the EU/UK: we rely on performance of our contract with you (account and service), legitimate interests (security, fraud prevention, improving the service), legal obligation where applicable, and consent where we ask for it. Lawyer to confirm.]",
      },
      {
        heading: "Who we share it with",
        text: "We use service providers that process data on our behalf:\n- hosting: [hosting provider, e.g. Vercel];\n- database: [database provider, e.g. MongoDB Atlas];\n- identity document storage: Cloudinary;\n- email delivery: Resend.\nWhile you view market data, your browser connects directly to Binance's public data service, so Binance receives your IP address under its own privacy policy. We may also disclose data where required by law.",
      },
      {
        heading: "Identity documents",
        text: "Verification documents are stored privately. Only authorised administrators can view them, through short-lived links, and access to client data is recorded in an audit log. When you replace a document or your account is deleted, the stored files are removed.",
      },
      {
        heading: "International transfers",
        text: "Our providers may process data outside your country. [Describe the safeguards, for example Standard Contractual Clauses. Lawyer to confirm.]",
      },
      {
        heading: "How long we keep data",
        text: "We keep account and activity data while your account is open. After closure we delete it, except where we must keep some records for [period] for security, fraud prevention or legal reasons. [Lawyer to confirm retention periods.]",
      },
      {
        heading: "Cookies and storage",
        text: "We use a strictly necessary session cookie to keep you signed in, and browser local storage for your preferences. We do not use advertising or third-party tracking cookies.",
      },
      {
        heading: "Your rights",
        text: "Depending on where you live, you may have the right to:\n- access, correct or delete your data;\n- object to or restrict processing;\n- receive your data in a portable format;\n- withdraw consent.\nTo exercise these rights, contact {supportEmail}. You may also complain to your local data protection authority.",
      },
      {
        heading: "Children",
        text: "{siteName} is not intended for anyone under 18, and we do not knowingly collect their data.",
      },
      {
        heading: "Changes",
        text: "We may update this policy and will change the \"last updated\" date above. We will tell you about material changes in the service.",
      },
    ],
  },
  risk: {
    title: "Risk Disclosure",
    updated: "2026-09-16",
    sections: [
      {
        heading: "A simulation, not the real market",
        text: "{siteName} uses virtual funds. Simulated orders fill at recorded market prices and ignore real-world factors such as liquidity, slippage, funding costs, outages and your own emotions when real money is at stake. Results on {siteName} do not predict results with real funds.",
      },
      {
        heading: "Leverage and liquidation",
        text: "Leverage multiplies both gains and losses. A small price move against a leveraged position can wipe out its entire margin, and the position will be liquidated. With real funds, leveraged products can cause rapid and substantial losses.",
      },
      {
        heading: "Timed trades",
        text: "Timed trades pay a fixed return if the price moves in your chosen direction and lose the entire stake if it does not. Outcomes depend on very small, short-term price movements. Real-money products of this kind are restricted or banned for retail clients in many jurisdictions, including the EU and the UK.",
      },
      {
        heading: "Crypto assets",
        text: "Crypto asset prices are highly volatile. They can fall sharply and quickly, may be affected by limited regulation, exchange failures and fraud, and can lose all of their value.",
      },
      {
        heading: "Rankings are not recommendations",
        text: "Leaderboard results show past practice performance only. They are not a recommendation to follow any trader or strategy, and past performance does not guarantee future results.",
      },
      {
        heading: "No advice",
        text: "Nothing on {siteName} is investment, financial, legal or tax advice. Consider your circumstances and seek advice from a licensed professional before trading real assets, and never trade money you cannot afford to lose.",
      },
    ],
  },
};
