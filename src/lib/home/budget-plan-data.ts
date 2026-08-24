/**
 * Demo rows for the Budget Plan table on Analytics.
 * Layout matches the Level 1 / Level 2 pacing reference (prototype only).
 */

export type BudgetPlanLeafRow = {
  id: string;
  level2: string;
  /** Full-month allocated budget (product “Current Budget” column). */
  currentBudget: number;
  plannedMtd: number;
  actualMtd: number;
  goalMetric: string;
  goalValue: number;
  actualMetricValue: number;
  budgetOpt: string;
  bidOpt: string;
  /** Spend-weighted % time in budget; null shows as — */
  percentTimeInBudget: number | null;
};

export type BudgetPlanGroup = {
  level1: string;
  rows: BudgetPlanLeafRow[];
};

/**
 * Sticky rollup — same as product Budget Plan:
 * Consolidated Total | NA | NA | NA | $1.13M | $438.11K | $396.35K …
 */
export const BUDGET_PLAN_TOTAL_ROW = {
  id: "bp-total",
  label: "Consolidated Total",
  currentBudget: 1_130_000,
  plannedMtd: 438_110,
  actualMtd: 396_350,
} as const;

/** Matches the product table: $1.13M, $438.11K, $278.98k */
export function formatPlanUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Groups shown in Budget Plan — values tuned to the product screenshot
 * so pacing % and iROAS colors match the reference.
 */
export const BUDGET_PLAN_GROUPS: BudgetPlanGroup[] = [
  {
    level1: "veterinary supplements",
    rows: [
      {
        id: "bp-vs-1",
        level2: "dog - ppvs - fortiflora",
        currentBudget: 368_013,
        plannedMtd: 278_980,
        actualMtd: 217_350,
        goalMetric: "iROAS",
        goalValue: 0.9,
        actualMetricValue: 0.76,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-vs-2",
        level2: "dog - ppvs - fortiflora soft chews",
        currentBudget: 686,
        plannedMtd: 520,
        actualMtd: 450,
        goalMetric: "iROAS",
        goalValue: 1.75,
        actualMetricValue: 1.21,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-vs-3",
        level2: "dog - puppy food",
        currentBudget: 1_187,
        plannedMtd: 900,
        actualMtd: 983,
        goalMetric: "iROAS",
        goalValue: 1.0,
        actualMetricValue: 1.82,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-vs-4",
        level2: "cat - ppvs - fortiflora soft chews",
        // ~97.1% → On Plan (97–102% band)
        currentBudget: 726,
        plannedMtd: 550,
        actualMtd: 534,
        goalMetric: "iROAS",
        goalValue: 1.5,
        actualMetricValue: 1.16,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
    ],
  },
  {
    level1: "dry dog",
    rows: [
      {
        id: "bp-dd-1",
        level2: "pro plan",
        currentBudget: 363_581,
        plannedMtd: 275_620,
        actualMtd: 261_600,
        goalMetric: "iROAS",
        goalValue: 1.75,
        actualMetricValue: 2.06,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-dd-2",
        level2: "beyond",
        currentBudget: 51_565,
        plannedMtd: 39_090,
        actualMtd: 33_260,
        goalMetric: "iROAS",
        goalValue: 1.0,
        actualMetricValue: 0.81,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-dd-3",
        level2: "one",
        currentBudget: 30_485,
        plannedMtd: 23_110,
        actualMtd: 17_990,
        goalMetric: "iROAS",
        goalValue: 1.0,
        actualMetricValue: 1.24,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-dd-4",
        level2: "true instinct",
        currentBudget: 16_648,
        plannedMtd: 12_620,
        actualMtd: 7_430,
        goalMetric: "iROAS",
        goalValue: 0.8,
        actualMetricValue: 0.78,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
    ],
  },
  {
    level1: "wet cat",
    rows: [
      {
        id: "bp-wc-1",
        level2: "fancy feast food",
        currentBudget: 157_782,
        plannedMtd: 119_610,
        actualMtd: 117_990,
        goalMetric: "iROAS",
        goalValue: 3.0,
        actualMetricValue: 5.41,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-wc-2",
        level2: "fancy feast appetizers",
        // ~98.0% → On Plan
        currentBudget: 83_805,
        plannedMtd: 63_530,
        actualMtd: 62_260,
        goalMetric: "iROAS",
        goalValue: 3.0,
        actualMetricValue: 3.12,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-wc-3",
        level2: "friskies",
        currentBudget: 42_898,
        plannedMtd: 32_520,
        actualMtd: 32_080,
        goalMetric: "iROAS",
        goalValue: 2.0,
        actualMetricValue: 2.97,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-wc-4",
        level2: "fancy feast broths",
        // ~98.0% → On Plan
        currentBudget: 7_585,
        plannedMtd: 5_750,
        actualMtd: 5_635,
        goalMetric: "iROAS",
        goalValue: 1.5,
        actualMetricValue: 1.64,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
      {
        id: "bp-wc-5",
        level2: "gourmet",
        // ~97.9% → On Plan
        currentBudget: 5_039,
        plannedMtd: 3_820,
        actualMtd: 3_740,
        goalMetric: "iROAS",
        goalValue: 1.0,
        actualMetricValue: 2.56,
        budgetOpt: "Ally AI",
        bidOpt: "Ally AI",
        percentTimeInBudget: null,
      },
    ],
  },
];

export type { PeriodDatePresetId as BudgetPlanDatePresetId } from "@/lib/home/period-date-presets";
export { PERIOD_DATE_PRESETS as BUDGET_PLAN_DATE_PRESETS } from "@/lib/home/period-date-presets";

/** Flat leaf row with its Level 1 parent — used for pagination. */
export type BudgetPlanFlatRow = BudgetPlanLeafRow & { level1: string };

export const BUDGET_PLAN_PAGE_SIZE = 10;

/** Flatten Level 1 groups into a single list (Consolidated Total is not included). */
export function flattenBudgetPlanRows(
  groups: BudgetPlanGroup[] = BUDGET_PLAN_GROUPS,
): BudgetPlanFlatRow[] {
  return groups.flatMap((group) =>
    group.rows.map((row) => ({ ...row, level1: group.level1 })),
  );
}

export const BUDGET_PLAN_FLAT_ROWS = flattenBudgetPlanRows();
export const BUDGET_PLAN_TOTAL_COUNT = BUDGET_PLAN_FLAT_ROWS.length;

/**
 * Slice flat rows for a page, then rebuild Level 1 groups so banners
 * only show for categories that appear on this page.
 */
export function getBudgetPlanPageGroups(
  page: number,
  pageSize: number = BUDGET_PLAN_PAGE_SIZE,
): BudgetPlanGroup[] {
  const start = (page - 1) * pageSize;
  const slice = BUDGET_PLAN_FLAT_ROWS.slice(start, start + pageSize);
  const map = new Map<string, BudgetPlanLeafRow[]>();

  for (const row of slice) {
    const { level1, ...leaf } = row;
    const list = map.get(level1) ?? [];
    list.push(leaf);
    map.set(level1, list);
  }

  return Array.from(map.entries()).map(([level1, rows]) => ({ level1, rows }));
}
