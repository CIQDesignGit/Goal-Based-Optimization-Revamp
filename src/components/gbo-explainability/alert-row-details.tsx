"use client";

import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { AlertConflictCard } from "@/components/gbo-explainability/alert-conflict-card";
import { ManualContributorsList } from "@/components/gbo-explainability/manual-contributors-list";
import { Button } from "@/components/ui/button";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

/** Aligns expanded content with the alert row actor column. */
const ALERT_DETAILS_GRID =
  "grid grid-cols-1 items-start gap-x-4 px-5 py-6 sm:grid-cols-[5.25rem_minmax(0,1fr)]";

type AlertRowDetailsProps = {
  alert: AlertSummary;
  onViewActionLog: () => void;
};

type DetailSectionProps = {
  title: string;
  icon: ReactNode;
  iconClassName: string;
  titleId?: string;
  children: ReactNode;
  className?: string;
};

function DetailSection({
  title,
  icon,
  iconClassName,
  titleId,
  children,
  className,
}: DetailSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h4
          id={titleId}
          className="text-sm font-semibold tracking-tight text-slate-800"
        >
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

/** Inner radius for the 1px gradient ring — matches outer rounded-xl. */
const AI_SUMMARY_INNER_RADIUS = "rounded-[calc(var(--radius-xl)-1px)]";

function AlertAiSummary({
  id,
  summary,
}: {
  id: string;
  summary: string;
}) {
  return (
    <div
      id={id}
      role="note"
      aria-label="Summary"
      className="rounded-xl bg-linear-to-br from-brand-300/55 via-violet-200/45 to-sky-300/50 p-px shadow-xs"
    >
      <div className={cn("relative bg-white", AI_SUMMARY_INNER_RADIUS)}>
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(219,234,254,0.45)_0%,transparent_58%),radial-gradient(ellipse_at_bottom_right,rgba(186,230,253,0.3)_0%,transparent_52%)]",
            AI_SUMMARY_INNER_RADIUS,
          )}
          aria-hidden
        />
        <div className="relative flex gap-3 px-4 py-4">
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-brand-500"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
        </div>
      </div>
    </div>
  );
}

function formatPercentChange(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function DeviationsPanel({
  deviations,
}: {
  deviations: AlertSummary["deviations"];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-violet-100/80 bg-white shadow-xs">
      <div
        className="hidden gap-x-4 border-b border-violet-100/80 bg-violet-50/50 px-4 py-2 text-[10px] font-medium tracking-wider text-slate-500 uppercase sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_4.5rem]"
        aria-hidden
      >
        <span>Entity</span>
        <span>Field</span>
        <span>Before → After</span>
        <span className="text-right">Change</span>
      </div>
      <ul className="divide-y divide-violet-50">
        {deviations.map((deviation) => (
          <li
            key={deviation.id}
            className="grid grid-cols-1 gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_4.5rem] sm:items-center"
          >
            <p className="truncate text-sm font-medium text-slate-800">
              {deviation.entityName}
            </p>
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              {deviation.field}
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs sm:text-sm">
              <span className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-slate-500">
                {deviation.before}
              </span>
              <ArrowRight
                className="size-3 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono font-medium text-violet-900">
                {deviation.after}
              </span>
            </div>
            <span className="shrink-0 justify-self-start text-xs font-medium tabular-nums text-slate-500 sm:justify-self-end sm:text-right">
              {formatPercentChange(deviation.percentChange)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AlertRowDetails({
  alert,
  onViewActionLog,
}: AlertRowDetailsProps) {
  return (
    <div className="bg-slate-50/40">
      <div className={ALERT_DETAILS_GRID}>
        <div aria-hidden className="hidden sm:block" />
        <div className="space-y-7">
          <AlertAiSummary
            id={`${alert.id}-ai-summary`}
            summary={alert.aiSummary}
          />

          {alert.manualContributors && alert.manualContributors.length > 0 ? (
            <DetailSection
              title={`Manual changes by person (${alert.manualContributors.length})`}
              icon={<Users className="size-3.5" aria-hidden />}
              iconClassName="bg-slate-100 text-slate-600"
              className="space-y-2.5"
            >
              <ManualContributorsList contributors={alert.manualContributors} />
            </DetailSection>
          ) : null}

          {alert.conflicts.length > 0 ? (
            <DetailSection
              title={`Overrides (${alert.conflicts.length})`}
              icon={<ArrowLeftRight className="size-3.5" aria-hidden />}
              iconClassName="bg-amber-50 text-amber-700"
            >
              <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
                <ul className="divide-y divide-slate-100">
                  {alert.conflicts.map((conflict) => (
                    <li key={conflict.id}>
                      <AlertConflictCard conflict={conflict} />
                    </li>
                  ))}
                </ul>
              </div>
            </DetailSection>
          ) : null}

          {alert.deviations.length > 0 ? (
            <DetailSection
              title={`High deviations (${alert.deviations.length})`}
              icon={<TrendingUp className="size-3.5" aria-hidden />}
              iconClassName="bg-violet-50 text-violet-700"
              className="space-y-2.5"
            >
              <DeviationsPanel deviations={alert.deviations} />
            </DetailSection>
          ) : null}

          <div className="border-t border-slate-200/60 pt-5">
            <Button
              type="button"
              size="default"
              className="gap-1.5 rounded-[8px] shadow-xs"
              onClick={onViewActionLog}
            >
              View in Action Log
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
