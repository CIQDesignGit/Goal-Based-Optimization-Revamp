"use client";

import { BudgetPacingCard } from "@/components/home/budget-pacing-card";
import { BudgetPlanCard } from "@/components/home/budget-plan-card";
import { DeferredWidget } from "@/components/home/deferred-widget";
import { PacingSectionB } from "@/components/home/pacing-section-b";
import { ProjectedSpendUtilisationCard } from "@/components/home/projected-spend-utilisation-card";
import { WidgetSkeleton } from "@/components/home/widget-skeleton";
import type { DashboardFilters } from "@/lib/home/dashboard-filters";
import type { PacingInstance } from "@/lib/home/pacing-instance";

type ExecutiveSummaryTabProps = {
  instance: PacingInstance;
  filters: DashboardFilters;
  filterKey: string;
};

/** First tab: Budget Pacing → spend/utilisation → Budget Plan → Constraint gaps. */
export function ExecutiveSummaryTab({
  instance,
  filters,
  filterKey,
}: ExecutiveSummaryTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <DeferredWidget
        key={`chart-${filterKey}`}
        delayMs={400}
        skeleton={<WidgetSkeleton rows={8} className="min-h-[360px]" />}
      >
        <BudgetPacingCard instance={instance} filters={filters} />
      </DeferredWidget>

      <DeferredWidget
        key={`spend-util-${filterKey}`}
        delayMs={650}
        skeleton={<WidgetSkeleton rows={4} className="min-h-[160px]" />}
      >
        <ProjectedSpendUtilisationCard instance={instance} />
      </DeferredWidget>

      <DeferredWidget
        key={`plan-${filterKey}`}
        delayMs={850}
        skeleton={<WidgetSkeleton rows={10} className="min-h-[420px]" />}
      >
        <BudgetPlanCard />
      </DeferredWidget>

      <DeferredWidget
        key={`constraints-${filterKey}`}
        delayMs={1050}
        skeleton={<WidgetSkeleton rows={4} />}
      >
        <PacingSectionB instance={instance} />
      </DeferredWidget>
    </div>
  );
}
