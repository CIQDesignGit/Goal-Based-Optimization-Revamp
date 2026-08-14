"use client";

import { DeferredWidget } from "@/components/home/deferred-widget";
import { PacingSectionA } from "@/components/home/pacing-section-a";
import { PacingSectionB } from "@/components/home/pacing-section-b";
import { PacingSectionCde } from "@/components/home/pacing-section-cde";
import { WidgetSkeleton } from "@/components/home/widget-skeleton";
import type { PacingInstance } from "@/lib/home/pacing-instance";

type PacingTabProps = {
  instance: PacingInstance;
};

/** Pacing tab — report sections with distinct layouts (not one template). */
export function PacingTab({ instance }: PacingTabProps) {
  const filterKey = [
    instance.accountName,
    instance.rows.map((r) => r.id).join(","),
    instance.constraints.length,
  ].join("|");

  return (
    <div id="pacing-report-root" className="flex flex-col gap-5">
      <DeferredWidget
        key={`a-${filterKey}`}
        delayMs={400}
        skeleton={<WidgetSkeleton rows={6} className="min-h-[240px]" />}
      >
        <PacingSectionA instance={instance} />
      </DeferredWidget>

      <DeferredWidget
        key={`b-${filterKey}`}
        delayMs={700}
        skeleton={<WidgetSkeleton rows={4} />}
      >
        <PacingSectionB instance={instance} />
      </DeferredWidget>

      <DeferredWidget
        key={`cde-${filterKey}`}
        delayMs={1000}
        skeleton={<WidgetSkeleton rows={5} />}
      >
        <PacingSectionCde instance={instance} />
      </DeferredWidget>

      <p className="text-center text-2xs text-slate-400 print:hidden">
        AI-assisted narrative — verify figures in your CommerceIQ instance
      </p>
    </div>
  );
}
