"use client";

import { BudgetPacingCard } from "@/components/home/budget-pacing-card";
import { BudgetPlanCard } from "@/components/home/budget-plan-card";
import { DeferredWidget } from "@/components/home/deferred-widget";
import { PerformanceOverview } from "@/components/home/performance-overview";
import { ProjectedSpendUtilisationCard } from "@/components/home/projected-spend-utilisation-card";
import { WidgetSkeleton } from "@/components/home/widget-skeleton";
import type { DashboardFilters } from "@/lib/home/dashboard-filters";
import type { PacingInstance } from "@/lib/home/pacing-instance";

type ExecutiveSummaryTabProps = {
  instance: PacingInstance;
  filters: DashboardFilters;
  filterKey: string;
};

/** Executive Summary: Ally brief → spend/utilisation → Budget Pacing → Budget Plan. */
export function ExecutiveSummaryTab({
  instance,
  filters,
  filterKey,
}: ExecutiveSummaryTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <PerformanceOverview instance={instance} filterKey={filterKey} />

      <DeferredWidget
        key={`spend-util-${filterKey}`}
        delayMs={450}
        skeleton={<WidgetSkeleton rows={4} className="min-h-[160px]" />}
      >
        <ProjectedSpendUtilisationCard instance={instance} />
      </DeferredWidget>

      <DeferredWidget
        key={`chart-${filterKey}`}
        delayMs={700}
        skeleton={<WidgetSkeleton rows={8} className="min-h-[360px]" />}
      >
        <BudgetPacingCard instance={instance} filters={filters} />
      </DeferredWidget>

      <DeferredWidget
        key={`plan-${filterKey}`}
        delayMs={900}
        skeleton={<WidgetSkeleton rows={10} className="min-h-[420px]" />}
      >
        <BudgetPlanCard />
      </DeferredWidget>
    </div>
  );
}
