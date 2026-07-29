"use client";

import { ChevronRight } from "lucide-react";

import { ActorBadge } from "@/components/gbo-explainability/actor-badge";
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

export function AlertRow({ alert, onClick }: AlertRowProps) {
  const failed =
    alert.status === "failure" || alert.status === "partial";

  return (
    <li
      className={cn(
        "border-b border-border last:border-b-0",
        failed && "border-l-2 border-l-error-400",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50/80 sm:gap-4 sm:px-4"
      >
        <ActorBadge actor={alert.actor} className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1 space-y-1">
          <ClaimSentence
            claim={formatAlertTitle(alert)}
            summarySource={alert.summarySource}
          />
          <AlertSignalTags alert={alert} />
          <p className="truncate text-xs text-muted-foreground">
            {formatAlertSubtitle(alert)}
          </p>
        </div>

        <ChevronRight
          className="mt-1 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </button>
    </li>
  );
}
