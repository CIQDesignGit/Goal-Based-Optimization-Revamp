"use client";

import { PacingAccordionSection } from "@/components/home/pacing-accordion-section";
import {
  groupByLevel1,
  PacingStateTable,
} from "@/components/home/pacing-state-table";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { PacingInstance } from "@/lib/home/pacing-instance";
import { cn } from "@/lib/utils";

type PacingSectionAProps = {
  instance: PacingInstance;
};

/** Weekly MTD table — data-first, like the Budget Pacing chart widget. */
export function PacingSectionA({ instance }: PacingSectionAProps) {
  const leafRows = instance.rows.filter((r) => !r.isRollup);
  const rollup = instance.rows.find((r) => r.isRollup);
  const groups = groupByLevel1(leafRows);
  const hasNotes =
    instance.sectionAInsights.length > 0 || instance.sectionATrends.length > 0;

  return (
    <PacingAccordionSection
      title="Weekly account state"
      description="MTD pacing by level · On Plan at 97–102%"
      headerRight={<GboExecutionStats stats={instance.gboStats} />}
    >
      <div className="p-4 pt-3">
        <PacingStateTable rollup={rollup} groups={groups} />
        {hasNotes ? (
          <div className="mt-3">
            <InsightsPanel instance={instance} />
          </div>
        ) : null}
      </div>
    </PacingAccordionSection>
  );
}

function GboExecutionStats({
  stats,
}: {
  stats: PacingInstance["gboStats"];
}) {
  const items = [
    { label: "Budget OK", value: stats.budgetChangeSuccessPercent },
    { label: "Bid OK", value: stats.bidChangeSuccessPercent },
    { label: "Coverage", value: stats.recommendationCoveragePercent },
  ];

  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-right">
      {items.map((item) => (
        <div key={item.label} className="min-w-[4.5rem]">
          <dt className="text-2xs text-slate-500">{item.label}</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">
            {item.value.toFixed(1)}%
          </dd>
        </div>
      ))}
    </dl>
  );
}

function InsightsPanel({ instance }: { instance: PacingInstance }) {
  const [open, setOpen] = useState(false);
  const preview = instance.sectionAInsights[0];

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
      >
        <span className="min-w-0 truncate">
          {open ? "Insights & trends" : (preview ?? "Insights & trends")}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </Button>
      {open ? (
        <div className="space-y-3 border-t border-slate-200 px-3 py-3">
          {instance.sectionAInsights.length > 0 ? (
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-700">
              {instance.sectionAInsights.map((line) => (
                <li key={line.slice(0, 48)}>{line}</li>
              ))}
            </ul>
          ) : null}
          {instance.sectionATrends.length > 0 ? (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Trends
              </p>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-4 text-sm text-slate-700">
                {instance.sectionATrends.map((t) => (
                  <li key={t.lead}>
                    <span className="font-semibold">{t.lead}.</span> {t.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
