"use client";

import { useState } from "react";
import { ChevronDown, Loader2, RotateCcw } from "lucide-react";

import { DayPartingDiffView } from "@/components/gbo-explainability/day-parting-diff";
import { Button } from "@/components/ui/button";
import type {
  LogActionDetail,
  LogEntry,
  ValueDiff,
} from "@/lib/gbo-explainability/types";
import { canAttemptRetry } from "@/lib/gbo-explainability/retry-policy";
import { cn } from "@/lib/utils";

function DiffRows({ diffs }: { diffs: ValueDiff[] }) {
  return (
    <ul className="space-y-1.5">
      {diffs.map((d) => (
        <li
          key={`${d.field}-${d.before}-${d.after}`}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs"
        >
          <span className="font-medium text-foreground">{d.field}</span>
          <span className="text-muted-foreground">
            {d.before ?? "—"} → {d.after ?? "—"}
          </span>
          {d.changeStatus ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs capitalize text-slate-600">
              {d.changeStatus}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ChildAction({ child }: { child: LogActionDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="font-medium text-foreground">{child.label}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {child.entityName} · {child.scopeLevel}
            {child.changeStatus ? ` · ${child.changeStatus}` : ""}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {child.failure ? (
            <p className="text-xs text-error-700">
              <span className="font-medium">{child.failure.code}</span>
              {" — "}
              {child.failure.message}
            </p>
          ) : null}
          {child.diffs.length > 0 ? <DiffRows diffs={child.diffs} /> : null}
          {child.dayParting ? (
            <DayPartingDiffView diff={child.dayParting} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type LogEntryExpandedProps = {
  entry: LogEntry;
  isRetrying: boolean;
  onRetry: () => void;
};

export function LogEntryExpanded({
  entry,
  isRetrying,
  onRetry,
}: LogEntryExpandedProps) {
  const retryDecision = canAttemptRetry(entry, { hasEditAccess: true });
  const showRetry =
    entry.status === "failure" || entry.status === "partial" || isRetrying;

  return (
    <div className="space-y-4 border-l-2 border-brand-200 bg-slate-50/80 px-4 py-4 sm:px-6">
      {/* Why + impact grounding */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            Why
          </p>
          <p className="mt-1 text-sm text-foreground">{entry.reason}</p>
          {entry.actor.triggerOrRule ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Trigger: {entry.actor.triggerOrRule}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            Expected impact
          </p>
          <p className="mt-1 text-sm text-foreground">
            {entry.impact ?? "Impact pending"}
          </p>
          {entry.summarySource === "ai" ? (
            <p className="mt-1 text-2xs text-muted-foreground">
              AI-generated — verify numbers against the detail below
            </p>
          ) : null}
        </div>
      </div>

      {/* Actor / scope meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Actor:{" "}
          <span className="text-foreground">
            {entry.actor.label}
            {entry.actor.email ? ` · ${entry.actor.email}` : ""}
          </span>
        </span>
        <span>
          Scope:{" "}
          <span className="text-foreground">
            {entry.scopeLevel} · {entry.entityName}
          </span>
        </span>
        {entry.batch ? (
          <span>
            Batch:{" "}
            <span className="text-foreground">
              {entry.batch.succeeded} of {entry.batch.total} succeeded
              {entry.batch.failed > 0
                ? ` · ${entry.batch.failed} failed`
                : ""}
            </span>
          </span>
        ) : null}
        {entry.retryOutcomeLabel ? (
          <span className="text-foreground">{entry.retryOutcomeLabel}</span>
        ) : null}
      </div>

      {entry.failure ? (
        <div className="rounded-md border border-error-100 bg-error-50 px-3 py-2 text-xs text-error-700">
          <span className="font-medium">{entry.failure.category}</span>
          {" · "}
          {entry.failure.code}: {entry.failure.message}
        </div>
      ) : null}

      {entry.diffs && entry.diffs.length > 0 ? (
        <div>
          <p className="mb-2 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            Before / after
          </p>
          <DiffRows diffs={entry.diffs} />
        </div>
      ) : null}

      {entry.dayParting ? (
        <div>
          <p className="mb-2 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            Day-parting schedule
          </p>
          <DayPartingDiffView diff={entry.dayParting} />
        </div>
      ) : null}

      {entry.children && entry.children.length > 0 ? (
        <div className="space-y-2">
          <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {entry.isSessionGroup ? "Session actions" : "Actions in this batch"}
          </p>
          {entry.children.map((child) => (
            <ChildAction key={child.id} child={child} />
          ))}
        </div>
      ) : null}

      {showRetry ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!retryDecision.ok || isRetrying}
            title={!retryDecision.ok ? retryDecision.reason : undefined}
            onClick={onRetry}
          >
            {isRetrying ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            {isRetrying ? "Retrying…" : "Retry failed actions"}
          </Button>
          {!retryDecision.ok ? (
            <span className="text-xs text-muted-foreground">
              {retryDecision.reason}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
