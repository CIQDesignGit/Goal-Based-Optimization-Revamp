"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { PacingAccordionSection } from "@/components/home/pacing-accordion-section";
import { Button } from "@/components/ui/button";
import type { ConstraintAlert, PacingInstance } from "@/lib/home/pacing-instance";
import { cn } from "@/lib/utils";

/** How many constraint gap cards to show before the user expands the list. */
const INITIAL_VISIBLE_COUNT = 4;

type PacingSectionBProps = {
  instance: PacingInstance;
};

/**
 * Constraint gaps as visual target-vs-actual bars — easier to scan than a
 * second table that repeats the same numbers in prose.
 */
export function PacingSectionB({ instance }: PacingSectionBProps) {
  const { constraints } = instance;
  const [expanded, setExpanded] = useState(false);

  const hasMore = constraints.length > INITIAL_VISIBLE_COUNT;
  const visibleConstraints = expanded
    ? constraints
    : constraints.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <PacingAccordionSection
      title="Constraint gaps"
      description="Configured share vs actual spend share"
    >
      <div>
        {constraints.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No constraints set.</p>
        ) : (
          <>
            <div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3">
              {visibleConstraints.map((c) => (
                <ConstraintGapCard key={c.id} constraint={c} />
              ))}
            </div>

            {hasMore ? (
              <div className="border-t border-slate-100">
                <div className="flex justify-start px-4 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-brand-500 bg-background text-brand-500 hover:bg-brand-50 hover:text-brand-600 aria-expanded:bg-background aria-expanded:text-brand-500 dark:aria-expanded:bg-background"
                    onClick={() => setExpanded((value) => !value)}
                    aria-expanded={expanded}
                  >
                    {expanded
                      ? "Show less"
                      : `View all ${constraints.length} constraint gaps`}
                    <ChevronDown
                      className={cn(
                        "transition-transform",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PacingAccordionSection>
  );
}

function ConstraintGapCard({ constraint: c }: { constraint: ConstraintAlert }) {
  const max = Math.max(100, c.constraintPercent, c.spendSharePercent);
  const under = c.spendSharePercent < c.constraintPercent;

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {c.constraintType}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {c.level1}
            {c.level2 !== "None" ? ` · ${c.level2}` : ""}
            {" · "}
            {c.group}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-2xs font-semibold",
            c.alert === "High Deviation"
              ? "bg-error-100 text-error-700"
              : "bg-warning-100 text-warning-700",
          )}
        >
          {Math.abs(c.deviationPoints).toFixed(1)}pp
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <ShareBar
          label="Target"
          percent={c.constraintPercent}
          max={max}
          tone="target"
        />
        <ShareBar
          label="Actual"
          percent={c.spendSharePercent}
          max={max}
          tone={under ? "under" : "over"}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        {c.plainLanguage}
      </p>
    </article>
  );
}

function ShareBar({
  label,
  percent,
  max,
  tone,
}: {
  label: string;
  percent: number;
  max: number;
  tone: "target" | "under" | "over";
}) {
  const width = Math.min(100, (percent / max) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-2xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-semibold tabular-nums text-slate-800">
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "target" && "bg-slate-400",
            tone === "under" && "bg-warning-500",
            tone === "over" && "bg-error-500",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
