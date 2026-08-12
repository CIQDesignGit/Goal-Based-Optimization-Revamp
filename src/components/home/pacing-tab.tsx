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

/** Pacing tab — Budget Pacing Report sections A–E. */
export function PacingTab({ instance }: PacingTabProps) {
  const filterKey = [
    instance.accountName,
    instance.rows.map((r) => r.id).join(","),
    instance.constraints.length,
  ].join("|");

  return (
    <div className="flex flex-col gap-8 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <p className="text-xs italic text-slate-500">
        AI generated summary. It may contain errors. Check your CommerceIQ
        instance for the most accurate and up-to-date information.
      </p>

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
    </div>
  );
}
