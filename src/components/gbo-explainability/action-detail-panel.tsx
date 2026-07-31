"use client";

import type { ReactNode } from "react";
import { ArrowRight, Info, Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildActionDetailFields,
  buildLogEntryDetailFields,
  STATUS_LABELS,
  type ConditionDisplay,
} from "@/lib/gbo-explainability/action-detail-fields";
import { canAttemptRetry } from "@/lib/gbo-explainability/retry-policy";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import type {
  ActionLogRow,
  ActionStatus,
  LogEntry,
} from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASS: Record<ActionStatus, string> = {
  success: "border-transparent bg-success-600 text-white hover:bg-success-600",
  failure: "border-transparent bg-error-600 text-white hover:bg-error-600",
  partial: "border-transparent bg-warning-600 text-white hover:bg-warning-600",
  retrying: "border-transparent bg-info-600 text-white hover:bg-info-600",
};

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm leading-relaxed text-foreground">{value}</div>
    </div>
  );
}

/** Highlights before → after values in the Condition row. */
function ConditionField({ condition }: { condition: ConditionDisplay }) {
  const hasChange = condition.before && condition.after;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground">Condition</p>
      <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2.5">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {condition.field}
        </p>

        {hasChange ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white px-2 py-1 font-mono text-sm text-muted-foreground line-through decoration-slate-300 ring-1 ring-slate-200">
              {condition.before}
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-brand-500"
              aria-hidden
            />
            <span className="rounded-md bg-brand-50 px-2 py-1 font-mono text-sm font-semibold text-brand-800 ring-1 ring-brand-200">
              {condition.after}
            </span>
          </div>
        ) : condition.after ? (
          <span className="rounded-md bg-brand-50 px-2 py-1 font-mono text-sm font-semibold text-brand-800 ring-1 ring-brand-200">
            Set to {condition.after}
          </span>
        ) : condition.before ? (
          <span className="rounded-md bg-white px-2 py-1 font-mono text-sm text-muted-foreground line-through ring-1 ring-slate-200">
            {condition.before}
          </span>
        ) : (
          <p className="text-sm text-foreground">
            {condition.text ? (
              <>
                <span className="font-medium">{condition.field}</span>{" "}
                {condition.text}
              </>
            ) : (
              condition.field
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function renderDetailFields(
  fields: { label: string; value: ReactNode }[],
  condition: ConditionDisplay | null,
) {
  const campaignIndex = fields.findIndex((field) => field.label === "Campaign Name");
  const splitAt = campaignIndex >= 0 ? campaignIndex + 1 : 2;

  return (
    <>
      {fields.slice(0, splitAt).map((field) => (
        <DetailField key={field.label} label={field.label} value={field.value} />
      ))}
      {condition ? <ConditionField condition={condition} /> : null}
      {fields.slice(splitAt).map((field) => (
        <DetailField key={field.label} label={field.label} value={field.value} />
      ))}
    </>
  );
}

type ActionDetailPanelProps = {
  row?: ActionLogRow;
  entry?: LogEntry;
  isRetrying?: boolean;
  onRetry?: () => void;
};

/** Simple key-value side panel — no summary tables or nested accordions. */
export function ActionDetailPanel({
  row,
  entry,
  isRetrying = false,
  onRetry,
}: ActionDetailPanelProps) {
  const resolvedEntry = row?.parentEntry ?? entry;
  const { fields, condition } = row
    ? buildActionDetailFields(row, { isRetrying })
    : entry
      ? buildLogEntryDetailFields(entry, { isRetrying })
      : { fields: [], condition: null };

  const status: ActionStatus = isRetrying
    ? "retrying"
    : (row?.status ?? entry?.status ?? "success");
  const retryDecision = resolvedEntry
    ? canAttemptRetry(resolvedEntry, { hasEditAccess: true })
    : { ok: false, reason: "No entry" };
  const showRetry =
    onRetry &&
    resolvedEntry &&
    (resolvedEntry.status === "failure" ||
      resolvedEntry.status === "partial" ||
      isRetrying);

  return (
    <div className="space-y-6">
      <dl className="space-y-5">
        {renderDetailFields(fields, condition)}

        <DetailField
          label="Status"
          value={
            <Badge
              className={cn(
                "rounded px-2 py-0.5 text-sm font-normal",
                STATUS_BADGE_CLASS[status],
              )}
            >
              {isRetrying ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  {STATUS_LABELS.retrying}
                </span>
              ) : (
                STATUS_LABELS[status]
              )}
            </Badge>
          }
        />
      </dl>

      {resolvedEntry?.failure ? (
        <p className="rounded-md border border-error-100 bg-error-50 px-3 py-2 text-xs text-error-700">
          <span className="font-medium">{resolvedEntry.failure.code}</span>
          {" — "}
          {resolvedEntry.failure.message}
        </p>
      ) : null}

      {showRetry ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            className={explainabilityActionable.primaryOutlineButton}
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

export function ActionDetailPanelTitle() {
  return (
    <span className="inline-flex items-center gap-2">
      <Info className="size-4 text-muted-foreground" aria-hidden />
      Action details
    </span>
  );
}
