"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { ActorLabel } from "@/components/gbo-explainability/actor-label";
import { AlertRowDetails } from "@/components/gbo-explainability/alert-row-details";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { AlertSignalTags } from "@/components/gbo-explainability/alert-signal-tags";
import {
  alertRowTimestampValue,
  formatAlertRowTimestamp,
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
  "grid w-full grid-cols-[5rem_minmax(0,1fr)_auto] items-start gap-x-4 px-5 py-4 sm:grid-cols-[5.25rem_minmax(0,1fr)_auto]";

/** Subtitle with styled contributor names for Manual alerts. */
function AlertRowSubtitle({ alert }: { alert: AlertSummary }) {
  if (alert.manualContributors && alert.manualContributors.length > 0) {
    if (alert.actionCount === 1 && alert.manualContributors.length === 1) {
      const contributor = alert.manualContributors[0];
      return (
        <p className="truncate text-xs leading-relaxed text-slate-500">
          <span className="font-medium text-slate-700">{contributor.name}</span>
          {contributor.email ? ` (${contributor.email})` : null}
          {" · "}
          {alert.entityName}
        </p>
      );
    }

    if (alert.manualContributors.length > 1) {
      return (
        <p className="truncate text-xs leading-relaxed text-slate-500">
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
      <p className="truncate text-xs leading-relaxed text-slate-500">
        <span className="font-medium text-slate-700">{contributor.name}</span>
        {contributor.email ? ` (${contributor.email})` : null}
        {" — "}
        {contributor.changeSummary}
      </p>
    );
  }

  return (
    <p className="truncate text-xs leading-relaxed text-slate-500">
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
          className="mt-0.5 justify-self-start"
        />

        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="min-w-0 space-y-2 text-left"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
            <ClaimSentence
              claim={formatAlertTitle(alert)}
              summarySource={alert.summarySource}
              className="min-w-0 flex-1"
            />
            <AlertSignalTags alert={alert} />
          </div>
          <AlertRowSubtitle alert={alert} />
        </button>

        <div className="flex flex-col items-end gap-1.5 self-start pt-0.5">
          <time
            dateTime={alertRowTimestampValue(alert)}
            className="shrink-0 whitespace-nowrap text-[11px] font-medium tabular-nums text-slate-400"
          >
            {formatAlertRowTimestamp(alert)}
          </time>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse alert details" : "Expand alert details"}
            className={cn(
              "shrink-0 rounded-md p-1 text-slate-400 transition-colors",
              "hover:bg-slate-100 hover:text-slate-600",
              expanded && "bg-slate-100 text-slate-600",
            )}
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
        <div className="border-t border-slate-100/80">
          <AlertRowDetails alert={alert} onViewActionLog={onClick} />
        </div>
      ) : null}
    </li>
  );
}
