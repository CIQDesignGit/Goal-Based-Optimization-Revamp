import {
  BUDGET_MONTHS,
  type SeasonalityBudgetMode,
} from "@/lib/gbo-optimization/setup-data";
import type { GoalsRowState } from "@/lib/gbo-optimization/setup-session-store";

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) {
    return 0;
  }

  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Maps a display date (e.g. "Oct 29, 2026") to a BUDGET_MONTHS index. */
export function getBudgetMonthIndexFromSeasonalityDate(
  dateStr: string,
): number | null {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  if (year !== 2026) {
    return null;
  }

  return date.getMonth();
}

export function getEntireBusinessMonthlyBudget(
  monthIndex: number,
  goalsRowState: Record<string, GoalsRowState>,
): number {
  const row = goalsRowState["entire-business"];
  if (!row || monthIndex < 0 || monthIndex >= row.monthlyBudgets.length) {
    return 0;
  }

  return parseCurrency(row.monthlyBudgets[monthIndex] ?? "");
}

export function getSeasonalityBudgetContextLabel(
  startDate: string,
  budgetMode: SeasonalityBudgetMode,
  goalsRowState: Record<string, GoalsRowState>,
): string {
  const monthIndex = getBudgetMonthIndexFromSeasonalityDate(startDate);

  if (monthIndex === null || monthIndex < 0 || monthIndex >= BUDGET_MONTHS.length) {
    return budgetMode === "percent"
      ? "Select a start date to see available budget"
      : "Absolute adjustment for the event period";
  }

  const monthLabel = BUDGET_MONTHS[monthIndex];
  const available = getEntireBusinessMonthlyBudget(monthIndex, goalsRowState);
  const formattedBudget = available > 0 ? formatCurrency(available) : null;

  if (budgetMode === "absolute") {
    return formattedBudget
      ? `${monthLabel} budget · ${formattedBudget} available`
      : `${monthLabel} budget`;
  }

  return formattedBudget
    ? `of ${monthLabel} budget · ${formattedBudget}`
    : `of ${monthLabel} budget`;
}
