"use client";

import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import {
  alertRowTimestampValue,
  formatAlertRowTimestamp,
  formatAlertTitle,
} from "@/lib/gbo-explainability/aggregate-alerts";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
import type { AlertRole, AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertMasterCardProps = {
  alert: AlertSummary;
  selected: boolean;
  onSelect: () => void;
};

function alertCategoryLabel(role: AlertRole): "Automation" | "Setup" {
  return role === "human" ? "Setup" : "Automation";
}

export function AlertCategoryTag({ role }: { role: AlertRole }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-xs bg-slate-100 px-1.5 py-0.5 leading-none",
        explainabilityType.l4,
      )}
    >
      {alertCategoryLabel(role)}
    </span>
  );
}

/** Compact card for the alerts master pane — actor, claim, signals, metadata. */
export function AlertMasterCard({
  alert,
  selected,
  onSelect,
}: AlertMasterCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onSelect();
        }}
        aria-selected={selected}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "w-full rounded-xl border p-3 text-left transition-colors",
          selected
            ? "border-violet-500 bg-violet-50"
            : "border-slate-200/80 bg-white hover:border-slate-300",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <ActorLabel
            actor={alert.actor}
            manualContributors={alert.manualContributors}
            className="min-w-0 flex-1"
          />

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <AlertCategoryTag role={alert.role} />
            <time
              dateTime={alertRowTimestampValue(alert)}
              className={cn("whitespace-nowrap tabular-nums", explainabilityType.l4)}
            >
              {formatAlertRowTimestamp(alert)}
            </time>
          </div>
        </div>

        <ClaimSentence
          claim={formatAlertTitle(alert)}
          summarySource={alert.summarySource}
          className="mb-2 line-clamp-2 min-w-0"
        />

        <AlertSignalTags alert={alert} />
      </button>
    </li>
  );
}
