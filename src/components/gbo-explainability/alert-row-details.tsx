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
  "grid grid-cols-1 items-start gap-x-3 px-3 py-5 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-x-4 sm:px-4";

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
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h4
          id={titleId}
          className="text-sm font-semibold text-foreground"
        >
          {title}
        </h4>
      </div>
      {children}
    </section>
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
    <div className="overflow-hidden rounded-md border border-violet-100 bg-background">
      <div
        className="hidden gap-x-4 border-b border-violet-100 bg-violet-50/60 px-3 py-1.5 text-2xs font-medium tracking-wide text-muted-foreground uppercase sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_4.5rem]"
        aria-hidden
      >
        <span>Entity</span>
        <span>Field</span>
        <span>Before → After</span>
        <span className="text-right">Change</span>
      </div>
      <ul className="divide-y divide-violet-100">
        {deviations.map((deviation) => (
          <li
            key={deviation.id}
            className="grid grid-cols-1 gap-x-4 gap-y-1.5 px-3 py-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_4.5rem] sm:items-center"
          >
            <p className="truncate text-sm font-medium text-foreground">
              {deviation.entityName}
            </p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {deviation.field}
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs sm:text-sm">
              <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-muted-foreground">
                {deviation.before}
              </span>
              <ArrowRight
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="rounded bg-violet-50 px-1.5 py-0.5 font-mono font-medium text-violet-900">
                {deviation.after}
              </span>
            </div>
            <span className="shrink-0 justify-self-start text-xs text-muted-foreground sm:justify-self-end sm:text-right">
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
    <div className="border-t border-border bg-slate-50/40">
      <div className={ALERT_DETAILS_GRID}>
        <div aria-hidden className="hidden sm:block" />
        <div className="space-y-6">
          <div
            id={`${alert.id}-ai-summary`}
            className="rounded-lg border border-brand-200/70 bg-brand-50/90 px-3 py-2.5"
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-2xs font-medium text-brand-700">
              <Sparkles className="size-3 shrink-0" aria-hidden />
              <span>AI-generated summary</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {alert.aiSummary}
            </p>
          </div>

          {alert.manualContributors && alert.manualContributors.length > 0 ? (
            <DetailSection
              title={`Manual changes by person (${alert.manualContributors.length})`}
              icon={<Users className="size-3.5" aria-hidden />}
              iconClassName="bg-slate-100 text-slate-600"
              className="space-y-2"
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
              <div className="overflow-hidden rounded-xl border border-border bg-slate-50/50">
                <ul className="divide-y divide-border">
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
              className="space-y-2"
            >
              <DeviationsPanel deviations={alert.deviations} />
            </DetailSection>
          ) : null}

          <div className="pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-brand-200 bg-background text-brand-700 hover:border-brand-300 hover:bg-brand-50"
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
