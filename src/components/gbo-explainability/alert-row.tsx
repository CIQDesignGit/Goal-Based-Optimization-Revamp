"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { AlertRowDetails } from "@/components/gbo-explainability/alert-row-details";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import {
  formatAlertRowDate,
  formatAlertSubtitle,
  formatAlertTitle,
} from "@/lib/gbo-explainability/aggregate-alerts";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowProps = {
  alert: AlertSummary;
  onClick: () => void;
};

/** Fixed actor column — category label with accent bar; claim text stays aligned. */
const ALERT_ROW_GRID =
  "grid w-full grid-cols-[4.75rem_minmax(0,1fr)_auto] items-start gap-x-3 px-3 py-3 sm:gap-x-4 sm:px-4";

/** Subtitle with styled contributor names for Manual alerts. */
function AlertRowSubtitle({ alert }: { alert: AlertSummary }) {
  if (alert.manualContributors && alert.manualContributors.length > 0) {
    if (alert.actionCount === 1 && alert.manualContributors.length === 1) {
      const contributor = alert.manualContributors[0];
      return (
        <p className="truncate text-xs text-muted-foreground">
          <span className="font-medium text-slate-700">{contributor.name}</span>
          {contributor.email ? ` (${contributor.email})` : null}
          {" · "}
          {alert.entityName}
        </p>
      );
    }

    if (alert.manualContributors.length > 1) {
      return (
        <p className="truncate text-xs text-muted-foreground">
          {alert.manualContributors.map((contributor, index) => (
            <span key={contributor.id}>
              {index > 0 ? ", " : null}
              <span className="font-medium text-slate-700">{contributor.name}</span>
              {contributor.email ? ` (${contributor.email})` : null}
            </span>
          ))}
        </p>
      );
    }

    const contributor = alert.manualContributors[0];
    return (
      <p className="truncate text-xs text-muted-foreground">
        <span className="font-medium text-slate-700">{contributor.name}</span>
        {contributor.email ? ` (${contributor.email})` : null}
        {" — "}
        {contributor.changeSummary}
      </p>
    );
  }

  return (
    <p className="truncate text-xs text-muted-foreground">
      {formatAlertSubtitle(alert)}
    </p>
  );
}

export function AlertRow({ alert, onClick }: AlertRowProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded((current) => !current);
  };

  return (
    <li className="border-b border-border last:border-b-0">
      <div className={ALERT_ROW_GRID}>
        <ActorLabel
          actor={alert.actor}
          manualContributors={alert.manualContributors}
          className="mt-0.5 justify-self-start"
        />

        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="min-w-0 space-y-2.5 text-left hover:opacity-90"
        >
          <div className="flex min-w-0 items-center gap-2">
            <ClaimSentence
              claim={formatAlertTitle(alert)}
              summarySource={alert.summarySource}
              className="min-w-0 flex-1 truncate"
            />
            <AlertSignalTags alert={alert} />
          </div>
          <AlertRowSubtitle alert={alert} />
        </button>

        <div className="flex flex-col items-end gap-1 self-start">
          <time
            dateTime={alert.date}
            className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
          >
            {formatAlertRowDate(alert.date)}
          </time>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse alert details" : "Expand alert details"}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-slate-100"
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
      </div>

      {expanded ? (
        <AlertRowDetails alert={alert} onViewActionLog={onClick} />
      ) : null}
    </li>
  );
}
