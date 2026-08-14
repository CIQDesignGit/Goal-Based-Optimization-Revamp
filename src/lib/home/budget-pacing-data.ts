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
  const utilizationPct = ratioToPercent(actualMtd, plannedMtd);

  // Previous-period comparison (prototype): same-length window before current.
  // Scaled from current metrics so every tile can show a vs-compare delta.
  const prevCurrentBudget = currentBudget * 0.976;
  const prevPlannedMtd = plannedMtd * 0.942;
  const prevActualMtd = actualMtd / 0.796; // ~-20.4% vs prior spend
  const prevUtilizationPct = ratioToPercent(prevActualMtd, prevPlannedMtd);

  return {
    currentBudget: formatUsd(currentBudget),
    plannedBudgetTillDate: formatUsd(plannedMtd),
    actualSpend: formatUsd(actualMtd),
    utilization:
      utilizationPct === null ? "—" : formatPacingPercent(utilizationPct),
    currentBudgetDelta: formatCompareDelta(
      ratioToPercent(currentBudget - prevCurrentBudget, prevCurrentBudget),
    ),
    plannedDelta: formatCompareDelta(
      ratioToPercent(plannedMtd - prevPlannedMtd, prevPlannedMtd),
    ),
    spendDelta: formatCompareDelta(
      ratioToPercent(actualMtd - prevActualMtd, prevActualMtd),
    ),
    utilizationDelta: formatCompareDelta(
      utilizationPct === null || prevUtilizationPct === null
        ? null
        : utilizationPct - prevUtilizationPct,
    ),
    lastRefreshed: instance.lastRefreshed,
    dimensionLabel: instance.dimensionLabel,
  } as const;
}

/** Signed percent for tile comparison chips, e.g. "+5.12%" or "-20.40%". */
function formatCompareDelta(pct: number | null): string | undefined {
  if (pct === null || Number.isNaN(pct)) return undefined;
  const rounded = Number(pct.toFixed(2));
  if (rounded === 0) return "0.00%";
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(2)}%`;
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
