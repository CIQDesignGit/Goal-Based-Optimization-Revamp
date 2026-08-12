/**
 * Demo metrics for the home page Budget Pacing widget.
 * Derived from the canonical pacing instance so cards / table / chart agree.
 */

import {
  formatUsd,
  PACING_INSTANCE,
  sumActualMtd,
  sumPlannedMtd,
  type PacingInstance,
} from "@/lib/home/pacing-instance";
import { formatPacingPercent, ratioToPercent } from "@/lib/home/pacing-status";

/** Build widget summary strings from a (possibly filtered) instance. */
export function buildBudgetPacingSummary(instance: PacingInstance) {
  const plannedMtd = sumPlannedMtd(instance.rows);
  const actualMtd = sumActualMtd(instance.rows);
  // Prefer monthly plan for "Current Budget" when present.
  const currentBudget =
    instance.plannedMonthlyBudget > 0
      ? instance.plannedMonthlyBudget
      : plannedMtd;
  const deltaPct = ratioToPercent(actualMtd - plannedMtd, plannedMtd);
  const utilizationPct = ratioToPercent(actualMtd, plannedMtd);

  return {
    currentBudget: formatUsd(currentBudget),
    plannedBudgetTillDate: formatUsd(plannedMtd),
    actualSpend: formatUsd(actualMtd),
    spendDelta:
      deltaPct === null
        ? undefined
        : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%`,
    utilization:
      utilizationPct === null ? "—" : formatPacingPercent(utilizationPct),
    lastRefreshed: instance.lastRefreshed,
    dimensionLabel: instance.dimensionLabel,
  } as const;
}

/** @deprecated Prefer buildBudgetPacingSummary(instance) — kept for defaults. */
export const BUDGET_PACING_SUMMARY = buildBudgetPacingSummary(PACING_INSTANCE);

/** Daily spend points from the canonical instance. */
export const BUDGET_PACING_CHART_DATA = PACING_INSTANCE.chartData;

export function formatSpendAxis(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${value}`;
}

export function getChartData(instance: PacingInstance) {
  return instance.chartData;
}

/** Prior comparison window label (same length as current filter range). */
export function formatComparisonDateRange(
  dateFrom: string,
  dateTo: string,
): string {
  const from = parseIso(dateFrom);
  const to = parseIso(dateTo);
  if (!from || !to) return "";
  const days = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1,
  );
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  return `vs. ${formatShortDate(prevFrom)} - ${formatShortDate(prevTo)}`;
}

function parseIso(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatShortDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
}
