"use client";

import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { AlertConflictCard } from "@/components/gbo-explainability/alert-conflict-card";
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
  children: ReactNode;
  className?: string;
};

function DetailSection({
  title,
  icon,
  iconClassName,
  children,
  className,
}: DetailSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function formatPercentChange(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function DeviationCard({
  entityName,
  field,
  before,
  after,
  percentChange,
}: {
  entityName: string;
  field: string;
  before: string;
  after: string;
  percentChange: number;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-background p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{entityName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{field}</p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
          {formatPercentChange(percentChange)} change
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-muted-foreground">
          {before}
        </span>
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="rounded-md bg-violet-50 px-2 py-1 font-mono font-medium text-violet-900">
          {after}
        </span>
      </div>
    </div>
  );
}

export function AlertRowDetails({
  alert,
  onViewActionLog,
}: AlertRowDetailsProps) {
  const showAiBadge = alert.summarySource === "ai";

  return (
    <div className="border-t border-border bg-slate-50/40">
      <div className={ALERT_DETAILS_GRID}>
        <div aria-hidden className="hidden sm:block" />
        <div className="space-y-6">
          <section
            aria-labelledby={`${alert.id}-ai-summary`}
            className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
          >
            <div className="border-b border-border bg-slate-50/80 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles
                  className="size-4 shrink-0 text-brand-600"
                  aria-hidden
                />
                <h4
                  id={`${alert.id}-ai-summary`}
                  className="text-sm font-semibold text-foreground"
                >
                  Daily summary
                </h4>
                {showAiBadge ? (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-medium text-brand-700">
                    AI-generated
                  </span>
                ) : null}
              </div>
            </div>
            <p className="px-4 py-3.5 text-sm leading-relaxed text-foreground">
              {alert.aiSummary}
            </p>
          </section>

          {alert.conflicts.length > 0 ? (
            <DetailSection
              title={`Overrides (${alert.conflicts.length})`}
              icon={<ArrowLeftRight className="size-4" aria-hidden />}
              iconClassName="bg-amber-50 text-amber-700"
            >
              <ul className="space-y-4">
                {alert.conflicts.map((conflict) => (
                  <li key={conflict.id}>
                    <AlertConflictCard conflict={conflict} />
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {alert.deviations.length > 0 ? (
            <DetailSection
              title={`High deviations (${alert.deviations.length})`}
              icon={<TrendingUp className="size-4" aria-hidden />}
              iconClassName="bg-violet-50 text-violet-700"
            >
              <ul className="space-y-3">
                {alert.deviations.map((deviation) => (
                  <li key={deviation.id}>
                    <DeviationCard
                      entityName={deviation.entityName}
                      field={deviation.field}
                      before={deviation.before}
                      after={deviation.after}
                      percentChange={deviation.percentChange}
                    />
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          <div className="border-t border-border/80 pt-4">
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
