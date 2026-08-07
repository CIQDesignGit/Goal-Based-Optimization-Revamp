"use client";

import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import {
  alertRowTimestampValue,
  formatAlertRowTimestamp,
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

export function AlertCategoryTag({
  role,
  variant = "plain",
}: {
  role: AlertRole;
  /** `plain` for list cards; `chip` for detail header with grey background. */
  variant?: "plain" | "chip";
}) {
  return (
    <span
      className={cn(
        "shrink-0 leading-none text-slate-500",
        variant === "chip"
          ? "rounded-xs bg-slate-100 px-1.5 py-0.5 text-xs"
          : "text-xs font-medium",
      )}
    >
      {alertCategoryLabel(role)}
    </span>
  );
}

/** Compact count — e.g. "3 changes" / "1 change". */
function AlertChangeCount({ count }: { count: number }) {
  const label = count === 1 ? "1 change" : `${count} changes`;

  return (
    <span className="shrink-0 text-xs font-medium tabular-nums leading-none text-slate-500">
      {label}
    </span>
  );
}

/** Compact card for the alerts master pane — actor, count, category, signals. */
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
          "w-full rounded-lg border p-3 text-left transition-colors",
          selected
            ? "border-violet-500 bg-violet-50"
            : "border-slate-200/80 bg-white hover:border-slate-300",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <ActorLabel
            actor={alert.actor}
            manualContributors={alert.manualContributors}
            className="min-w-0 flex-1"
          />

          <time
            dateTime={alertRowTimestampValue(alert)}
            className={cn(
              "shrink-0 whitespace-nowrap tabular-nums",
              explainabilityType.l4,
            )}
          >
            {formatAlertRowTimestamp(alert)}
          </time>
        </div>

        {/* Text datapoints · signals — no chip backgrounds on count/category */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertChangeCount count={alert.actionCount} />
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <AlertCategoryTag role={alert.role} />
          </div>
          <AlertSignalTags alert={alert} className="w-full basis-full" />
        </div>
      </button>
    </li>
  );
}
