/** Demo metrics for the home page Budget Pacing widget. */
export const BUDGET_PACING_SUMMARY = {
  currentBudget: "$1.19M",
  actualSpend: "$1.01M",
  spendDelta: "-20.37%",
  dateRange: "Jul 01, 2026 - Jul 28, 2026",
  lastRefreshed: "Jul 28, 2026",
  dimensionLabel: "BUDGET CATEGORY - CIQ",
} as const;

/** Daily spend points for Jul 1–28, 2026 (prototype mock). */
export const BUDGET_PACING_CHART_DATA = [
  { date: "01 Jul", spend: 18200 },
  { date: "02 Jul", spend: 21400 },
  { date: "03 Jul", spend: 19800 },
  { date: "04 Jul", spend: 24100 },
  { date: "05 Jul", spend: 26800 },
  { date: "06 Jul", spend: 25200 },
  { date: "07 Jul", spend: 28900 },
  { date: "08 Jul", spend: 30500 },
  { date: "09 Jul", spend: 29100 },
  { date: "10 Jul", spend: 32800 },
  { date: "11 Jul", spend: 34600 },
  { date: "12 Jul", spend: 33100 },
  { date: "13 Jul", spend: 36200 },
  { date: "14 Jul", spend: 37800 },
  { date: "15 Jul", spend: 40100 },
  { date: "16 Jul", spend: 38900 },
  { date: "17 Jul", spend: 41200 },
  { date: "18 Jul", spend: 42800 },
  { date: "19 Jul", spend: 44500 },
  { date: "20 Jul", spend: 43100 },
  { date: "21 Jul", spend: 45800 },
  { date: "22 Jul", spend: 47200 },
  { date: "23 Jul", spend: 46100 },
  { date: "24 Jul", spend: 48900 },
  { date: "25 Jul", spend: 50200 },
  { date: "26 Jul", spend: 49100 },
  { date: "27 Jul", spend: 51400 },
  { date: "28 Jul", spend: 49800 },
] as const;

export function formatSpendAxis(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${value}`;
}
