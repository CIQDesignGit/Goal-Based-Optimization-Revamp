"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { AlertRowDetails } from "@/components/gbo-explainability/alert-row-details";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import { Button } from "@/components/ui/button";
import {
  alertRowTimestampValue,
  formatAlertRowTimestamp,
  formatAlertTitle,
} from "@/lib/gbo-explainability/aggregate-alerts";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowProps = {
  alert: AlertSummary;
  onClick: () => void;
};

/** Fixed actor column — label area plus 60px right padding before claim text. */
const ALERT_ROW_GRID =
  "grid w-full grid-cols-[12rem_minmax(0,1fr)_auto] items-start gap-x-0 px-5 py-4";

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
        expanded ? "bg-slate-50/50" : "hover:bg-brand-25",
      )}
    >
      <div className={ALERT_ROW_GRID}>
        <ActorLabel
          actor={alert.actor}
          manualContributors={alert.manualContributors}
          className="mt-0.5 w-full justify-self-start pr-15"
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
          <time
            dateTime={alertRowTimestampValue(alert)}
            className="shrink-0 whitespace-nowrap text-[11px] font-medium tabular-nums text-slate-400"
          >
            {formatAlertRowTimestamp(alert)}
          </time>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse alert details" : "Expand alert details"}
              className="size-9 shrink-0 text-slate-500"
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
              className="size-9 shrink-0 text-slate-500"
            >
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100/80">
          <AlertRowDetails alert={alert} onViewActionLog={onClick} />
        </div>
      ) : null}
    </li>
  );
}
