"use client";

import { ChevronDown } from "lucide-react";

import { ActorBadge } from "@/components/gbo-explainability/actor-badge";
import { ClaimSentence } from "@/components/gbo-explainability/claim-sentence";
import { LogEntryExpanded } from "@/components/gbo-explainability/log-entry-expanded";
import { Badge } from "@/components/ui/badge";
import { formatLocalTimestamp } from "@/lib/gbo-explainability/filter-entries";
import type { ActionStatus, LogEntry } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  ActionStatus,
  { label: string; className: string }
> = {
  success: {
    label: "Success",
    className: "bg-success-100 text-success-700",
  },
  failure: {
    label: "Failure",
    className: "bg-error-100 text-error-700",
  },
  partial: {
    label: "Partial",
    className: "bg-warning-100 text-warning-700",
  },
  retrying: {
    label: "Retrying",
    className: "bg-info-100 text-info-700",
  },
};

type LogEntryRowProps = {
  entry: LogEntry;
  expanded: boolean;
  isRetrying: boolean;
  onToggle: () => void;
  onRetry: () => void;
};

export function LogEntryRow({
  entry,
  expanded,
  isRetrying,
  onToggle,
  onRetry,
}: LogEntryRowProps) {
  const status = STATUS_STYLES[isRetrying ? "retrying" : entry.status];
  const failed =
    entry.status === "failure" || entry.status === "partial";

  return (
    <li
      className={cn(
        "border-b border-border last:border-b-0",
        failed && "border-l-2 border-l-error-400",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50/80 sm:gap-4 sm:px-4"
      >
        <ActorBadge actor={entry.actor} className="mt-0.5" />

        <div className="min-w-0 flex-1 space-y-1">
          <ClaimSentence
            claim={
              entry.isSessionGroup
                ? (entry.sessionSummary ?? entry.claim)
                : entry.claim
            }
            summarySource={entry.summarySource}
          />
          <p className="truncate text-xs text-muted-foreground">
            {entry.actor.kind === "human"
              ? `${entry.actor.label}${entry.actor.email ? ` · ${entry.actor.email}` : ""}`
              : entry.actor.triggerOrRule
                ? entry.actor.triggerOrRule
                : entry.reason}
            {" · "}
            {entry.entityName}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("rounded-full border-0", status.className)}
            >
              {entry.batch && entry.status === "partial"
                ? `${entry.batch.succeeded}/${entry.batch.total}`
                : status.label}
            </Badge>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                expanded && "rotate-180",
              )}
            />
          </div>
          <time
            className="text-2xs text-muted-foreground"
            dateTime={entry.timestamp}
          >
            {formatLocalTimestamp(entry.timestamp)}
          </time>
        </div>
      </button>

      {expanded ? (
        <LogEntryExpanded
          entry={entry}
          isRetrying={isRetrying}
          onRetry={onRetry}
        />
      ) : null}
    </li>
  );
}
