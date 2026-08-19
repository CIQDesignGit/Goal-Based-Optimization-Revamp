"use client";

import { DeferredWidget } from "@/components/home/deferred-widget";
import { PacingSectionCde } from "@/components/home/pacing-section-cde";
import { PerformanceOverview } from "@/components/home/performance-overview";
import { WidgetSkeleton } from "@/components/home/widget-skeleton";
import type { PacingInstance } from "@/lib/home/pacing-instance";

type PacingTabProps = {
  instance: PacingInstance;
  filterKey: string;
};

/**
 * Second tab: Performance Overview → what changed / what to do / watchouts.
 * Weekly account state (Section A) is kept in code but hidden for now.
 */
export function PacingTab({ instance, filterKey }: PacingTabProps) {
  return (
    <div id="pacing-report-root" className="flex flex-col gap-5">
      <PerformanceOverview instance={instance} filterKey={filterKey} />

      <DeferredWidget
        key={`cde-${filterKey}`}
        delayMs={700}
        skeleton={<WidgetSkeleton rows={5} />}
      >
        <PacingSectionCde instance={instance} />
      </DeferredWidget>
    </div>
  );
}
