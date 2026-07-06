import { format } from "date-fns";

export type DailyBudgetEntry = {
  date: Date;
  amount: number;
};

export type BudgetDistributionTier = "low" | "medium" | "high";

export type BudgetDistributionRange = {
  min: number;
  max: number;
};

/** Maps a budget table month index (0 = Jan '26) to the first day of that month. */
export function budgetMonthIndexToDate(monthIndex: number): Date {
  return new Date(2026, monthIndex, 1);
}

function dayWeight(year: number, month: number, day: number): number {
  const dayOfWeek = new Date(year, month, day).getDay();
  const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.18 : 1;
  const midMonthPeak = 1 + 0.22 * Math.sin((day / 31) * Math.PI);
  const ripple = 1 + 0.14 * Math.sin(day * 1.65) * Math.cos(day * 0.41);
  return weekendBoost * midMonthPeak * ripple;
}

/** Splits a monthly budget across days with flight-price-style variation. */
export function buildDailyBudgetDistribution(
  monthlyBudget: number,
  year: number,
  month: number,
): DailyBudgetEntry[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (monthlyBudget <= 0) {
    return Array.from({ length: daysInMonth }, (_, index) => ({
      date: new Date(year, month, index + 1),
      amount: 0,
    }));
  }

  const weights = Array.from({ length: daysInMonth }, (_, index) =>
    dayWeight(year, month, index + 1),
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const entries = weights.map((weight, index) => ({
    date: new Date(year, month, index + 1),
    amount: Math.round((monthlyBudget * weight) / totalWeight),
  }));

  const allocated = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainder = monthlyBudget - allocated;
  if (remainder !== 0 && entries.length > 0) {
    entries[entries.length - 1].amount += remainder;
  }

  return entries;
}

export function getDailyBudgetAmountMap(
  entries: DailyBudgetEntry[],
): Map<string, number> {
  return new Map(
    entries.map((entry) => [format(entry.date, "yyyy-MM-dd"), entry.amount]),
  );
}

export function getBudgetDistributionRange(
  entries: DailyBudgetEntry[],
): BudgetDistributionRange {
  const amounts = entries
    .map((entry) => entry.amount)
    .filter((amount) => amount > 0);

  if (amounts.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
  };
}

/** Lower daily spend = green, mid = amber, higher = red (flight-price style). */
export function getBudgetDistributionTier(
  amount: number,
  range: BudgetDistributionRange,
): BudgetDistributionTier {
  if (range.max <= range.min) return "medium";

  const normalized = (amount - range.min) / (range.max - range.min);
  if (normalized <= 0.33) return "low";
  if (normalized <= 0.66) return "medium";
  return "high";
}

export function formatCompactDailyBudget(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 10_000) {
    return `$${Math.round(amount / 1_000)}k`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`;
  }
  return `$${amount}`;
}

/** Full dollar amount for calendar cells — always readable at a glance. */
export function formatDailyBudgetForCell(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type BudgetDistributionTierStyles = {
  cell: string;
  budget: string;
};

export const BUDGET_DISTRIBUTION_TIER_STYLES: Record<
  BudgetDistributionTier,
  BudgetDistributionTierStyles
> = {
  low: {
    cell: "bg-emerald-50 hover:bg-emerald-100/60",
    budget: "text-emerald-600",
  },
  medium: {
    cell: "bg-amber-50 hover:bg-amber-100/60",
    budget: "text-amber-600",
  },
  high: {
    cell: "bg-red-50 hover:bg-red-100/60",
    budget: "text-red-600",
  },
};

/** @deprecated Use BUDGET_DISTRIBUTION_TIER_STYLES instead */
export const BUDGET_DISTRIBUTION_TIER_CLASSES: Record<
  BudgetDistributionTier,
  string
> = {
  low: BUDGET_DISTRIBUTION_TIER_STYLES.low.cell,
  medium: BUDGET_DISTRIBUTION_TIER_STYLES.medium.cell,
  high: BUDGET_DISTRIBUTION_TIER_STYLES.high.cell,
};
