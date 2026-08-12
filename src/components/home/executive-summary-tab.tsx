"use client";

import { BudgetPacingCard } from "@/components/home/budget-pacing-card";
import { DeferredWidget } from "@/components/home/deferred-widget";
import { PerformanceOverview } from "@/components/home/performance-overview";
import { WidgetSkeleton } from "@/components/home/widget-skeleton";
import type { DashboardFilters } from "@/lib/home/dashboard-filters";
import type { PacingInstance } from "@/lib/home/pacing-instance";

type ExecutiveSummaryTabProps = {
  instance: PacingInstance;
  filters: DashboardFilters;
  filterKey: string;
};

/** Executive Summary tab: Performance Overview + existing Budget Pacing widget. */
export function ExecutiveSummaryTab({
  instance,
  filters,
  filterKey,
}: ExecutiveSummaryTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <PerformanceOverview instance={instance} filterKey={filterKey} />

      <DeferredWidget
        key={`chart-${filterKey}`}
        delayMs={700}
        skeleton={<WidgetSkeleton rows={8} className="min-h-[360px]" />}
      >
        <BudgetPacingCard instance={instance} filters={filters} />
      </DeferredWidget>
    </div>
  );
}
