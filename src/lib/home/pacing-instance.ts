/**
 * Canonical mock instance for the Budget Pacing Dashboard.
 * Every Executive Summary number and Pacing A–E figure must come from here.
 */

import { CONSTRAINT_GAPS } from "@/lib/home/constraint-gaps-data";

export type OptimizerLever = "Ally AI" | "Rule Based" | "None";

export type PacingRow = {
  id: string;
  level1: string;
  level2: string;
  /** When true, this row rolls up children — utilisation is not the parent's own spend. */
  isRollup: boolean;
  plannedMtd: number;
  actualMtd: number;
  goalLabel: string;
  goalValue: number | null;
  goalMetric: string;
  /** Actual ROAS / iROAS (or other goal metric) for the period. */
  actualMetricValue: number | null;
  budgetOpt: OptimizerLever;
  bidOpt: OptimizerLever;
  /** Spend-weighted % of time in budget (0–100). */
  percentTimeInBudget: number | null;
  brandId: string;
};

export type ConstraintAlert = {
  id: string;
  alert: string;
  level1: string;
  level2: string;
  group: string;
  constraintType: string;
  constraintPercent: number;
  spendSharePercent: number;
  /** Absolute points off target (spendShare − constraint). */
  deviationPoints: number;
  /** Relative % of constraint ((spendShare − constraint) / constraint × 100). */
  deviationRelativePercent: number;
  plainLanguage: string;
  brandId: string;
};

export type PacingRecommendation = {
  id: string;
  action: string;
  /** Short line for Executive Summary AI Recommended Action. */
  summaryLine: string;
  lever: string;
  exactSettingChange: string;
  whyNow: string;
  expectedImpact: string;
  risk: string;
  howToMonitor: string;
};

export type Watchout = {
  id: string;
  title: string;
  detail: string;
};

export type ChangeDriver = {
  id: string;
  rank: number;
  title: string;
  detail: string;
};

export type ChartDayPoint = {
  date: string;
  spend: number;
};

export type PacingInstance = {
  accountName: string;
  retailer: string;
  dimensionLabel: string;
  lastRefreshed: string;
  /** ISO date of report as-of (prototype). */
  asOfDate: string;
  /** Account flags for empty states. */
  gboUnsupported: boolean;
  gboNotLive: boolean;
  /** When true, Sections C–E show "summary pending". */
  aiNarrativeUnavailable: boolean;
  plannedMonthlyBudget: number;
  /** Projected month-end spend from the filter window run-rate. */
  projectedMonthEndSpend: number;
  projectedSales: number;
  plannedSales: number;
  projectedGoalValue: number | null;
  plannedGoalValue: number | null;
  projectedGoalMetric: string;
  /** Manual override dollars (pilgrims-style example). */
  manualOverrideSpend: number;
  recommendedSpend: number;
  gboStats: {
    budgetChangeSuccessPercent: number;
    bidChangeSuccessPercent: number;
    recommendationCoveragePercent: number;
  };
  rows: PacingRow[];
  constraints: ConstraintAlert[];
  changeDrivers: ChangeDriver[];
  recommendations: PacingRecommendation[];
  watchouts: Watchout[];
  /** Section A narrative bullets under the pacing table. */
  sectionAInsights: string[];
  /** Section A “MTD vs previous month” trend bullets. */
  sectionATrends: { lead: string; detail: string }[];
  chartData: ChartDayPoint[];
};

/** Format dollars for UI (compact when ≥ 1M / 1K). */
export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

/** Format dollars with two decimals (for override / exact amounts). */
export function formatUsdExact(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function sumPlannedMtd(rows: PacingRow[]): number {
  return rows.filter((r) => !r.isRollup).reduce((s, r) => s + r.plannedMtd, 0);
}

export function sumActualMtd(rows: PacingRow[]): number {
  return rows.filter((r) => !r.isRollup).reduce((s, r) => s + r.actualMtd, 0);
}

/**
 * Full-account mock inspired by Budget Pacing Report examples (illustrative only).
 * Numbers are consistent across Executive Summary and Pacing tab.
 */
export const PACING_INSTANCE: PacingInstance = {
  accountName: "Pilgrims — Amazon",
  retailer: "Amazon",
  dimensionLabel: "BUDGET CATEGORY - CIQ",
  lastRefreshed: "Jul 28, 2026",
  asOfDate: "2026-07-28",
  gboUnsupported: false,
  gboNotLive: false,
  aiNarrativeUnavailable: false,
  plannedMonthlyBudget: 1_190_000,
  projectedMonthEndSpend: 1_120_000,
  projectedSales: 4_850_000,
  plannedSales: 5_100_000,
  projectedGoalValue: 3.8,
  plannedGoalValue: 4.0,
  projectedGoalMetric: "Brand iROAS",
  manualOverrideSpend: 231.31,
  recommendedSpend: 204.76,
  gboStats: {
    budgetChangeSuccessPercent: 94.2,
    bidChangeSuccessPercent: 91.5,
    recommendationCoveragePercent: 78.0,
  },
  rows: [
    {
      id: "rollup-account",
      level1: "Entire business",
      level2: "—",
      isRollup: true,
      plannedMtd: 1_010_000,
      actualMtd: 804_000,
      goalLabel: "Brand iROAS",
      goalValue: 4.0,
      goalMetric: "iROAS",
      actualMetricValue: 3.6,
      budgetOpt: "Ally AI",
      bidOpt: "Ally AI",
      percentTimeInBudget: 72.4,
      brandId: "all",
    },
    {
      id: "jbc-fresh",
      level1: "JBC Fresh",
      level2: "Sponsored Brands",
      isRollup: false,
      plannedMtd: 180_000,
      actualMtd: 98_400,
      goalLabel: "Brand iROAS",
      goalValue: 3.5,
      goalMetric: "iROAS",
      actualMetricValue: 2.9,
      budgetOpt: "Ally AI",
      bidOpt: "Ally AI",
      percentTimeInBudget: 41.2,
      brandId: "jbc-fresh",
    },
    {
      id: "jbc-sp",
      level1: "JBC Fresh",
      level2: "Sponsored Products",
      isRollup: false,
      plannedMtd: 220_000,
      actualMtd: 198_000,
      goalLabel: "Brand iROAS",
      goalValue: 4.2,
      goalMetric: "iROAS",
      actualMetricValue: 4.4,
      budgetOpt: "Ally AI",
      bidOpt: "Ally AI",
      percentTimeInBudget: 88.1,
      brandId: "jbc-fresh",
    },
    {
      id: "pilgrims-sb",
      level1: "Pilgrims Core",
      level2: "Sponsored Brands",
      isRollup: false,
      plannedMtd: 250_000,
      actualMtd: 268_000,
      goalLabel: "Brand iROAS",
      goalValue: 3.8,
      goalMetric: "iROAS",
      actualMetricValue: 2.9,
      budgetOpt: "Ally AI",
      bidOpt: "None",
      percentTimeInBudget: 96.5,
      brandId: "pilgrims-core",
    },
    {
      id: "pilgrims-sp",
      level1: "Pilgrims Core",
      level2: "Sponsored Products",
      isRollup: false,
      plannedMtd: 360_000,
      actualMtd: 239_600,
      goalLabel: "Brand iROAS",
      goalValue: 4.0,
      goalMetric: "iROAS",
      actualMetricValue: 4.1,
      budgetOpt: "Ally AI",
      bidOpt: "Ally AI",
      percentTimeInBudget: 64.8,
      brandId: "pilgrims-core",
    },
  ],
  constraints: CONSTRAINT_GAPS,
  changeDrivers: [
    {
      id: "d1",
      rank: 1,
      title: "JBC Fresh Sponsored Brands under-pacing",
      detail:
        "Actual MTD $98.4K vs planned $180.0K (54.7% pacing). The Sponsored Brands campaign-type constraint (30% target vs 8.4% spend share) is binding against underspending campaigns.",
    },
    {
      id: "d2",
      rank: 2,
      title: "Pilgrims Core brand efficiency below goal",
      detail:
        "Pilgrims Core Sponsored Brands iROAS is 2.9 vs goal 3.8 while pacing Ahead at 107.2%. Manual overrides ($231.31 vs Ally-recommended $204.76) are contributing to over-pacing without lifting efficiency.",
    },
    {
      id: "d3",
      rank: 3,
      title: "Pilgrims Core Sponsored Products behind plan",
      detail:
        "Actual MTD $239.6K vs planned $360.0K (66.6% pacing). % time in budget is 64.8% — campaigns are often out of budget before day-end.",
    },
    {
      id: "d4",
      rank: 4,
      title: "Targeting mix constraints misaligned on Pilgrims Core",
      detail:
        "Competitor targeting constraint of 30% but only 10.7% spend share; Generic at 70% vs 89.3% actual. The 19.3-point gaps on both sides amplify irregular pacing until constraints are realigned.",
    },
    {
      id: "d5",
      rank: 5,
      title: "GBO execution mostly healthy",
      detail:
        "Budget-change success is 94.2% and bid-change success is 91.5%; recommendation coverage is 78%, so gaps are visible in coverage % rather than hidden.",
    },
  ],
  recommendations: [
    {
      id: "r1",
      action:
        "Relax Generic vs Competitor targeting mix constraints for Pilgrims Core",
      summaryLine:
        "Realign Pilgrims Core Targeting Type mix — Competitor 30%→opportunity, Generic 70%→~80%.",
      lever: "Constraint settings – Targeting Type mix within GBO",
      exactSettingChange:
        "Reduce Competitor gap by lifting Competitor share toward observed opportunity, and ease Generic from 70% toward ~80% to narrow the gap vs current 89.3% spend share — without further increasing Generic above observed behavior.",
      whyNow:
        "Pilgrims Core shows 19.3-point deviations on both Competitor (30% vs 10.7%) and Generic (70% vs 89.3%). Sponsored Brands iROAS is 2.9 vs goal 3.8 while pacing is Ahead.",
      expectedImpact:
        "High – stabilizes spend mix and reduces constraint thrash so Ally AI can rebalance toward efficient inventory.",
      risk: "Medium – shifting mix may temporarily change brand/generic exposure; monitor iROAS and spend share for 5–7 days.",
      howToMonitor:
        "Track Targeting Type spend share, iROAS, and SPEND pacing for Pilgrims Core daily this week.",
    },
    {
      id: "r2",
      action: "Relax JBC Fresh Sponsored Brands campaign-type share",
      summaryLine:
        "Relax JBC Fresh Sponsored Brands campaign-type share — 30% → ~10–15%.",
      lever: "Constraint settings – Campaign Type share within GBO",
      exactSettingChange:
        "Lower Sponsored Brands max-share from 30% toward ~10–15% (or remove the binding cap) so underspending SB campaigns can unlock budget.",
      whyNow:
        "JBC Fresh SB pacing is 54.7% ($98.4K / $180.0K) with spend share only 8.4% vs a 30% constraint — GBO cannot push more volume into SB under the current cap.",
      expectedImpact:
        "High – unlocks underspending SB campaigns; estimated +$40–60K MTD spend if run-rate catches plan.",
      risk: "Medium – SB efficiency may dip if volume shifts to lower-iROAS placements; revert if iROAS falls below 3.2.",
      howToMonitor:
        "Watch JBC Fresh SB pacing % and Brand iROAS daily for 7 days.",
    },
    {
      id: "r3",
      action: "Cap Pilgrims Core SB manual overrides under Ally AI",
      summaryLine:
        "Cap Pilgrims Core SB manual overrides — ≤10% of Ally daily recommend ($231 vs $205).",
      lever: "Budget Optimization — Ally AI",
      exactSettingChange:
        "Prefer Ally-recommended budgets; limit overrides to ≤10% of daily recommended ($231 vs $205 on override days).",
      whyNow:
        "Manual overrides are inflating Pilgrims Core SB (Ahead at 107.2%) without closing the iROAS gap vs goal.",
      expectedImpact:
        "Medium – brings SB closer to the 97–102% On Plan band by month-end while protecting efficiency.",
      risk: "Low–Medium – short-term share loss on competitive ASIN clusters.",
      howToMonitor:
        "Compare override vs recommended daily in Action Logs (Manual actor) this week.",
    },
  ],
  watchouts: [
    {
      id: "w1",
      title: "ROI pressure on JBC Fresh Sponsored Brands",
      detail:
        "iROAS is 2.9 vs goal 3.5 while pacing is only 54.7%; aggressive constraint relaxation without monitoring could further erode efficiency.",
    },
    {
      id: "w2",
      title: "Pilgrims Core below goal on Sponsored Brands",
      detail:
        "iROAS is 2.9 vs a goal of 3.8 and pacing is Ahead — if this mix continues, blended profitability could decline even as spend stays high.",
    },
    {
      id: "w3",
      title: "Constraint-driven instability risk",
      detail:
        "The 19.3-point deviations between configured and actual spend shares for Competitor (30% vs 10.7%) and Generic (70% vs 89.3%) on Pilgrims Core may continue to cause irregular pacing until constraints are realigned.",
    },
    {
      id: "w4",
      title: "Next-month budget not entered",
      detail:
        "If August planned budget is blank by the 20th–25th, Ally AI may stop campaigns. Enter next-month budget before month-end.",
    },
  ],
  sectionAInsights: [
    "Total MTD ad spend across in-scope levels is $804.0K vs $1.01M planned (79.6% pacing).",
    "Most leaf levels are Behind plan (54.7%–90.0%); Pilgrims Core Sponsored Brands is Ahead at 107.2%.",
    "JBC Fresh Sponsored Products is On/near plan on efficiency (iROAS 4.4 vs goal 4.2) while Sponsored Brands lags both spend and iROAS.",
    "Pilgrims Core Sponsored Brands is over-pacing with weak iROAS (2.9 vs 3.8); Sponsored Products is under-pacing with healthy iROAS (4.1 vs 4.0).",
    "GBO execution: budget-change success 94.2%, bid-change success 91.5%, recommendation coverage 78%.",
  ],
  sectionATrends: [
    {
      lead: "Efficiency soft vs last comparable window",
      detail:
        "Account projected Brand iROAS is 3.8 vs planned 4.0; Pilgrims Core SB remains the largest drag on blended return.",
    },
    {
      lead: "Spend concentration shifting toward over-paced SB",
      detail:
        "Pilgrims Core Sponsored Brands is Ahead while JBC Fresh SB and Pilgrims Core SP remain Behind — mix risk if overrides continue.",
    },
  ],
  chartData: [
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
  ],
};
