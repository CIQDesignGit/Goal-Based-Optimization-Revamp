"use client";

import {
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { AlertConflictCard } from "@/components/gbo-explainability/alert-conflict-card";
import { Button } from "@/components/ui/button";
import type { AlertSummary } from "@/lib/gbo-explainability/types";

/** Matches the actor column in alert-row.tsx for aligned expanded content. */
const ALERT_DETAILS_GRID =
  "grid grid-cols-1 items-start gap-x-3 px-3 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-4 sm:px-4";

type AlertRowDetailsProps = {
  alert: AlertSummary;
  onViewActionLog: () => void;
};

function formatPercentChange(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function AlertRowDetails({
  alert,
  onViewActionLog,
}: AlertRowDetailsProps) {
  const showAiBadge = alert.summarySource === "ai";

  return (
    <div className="border-t border-border bg-slate-50/60">
      <div className={ALERT_DETAILS_GRID}>
        <div aria-hidden className="hidden sm:block" />
        <div className="space-y-4">
          <section aria-labelledby={`${alert.id}-ai-summary`}>
          <div className="mb-1.5 flex items-center gap-2">
            <h4
              id={`${alert.id}-ai-summary`}
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              AI summary
            </h4>
            {showAiBadge ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-2xs font-medium text-brand-700">
                <Sparkles className="size-2.5" aria-hidden />
                AI-generated
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {alert.aiSummary}
          </p>
        </section>

        {alert.conflicts.length > 0 ? (
          <section aria-label="Conflicts">
            <ul className="space-y-4">
              {alert.conflicts.map((conflict, index) => (
                <li key={conflict.id}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Conflict {index + 1}
                  </p>
                  <AlertConflictCard conflict={conflict} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {alert.deviations.length > 0 ? (
          <section aria-label="High deviations">
            <ul className="space-y-3">
              {alert.deviations.map((deviation, index) => (
                <li key={deviation.id}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    High deviation {index + 1}
                  </p>
                  <div className="rounded-md border border-violet-100 bg-white px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {deviation.entityName}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {deviation.field}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {deviation.before}
                      <span className="mx-1.5 text-foreground">→</span>
                      {deviation.after}
                    </p>
                    <p className="mt-1 text-xs text-violet-800">
                      {formatPercentChange(deviation.percentChange)} change from
                      prior value
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-brand-300 bg-background text-brand-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
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
