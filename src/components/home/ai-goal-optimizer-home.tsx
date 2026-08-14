"use client";

import { useMemo } from "react";

import { AiGoalOptimizerHeader } from "@/components/home/ai-goal-optimizer-header";
import { DashboardTabs } from "@/components/home/dashboard-tabs";
import { ExecutiveSummaryTab } from "@/components/home/executive-summary-tab";
import { PacingTab } from "@/components/home/pacing-tab";
import { filterPacingInstance } from "@/lib/home/filter-pacing-instance";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";

/** Landing page — Budget Pacing Dashboard (Executive Summary + Pacing). */
export function AiGoalOptimizerHome() {
  const tab = usePacingDashboardStore((s) => s.tab);
  const filters = usePacingDashboardStore((s) => s.filters);

  const filtered = useMemo(() => filterPacingInstance(filters), [filters]);

  const filterKey = useMemo(
    () =>
      [
        filters.retailer,
        filters.brandId,
        filters.dateFrom,
        filters.dateTo,
        filters.attributionWindow,
      ].join("|"),
    [filters],
  );

  return (
    <div className="flex min-h-full w-full flex-col bg-slate-50/80">
      <AiGoalOptimizerHeader />
      <DashboardTabs />

      <div className="flex flex-1 flex-col p-6 pt-4">
        {filtered.status === "unsupported" ? (
          <EmptyState
            title="GBO not supported for this retailer"
            body="Budget pacing insights are unavailable for the selected retailer."
          />
        ) : null}

        {filtered.status === "not-live" ? (
          <EmptyState
            title="GBO strategy not live yet"
            body="Set up and launch Goal Based Optimization to see pacing for this account."
          />
        ) : null}

        {filtered.status === "empty" ? (
          <EmptyState
            title="No pacing data for these filters"
            body="Try another retailer or brand — nothing matches the current selection."
          />
        ) : null}

        {filtered.status === "ok" && tab === "executive-summary" ? (
          <ExecutiveSummaryTab
            instance={filtered.instance}
            filters={filters}
            filterKey={filterKey}
          />
        ) : null}

        {filtered.status === "ok" && tab === "pacing" ? (
          <PacingTab instance={filtered.instance} />
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-xs">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
