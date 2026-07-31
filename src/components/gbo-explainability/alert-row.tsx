"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { AlertRowDetails } from "@/components/gbo-explainability/alert-row-details";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import { Button } from "@/components/ui/button";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import {
  alertRowTimestampValue,
  formatAlertRowTimestamp,
  formatAlertTitle,
} from "@/lib/gbo-explainability/aggregate-alerts";
import type { AlertRole, AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowProps = {
  alert: AlertSummary;
  onClick: () => void;
};

function alertCategoryLabel(role: AlertRole): "Automation" | "Setup" {
  return role === "human" ? "Setup" : "Automation";
}

function AlertCategoryTag({ role }: { role: AlertRole }) {
  return (
    <span className="shrink-0 rounded-xs bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-slate-600">
      {alertCategoryLabel(role)}
    </span>
  );
}

/** Fixed 250px actor column — keeps claim text aligned across rows. */
export const ALERT_ACTOR_COLUMN_WIDTH = "250px";

export const ALERT_ROW_GRID =
  "grid w-full grid-cols-[250px_minmax(0,1fr)_auto] items-start gap-x-0 px-5 py-4";

/** Second line — signal tags only (failures, conflicts, high deviation). */
function AlertRowSubtitle({ alert }: { alert: AlertSummary }) {
  return <AlertSignalTags alert={alert} />;
}

export function AlertRow({ alert, onClick }: AlertRowProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded((current) => !current);
  };

  return (
    <li
      className={cn(
        "group/row transition-colors",
        ALERT_ROW_GRID,
        expanded ? "bg-slate-50/50" : explainabilityActionable.rowHover,
      )}
    >
      <ActorLabel
        actor={alert.actor}
        manualContributors={alert.manualContributors}
        className="mt-0.5 w-full min-w-0 pr-20"
      />

      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        className="min-w-0 space-y-2 text-left"
      >
        <ClaimSentence
          claim={formatAlertTitle(alert)}
          summarySource={alert.summarySource}
          className="min-w-0"
        />
        <AlertRowSubtitle alert={alert} />
      </button>

      <div className="flex flex-col items-end gap-1.5 self-start pt-0.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <AlertCategoryTag role={alert.role} />
          <time
            dateTime={alertRowTimestampValue(alert)}
            className="whitespace-nowrap text-[11px] font-medium tabular-nums text-slate-400"
          >
            {formatAlertRowTimestamp(alert)}
          </time>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse alert details" : "Expand alert details"}
            className={cn("size-9 shrink-0", explainabilityActionable.iconAction)}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClick}
            aria-label="View in Action Log"
            title="View in Action Log"
            className={cn("size-9 shrink-0", explainabilityActionable.iconAction)}
          >
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {expanded ? (
        <>
          <div aria-hidden className="hidden sm:block" />
          <div className="col-span-3 sm:col-span-1 sm:col-start-2">
            <AlertRowDetails alert={alert} onViewActionLog={onClick} />
          </div>
        </>
      ) : null}
    </li>
  );
}
