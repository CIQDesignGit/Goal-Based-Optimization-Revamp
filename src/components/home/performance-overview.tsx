"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildExecutiveSummary } from "@/lib/home/executive-summary";
import type { PacingInstance } from "@/lib/home/pacing-instance";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";
import { cn } from "@/lib/utils";

type PerformanceOverviewProps = {
  instance: PacingInstance;
  filterKey: string;
};

/**
 * Single Ally brief: narrative + next steps side by side (FR-013).
 * Not a stack of identical numbered cards.
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
  const supporting = summary.bullets.slice(1);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
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
      </header>

      {open ? (
        <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="p-4 lg:pr-3">
            <div className="space-y-4 rounded-lg border border-brand-200 bg-white p-5 shadow-[0_0_0_4px_rgb(239_246_255_/_0.55)]">
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
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Sparkles className="size-4" aria-hidden />
                    </span>
                    <p className="min-w-0 text-base font-medium leading-snug text-slate-900">
                      {splitLead(headline).lead}
                      {splitLead(headline).detail ? (
                        <span className="mt-1 block text-sm font-normal leading-relaxed text-slate-600">
                          {splitLead(headline).detail}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ) : null}

                {supporting.length > 0 ? (
                  <ul className="space-y-2.5 border-t border-brand-100 pt-3">
                    {supporting.map((item) => {
                      const parts = splitLead(item);
                      return (
                        <li key={item.slice(0, 40)} className="text-sm">
                          <span className="font-medium text-slate-800">
                            {parts.lead}
                          </span>
                          {parts.detail ? (
                            <span className="text-slate-600">
                              {" "}
                              — {parts.detail}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </>
            )}
            </div>
          </div>

          <aside className="bg-slate-50/70 px-4 py-4">
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
              <ol className="mt-3 space-y-2">
                {summary.recommendations.map((rec, index) => (
                  <li
                    key={rec.slice(0, 40)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-xs"
                  >
                    <p className="text-2xs font-semibold uppercase tracking-wide text-brand-600">
                      Action {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-slate-900">
                      {rec}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function splitLead(item: string) {
  const [lead, ...rest] = item.split(" — ");
  return { lead, detail: rest.join(" — ") };
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
