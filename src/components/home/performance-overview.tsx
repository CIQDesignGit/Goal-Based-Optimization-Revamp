"use client";

import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BudgetPacingDateRangePicker } from "@/components/home/budget-pacing-date-range-picker";
import { formatFilterDateRange } from "@/lib/home/dashboard-filters";
import { buildExecutiveSummary } from "@/lib/home/executive-summary";
import type { PacingInstance } from "@/lib/home/pacing-instance";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";
import { cn } from "@/lib/utils";

type PerformanceOverviewProps = {
  instance: PacingInstance;
  filterKey: string;
};

/**
 * Performance Overview: narrative summary with recommendations stacked below (FR-013).
 */
export function PerformanceOverview({
  instance,
  filterKey,
}: PerformanceOverviewProps) {
  return <AllyBrief key={filterKey} instance={instance} />;
}

function AllyBrief({ instance }: { instance: PacingInstance }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const simulateLlmDown = usePacingDashboardStore((s) => s.simulateLlmDown);
  const lastSummary = usePacingDashboardStore((s) => s.lastSummary);
  const setLastSummary = usePacingDashboardStore((s) => s.setLastSummary);
  const filters = usePacingDashboardStore((s) => s.filters);
  const setFilters = usePacingDashboardStore((s) => s.setFilters);

  const liveSummary = useMemo(
    () => buildExecutiveSummary(instance),
    [instance],
  );

  const summary = useMemo(() => {
    if (!simulateLlmDown) return liveSummary;
    if (lastSummary && !lastSummary.isFallback) {
      return { ...lastSummary, isFallback: true };
    }
    return buildExecutiveSummary(instance, { forceFallback: true });
  }, [simulateLlmDown, liveSummary, lastSummary, instance]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!simulateLlmDown) setLastSummary(liveSummary);
      setReady(true);
    }, 600);
    return () => window.clearTimeout(id);
  }, [simulateLlmDown, liveSummary, setLastSummary]);

  const headline = summary.bullets[0] ?? null;
  const highlights = summary.bullets.slice(1, 4);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Collapse overview" : "Expand overview"}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-400 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
          <h2 className="min-w-0 text-sm font-semibold text-slate-900">
            Performance Overview
          </h2>
        </button>

        {/* Same date picker as Budget Pacing, but without compare window */}
        <BudgetPacingDateRangePicker
          showCompare={false}
          range={{
            from: parseIsoDate(filters.dateFrom),
            to: parseIsoDate(filters.dateTo),
          }}
          triggerLabel={formatFilterDateRange(filters)}
          onApply={(next) =>
            setFilters({
              dateFrom: format(next.from, "yyyy-MM-dd"),
              dateTo: format(next.to, "yyyy-MM-dd"),
            })
          }
        />
      </header>

      {open ? (
        <div className="space-y-8 p-4">
          <div className="space-y-4">
            {!ready ? (
              <BriefSkeleton />
            ) : (
              <>
                {summary.isFallback ? (
                  <p className="text-xs text-warning-700">
                    {lastSummary?.generatedAt
                      ? `Showing last available summary (${lastSummary.generatedAt}).`
                      : "AI service unavailable — showing a short instance-based status."}
                  </p>
                ) : null}

                {headline ? (
                  <p className="text-base font-medium leading-snug text-slate-900">
                    <MarkedText text={headline} />
                  </p>
                ) : null}

                {highlights.length > 0 ? (
                  <ul className="space-y-2">
                    {highlights.map((item) => (
                      <li
                        key={item.slice(0, 40)}
                        className="flex gap-2 text-sm leading-snug text-slate-700"
                      >
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400"
                          aria-hidden
                        />
                        <span>
                          <MarkedText text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
              Recommendations
            </p>
            {!ready ? (
              <div className="mt-3 animate-pulse space-y-2" aria-busy="true">
                <div className="h-14 rounded-lg bg-slate-200/70" />
                <div className="h-14 rounded-lg bg-slate-200/70" />
              </div>
            ) : summary.recommendations.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No prioritized actions for this selection.
              </p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {summary.recommendations.map((rec, index) => (
                  <li
                    key={rec.slice(0, 40)}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-bold tabular-nums text-brand-700">
                      {index + 1}
                    </span>
                    <p className="min-w-0 text-sm leading-snug text-slate-800">
                      {rec}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Renders **bold** markers from summary copy. */
function MarkedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function BriefSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true">
      <div className="h-5 w-4/5 rounded bg-slate-100" />
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-3/4 rounded bg-slate-100" />
    </div>
  );
}

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC shift). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}
