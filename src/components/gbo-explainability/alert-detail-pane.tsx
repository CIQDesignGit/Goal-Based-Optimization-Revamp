"use client";

import { ArrowRight } from "lucide-react";

import {
  AlertCategoryTag,
} from "@/components/gbo-explainability/alert-master-card";
import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { AlertRowDetails } from "@/components/gbo-explainability/alert-row-details";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import { Button } from "@/components/ui/button";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import {
  alertRowTimestampValue,
  formatAlertRowTimestamp,
} from "@/lib/gbo-explainability/aggregate-alerts";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertDetailPaneProps = {
  alert: AlertSummary;
  onViewActionLog: () => void;
};

function scrollToDetailSection(targetSectionId: string) {
  window.requestAnimationFrame(() => {
    document
      .getElementById(targetSectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

/** Detail workspace for the selected alert — header + existing section cards. */
export function AlertDetailPane({
  alert,
  onViewActionLog,
}: AlertDetailPaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-slate-100 bg-white py-4">
        <div className="flex items-start justify-between gap-4 px-6">
          <ActorLabel
            actor={alert.actor}
            manualContributors={alert.manualContributors}
            className="min-w-0"
          />

          <Button
            type="button"
            size="default"
            className={cn(
              "shrink-0 gap-1.5 rounded-[8px] shadow-xs",
              explainabilityActionable.primaryButton,
            )}
            onClick={onViewActionLog}
          >
            View in Action Log
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </div>

        {/* No horizontal padding on this meta row — selected for flush alignment */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-6">
          <AlertSignalTags
            alert={alert}
            onSignalNavigate={scrollToDetailSection}
          />
          {(alert.failureCount > 0 ||
            alert.conflictCount > 0 ||
            alert.highDeviationCount > 0) && (
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
          )}
          <AlertCategoryTag role={alert.role} variant="chip" />
          <time
            dateTime={alertRowTimestampValue(alert)}
            className={cn("tabular-nums", explainabilityType.l4)}
          >
            {formatAlertRowTimestamp(alert)}
          </time>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
        <AlertRowDetails alert={alert} />
      </div>
    </div>
  );
}

/** Shown when no alert is selected in the master list. */
export function AlertDetailEmptyState() {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center px-6 py-12 text-center">
      <p className={cn("max-w-xs", explainabilityType.l4)}>
        Select an alert from the list to view details.
      </p>
    </div>
  );
}
