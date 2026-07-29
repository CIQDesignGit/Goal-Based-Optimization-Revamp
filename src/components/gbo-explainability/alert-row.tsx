"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { ActorBadge } from "@/components/gbo-explainability/actor-badge";
import { AlertRowDetails } from "@/components/gbo-explainability/alert-row-details";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import {
  formatAlertSubtitle,
  formatAlertTitle,
} from "@/lib/gbo-explainability/aggregate-alerts";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowProps = {
  alert: AlertSummary;
  onClick: () => void;
};

/** Fixed actor column — widest label is "Rule Based"; keeps claim text aligned. */
const ALERT_ROW_GRID =
  "grid w-full grid-cols-[5.5rem_minmax(0,1fr)_auto] items-start gap-x-3 px-3 py-3 sm:gap-x-4 sm:px-4";

export function AlertRow({ alert, onClick }: AlertRowProps) {
  const [expanded, setExpanded] = useState(false);
  const failed =
    alert.status === "failure" || alert.status === "partial";

  const toggleExpanded = () => {
    setExpanded((current) => !current);
  };

  return (
    <li
      className={cn(
        "border-b border-border last:border-b-0",
        failed && "border-l-2 border-l-error-400",
      )}
    >
      <div className={ALERT_ROW_GRID}>
        <ActorBadge actor={alert.actor} className="mt-0.5 justify-self-start" />

        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="min-w-0 space-y-1 text-left hover:opacity-90"
        >
          <ClaimSentence
            claim={formatAlertTitle(alert)}
            summarySource={alert.summarySource}
          />
          <AlertSignalTags alert={alert} />
          <p className="truncate text-xs text-muted-foreground">
            {formatAlertSubtitle(alert)}
          </p>
        </button>

        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse alert details" : "Expand alert details"}
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-slate-100"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>

      {expanded ? (
        <AlertRowDetails alert={alert} onViewActionLog={onClick} />
      ) : null}
    </li>
  );
}
