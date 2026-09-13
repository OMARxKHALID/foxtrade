export const timedDurations = [
  { seconds: 30, payoutRate: 0.8, minAmount: 10 },
  { seconds: 60, payoutRate: 0.82, minAmount: 10 },
  { seconds: 120, payoutRate: 0.85, minAmount: 20 },
  { seconds: 300, payoutRate: 0.87, minAmount: 50 },
  { seconds: 900, payoutRate: 0.88, minAmount: 100 },
];

export const perpetualRules = {
  maxLeverage: 100,
  takerFeeRate: 0.0005,
  maintenanceMarginRate: 0.005,
};

export const formatDuration = (seconds) => (seconds < 60 ? `${seconds}s` : `${seconds / 60}m`);
