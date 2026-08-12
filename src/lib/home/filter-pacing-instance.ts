import type { DashboardFilters } from "@/lib/home/dashboard-filters";
import {
  PACING_INSTANCE,
  sumActualMtd,
  sumPlannedMtd,
  type PacingInstance,
  type PacingRow,
} from "@/lib/home/pacing-instance";

export type FilteredPacingResult = {
  status: "ok" | "unsupported" | "not-live" | "empty";
  instance: PacingInstance;
};

/**
 * Apply dashboard filters to the canonical instance.
 * Prototype: brand filter scopes rows/constraints; retailer mismatch → empty.
 */
export function filterPacingInstance(
  filters: DashboardFilters,
  source: PacingInstance = PACING_INSTANCE,
): FilteredPacingResult {
  if (source.gboUnsupported) {
    return { status: "unsupported", instance: source };
  }
  if (source.gboNotLive) {
    return { status: "not-live", instance: source };
  }

  if (filters.retailer !== source.retailer) {
    return {
      status: "empty",
      instance: {
        ...source,
        rows: [],
        constraints: [],
        changeDrivers: [],
        recommendations: [],
        watchouts: [],
        sectionAInsights: [],
        sectionATrends: [],
        chartData: [],
        plannedMonthlyBudget: 0,
        projectedMonthEndSpend: 0,
        projectedSales: 0,
        plannedSales: 0,
        projectedGoalValue: null,
        plannedGoalValue: null,
      },
    };
  }

  if (filters.brandId === "all") {
    return { status: "ok", instance: source };
  }

  const scopedRows = source.rows.filter(
    (row) => row.brandId === filters.brandId || row.brandId === "all",
  );

  // Rebuild rollup from scoped leaf rows so parent % is not misread.
  const leafRows = scopedRows.filter((r) => !r.isRollup);
  const rollup = buildScopedRollup(source, leafRows, filters.brandId);

  const rows: PacingRow[] = rollup ? [rollup, ...leafRows] : leafRows;

  const planned = sumPlannedMtd(rows);
  const actual = sumActualMtd(rows);
  const scale =
    source.rows.filter((r) => !r.isRollup).length > 0
      ? planned /
        Math.max(
          sumPlannedMtd(source.rows),
          1,
        )
      : 1;

  const instance: PacingInstance = {
    ...source,
    rows,
    constraints: source.constraints.filter(
      (c) => c.brandId === filters.brandId,
    ),
    changeDrivers: source.changeDrivers.filter((d) =>
      d.detail.toLowerCase().includes(brandLabel(filters.brandId).toLowerCase()) ||
      filters.brandId === "all",
    ),
    recommendations: source.recommendations.filter((r) =>
      r.whyNow.toLowerCase().includes(brandLabel(filters.brandId).toLowerCase()) ||
      r.action.toLowerCase().includes(brandLabel(filters.brandId).toLowerCase()),
    ),
    // Scale projections proportionally for the brand slice (prototype).
    plannedMonthlyBudget: Math.round(source.plannedMonthlyBudget * scale),
    projectedMonthEndSpend: Math.round(source.projectedMonthEndSpend * scale),
    projectedSales: Math.round(source.projectedSales * scale),
    plannedSales: Math.round(source.plannedSales * scale),
    chartData: source.chartData.map((p) => ({
      ...p,
      spend: Math.round(p.spend * scale),
    })),
  };

  // Keep drivers/recs that mention the brand; if filter emptied narrative, fall back to scaled copy.
  if (instance.changeDrivers.length === 0 && leafRows.length > 0) {
    instance.changeDrivers = [
      {
        id: "scoped-driver",
        rank: 1,
        title: `${brandLabel(filters.brandId)} pacing vs plan`,
        detail: `Actual MTD ${formatCompact(actual)} vs planned ${formatCompact(planned)} (${formatPct(actual, planned)} pacing) for the selected brand.`,
      },
    ];
  }

  return { status: "ok", instance };
}

function brandLabel(brandId: string): string {
  if (brandId === "jbc-fresh") return "JBC Fresh";
  if (brandId === "pilgrims-core") return "Pilgrims Core";
  return "All brands";
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(actual: number, planned: number): string {
  if (planned === 0) return "n/a";
  return `${((actual / planned) * 100).toFixed(1)}%`;
}

function buildScopedRollup(
  source: PacingInstance,
  leafRows: PacingRow[],
  brandId: string,
): PacingRow | null {
  if (leafRows.length === 0) return null;
  const planned = leafRows.reduce((s, r) => s + r.plannedMtd, 0);
  const actual = leafRows.reduce((s, r) => s + r.actualMtd, 0);
  const avgTime =
    leafRows.reduce((s, r) => s + (r.percentTimeInBudget ?? 0), 0) /
    leafRows.length;

  const metricValues = leafRows
    .map((r) => r.actualMetricValue)
    .filter((v): v is number => v !== null);
  const avgMetric =
    metricValues.length > 0
      ? Math.round(
          (metricValues.reduce((s, v) => s + v, 0) / metricValues.length) * 10,
        ) / 10
      : null;

  return {
    id: `rollup-${brandId}`,
    level1: brandLabel(brandId),
    level2: "Rollup (children)",
    isRollup: true,
    plannedMtd: planned,
    actualMtd: actual,
    goalLabel: source.rows[0]?.goalLabel ?? "Brand iROAS",
    goalValue: source.rows[0]?.goalValue ?? null,
    goalMetric: source.rows[0]?.goalMetric ?? "iROAS",
    actualMetricValue: avgMetric,
    budgetOpt: "Ally AI",
    bidOpt: "Ally AI",
    percentTimeInBudget: Math.round(avgTime * 10) / 10,
    brandId,
  };
}
