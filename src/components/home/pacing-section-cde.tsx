"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";

import { PacingAccordionSection } from "@/components/home/pacing-accordion-section";
import type {
  PacingInstance,
  PacingRecommendation,
} from "@/lib/home/pacing-instance";
import { cn } from "@/lib/utils";

type PacingSectionCdeProps = {
  instance: PacingInstance;
};

/**
 * Drivers, actions, and watchouts as a single-column stack.
 */
export function PacingSectionCde({ instance }: PacingSectionCdeProps) {
  if (instance.aiNarrativeUnavailable) {
    return (
      <div className="flex flex-col gap-4">
        <PendingPanel
          title="What changed and why"
          description="Top drivers behind pacing and performance shifts"
        />
        <PendingPanel
          title="What to do this week"
          description="Expand an action for lever, impact, and monitoring"
        />
        <PendingPanel
          title="Watchouts"
          description="Risks to monitor while you act on recommendations"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DriversPanel drivers={instance.changeDrivers} />
      <ActionsPanel recommendations={instance.recommendations} />
      <WatchoutsStrip watchouts={instance.watchouts} />
    </div>
  );
}

function DriversPanel({
  drivers,
}: {
  drivers: PacingInstance["changeDrivers"];
}) {
  return (
    <PacingAccordionSection
      title="What changed and why"
      description="Top drivers behind pacing and performance shifts"
    >
      <ol className="divide-y divide-slate-100">
        {drivers.map((d, index) => (
          <li key={d.id} className="flex gap-3 px-4 py-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-bold tabular-nums text-brand-700">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-slate-900">
                {d.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {d.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </PacingAccordionSection>
  );
}

function ActionsPanel({
  recommendations,
}: {
  recommendations: PacingRecommendation[];
}) {
  const [openId, setOpenId] = useState<string | null>(
    recommendations[0]?.id ?? null,
  );

  return (
    <PacingAccordionSection
      title="What to do this week"
      description="Expand an action for lever, impact, and monitoring"
    >
      {recommendations.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">
          No prioritized actions for this selection.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {recommendations.map((r, index) => {
            const open = openId === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-bold tabular-nums text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-slate-900">
                      {r.action}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                      {r.expectedImpact}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-1 size-4 shrink-0 text-slate-400 transition-transform print:hidden",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open ? (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 pl-[3.25rem] print:block">
                    <Detail label="Lever" value={r.lever} />
                    <Detail
                      label="Exact setting change"
                      value={r.exactSettingChange}
                    />
                    <Detail label="Why this now" value={r.whyNow} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Detail label="Expected impact" value={r.expectedImpact} />
                      <Detail label="Risk" value={r.risk} />
                    </div>
                    <Detail label="How to monitor" value={r.howToMonitor} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </PacingAccordionSection>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm leading-snug text-slate-700">{value}</p>
    </div>
  );
}

function WatchoutsStrip({
  watchouts,
}: {
  watchouts: PacingInstance["watchouts"];
}) {
  return (
    <PacingAccordionSection
      title="Watchouts"
      description="Risks to monitor while you act on recommendations"
    >
      <div className="px-4 py-3">
        <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {watchouts.map((w) => (
            <li key={w.id} className="flex gap-2 text-sm leading-snug">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-warning-600"
                aria-hidden
              />
              <span>
                <span className="font-medium text-slate-900">{w.title}. </span>
                <span className="text-slate-600">{w.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PacingAccordionSection>
  );
}

function PendingPanel({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <PacingAccordionSection
      title={title}
      description={description}
      className={className}
    >
      <p className="px-4 py-6 text-sm italic text-slate-500">Summary pending</p>
    </PacingAccordionSection>
  );
}
