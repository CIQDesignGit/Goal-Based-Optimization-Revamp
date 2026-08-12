"use client";

import { Lightbulb, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildExecutiveSummary } from "@/lib/home/executive-summary";
import type { PacingInstance } from "@/lib/home/pacing-instance";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";

type PerformanceOverviewProps = {
  instance: PacingInstance;
  /** Bumps when filters change so we remount and re-run generation. */
  filterKey: string;
};

/**
 * Performance Overview + AI Recommended Action — matching card layouts (FR-013).
 */
export function PerformanceOverview({
  instance,
  filterKey,
}: PerformanceOverviewProps) {
  return (
    <div className="space-y-4">
      <OverviewCard key={filterKey} instance={instance} />
      <AiRecommendationSection key={`rec-${filterKey}`} instance={instance} />
    </div>
  );
}

function OverviewCard({ instance }: { instance: PacingInstance }) {
  const [ready, setReady] = useState(false);
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
      if (!simulateLlmDown) {
        setLastSummary(liveSummary);
      }
      setReady(true);
    }, 600);
    return () => window.clearTimeout(id);
  }, [simulateLlmDown, liveSummary, setLastSummary]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
        <TrendingUp className="size-4 shrink-0 text-violet-500" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900">
          Performance Overview
        </h2>
      </div>

      <div className="border-t border-slate-100 bg-gradient-to-r from-violet-100/80 via-violet-50/50 to-white px-4 py-4">
        {!ready ? (
          <NumberedListSkeleton />
        ) : (
          <>
            {summary.isFallback ? (
              <p className="mb-3 text-xs text-warning-700">
                {lastSummary?.generatedAt
                  ? `Showing last available summary (${lastSummary.generatedAt}).`
                  : "AI service unavailable — showing a short instance-based status."}
              </p>
            ) : null}
            <NumberedList items={summary.bullets} />
          </>
        )}
      </div>
    </section>
  );
}

/** Same card chrome as Performance Overview; Lightbulb marks actions. */
function AiRecommendationSection({ instance }: { instance: PacingInstance }) {
  const [ready, setReady] = useState(false);
  const simulateLlmDown = usePacingDashboardStore((s) => s.simulateLlmDown);
  const lastSummary = usePacingDashboardStore((s) => s.lastSummary);

  const liveSummary = useMemo(
    () => buildExecutiveSummary(instance),
    [instance],
  );

  const recommendations = useMemo(() => {
    if (!simulateLlmDown) return liveSummary.recommendations;
    return lastSummary?.recommendations?.length
      ? lastSummary.recommendations
      : liveSummary.recommendations;
  }, [simulateLlmDown, liveSummary, lastSummary]);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 750);
    return () => window.clearTimeout(id);
  }, []);

  if (ready && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
        <Lightbulb className="size-4 shrink-0 text-violet-500" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900">
          AI Recommended Action
        </h2>
      </div>

      <div className="border-t border-slate-100 px-4 py-4">
        {!ready ? (
          <NumberedListSkeleton />
        ) : (
          <NumberedList items={recommendations} />
        )}
      </div>
    </section>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.slice(0, 48)} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
            {index + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-slate-800">{item}</p>
        </li>
      ))}
    </ol>
  );
}

function NumberedListSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true">
      <div className="h-4 w-full rounded bg-violet-100/80" />
      <div className="h-4 w-5/6 rounded bg-violet-100/80" />
      <div className="h-4 w-4/6 rounded bg-violet-100/80" />
    </div>
  );
}
