/**
 * Demo rows for the Budget Plan table widget on Executive Summary.
 * Values mirror the product reference layout (prototype only).
 */

export type BudgetPlanRow = {
  id: string;
  category: string;
  goal: string | null;
  value: number | null;
  actual: number | null;
  currentBudget: number | null;
  plannedTillDate: number | null;
  actualSpendTillDate: number | null;
};

/** Matches the product table: $1.13M, $438.11K, $5.63K, $0 */
export function formatPlanUsd(value: number | null): string {
  if (value === null) return "NA";
  if (value === 0) return "$0";
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

export function formatPlanMetric(value: number | null): string {
  if (value === null) return "NA";
  return value.toFixed(2);
}

/** Sticky rollup row — not included in paginated count. */
export const BUDGET_PLAN_TOTAL_ROW: BudgetPlanRow = {
  id: "bp-total",
  category: "Consolidated Total",
  goal: null,
  value: null,
  actual: null,
  currentBudget: 1_130_000,
  plannedTillDate: 438_110,
  actualSpendTillDate: 396_350,
};

const FIRST_PAGE_SEED: Omit<BudgetPlanRow, "id">[] = [
  {
    category: "17 x 24 disposable underpads",
    goal: "iRoAS",
    value: 4,
    actual: 1.33,
    currentBudget: 21_120,
    plannedTillDate: 8_160,
    actualSpendTillDate: 4_540,
  },
  {
    category: "23 x 36 disposable underpads dc",
    goal: "iRoAS",
    value: 4,
    actual: 1.54,
    currentBudget: 5_630,
    plannedTillDate: 2_170,
    actualSpendTillDate: 3_850,
  },
  {
    category: "adult diapers",
    goal: "iRoAS",
    value: 3.5,
    actual: 1.12,
    currentBudget: 48_200,
    plannedTillDate: 18_640,
    actualSpendTillDate: 16_910,
  },
  {
    category: "baby wipes multipack",
    goal: "iRoAS",
    value: 4,
    actual: 2.08,
    currentBudget: 12_450,
    plannedTillDate: 4_810,
    actualSpendTillDate: 5_220,
  },
  {
    category: "bed pads absorbent",
    goal: "iRoAS",
    value: 3.75,
    actual: 0.94,
    currentBudget: 9_880,
    plannedTillDate: 3_820,
    actualSpendTillDate: 2_110,
  },
  {
    category: "briefs - overnight",
    goal: "iRoAS",
    value: 4,
    actual: 1.67,
    currentBudget: 33_400,
    plannedTillDate: 12_910,
    actualSpendTillDate: 11_050,
  },
  {
    category: "catheter supplies bundle",
    goal: "iRoAS",
    value: 3.25,
    actual: null,
    currentBudget: 7_200,
    plannedTillDate: 2_780,
    actualSpendTillDate: 0,
  },
  {
    category: "gloves nitrile exam",
    goal: "iRoAS",
    value: 4,
    actual: 2.41,
    currentBudget: 15_670,
    plannedTillDate: 6_050,
    actualSpendTillDate: 6_480,
  },
  {
    category: "incontinence pads max",
    goal: "iRoAS",
    value: 4,
    actual: 1.19,
    currentBudget: 27_900,
    plannedTillDate: 10_780,
    actualSpendTillDate: 8_340,
  },
  {
    category: "washable underpads",
    goal: "iRoAS",
    value: 3.5,
    actual: 1.88,
    currentBudget: 4_150,
    plannedTillDate: 1_600,
    actualSpendTillDate: 1_920,
  },
];

const EXTRA_CATEGORY_NAMES = [
  "training pants toddler",
  "pull-ups overnight",
  "swabs sterile cotton",
  "mask surgical disposable",
  "gauze pads sterile",
  "bandage adhesive assortment",
  "ointment barrier cream",
  "wipes disinfectant",
  "syringe oral disposable",
  "thermometer digital",
];

/** Paginated category count in the product reference. */
export const BUDGET_PLAN_TOTAL_COUNT = 373;

export const BUDGET_PLAN_PAGE_SIZE = 10;

export const BUDGET_PLAN_DATE_LABEL = "Current Month (Aug 01 - Aug 12, 2026)";

function buildCategoryRows(): BudgetPlanRow[] {
  const rows: BudgetPlanRow[] = FIRST_PAGE_SEED.map((row, index) => ({
    ...row,
    id: `bp-${index + 1}`,
  }));

  let i = rows.length;
  while (i < BUDGET_PLAN_TOTAL_COUNT) {
    const name =
      EXTRA_CATEGORY_NAMES[i % EXTRA_CATEGORY_NAMES.length] ?? `category ${i}`;
    const seed = (i * 17) % 97;
    rows.push({
      id: `bp-${i + 1}`,
      category: `${name} ${Math.floor(i / EXTRA_CATEGORY_NAMES.length) + 1}`,
      goal: "iRoAS",
      value: 3 + (seed % 10) / 10,
      actual:
        seed % 7 === 0 ? null : Number((0.8 + (seed % 20) / 10).toFixed(2)),
      currentBudget: 2_000 + seed * 180,
      plannedTillDate: 800 + seed * 70,
      actualSpendTillDate: seed % 5 === 0 ? 0 : 600 + seed * 55,
    });
    i += 1;
  }

  return rows;
}

export const BUDGET_PLAN_ROWS = buildCategoryRows();

export function getBudgetPlanPage(
  page: number,
  pageSize: number = BUDGET_PLAN_PAGE_SIZE,
): BudgetPlanRow[] {
  const start = (page - 1) * pageSize;
  return BUDGET_PLAN_ROWS.slice(start, start + pageSize);
}
