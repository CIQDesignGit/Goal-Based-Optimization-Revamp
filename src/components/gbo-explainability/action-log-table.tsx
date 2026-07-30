"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";

import { LogEntryExpanded } from "@/components/gbo-explainability/log-entry-expanded";
import { ActorMarkFromActor } from "@/components/gbo-explainability/actor-mark";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatActionLogDate } from "@/lib/gbo-explainability/flatten-log-entries";
import type { ActionLogRow, ActionStatus } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ActionStatus, string> = {
  success: "Success",
  failure: "Failure",
  partial: "Partial success",
  retrying: "Retrying",
};

const STICKY_USER_SHADOW = "shadow-[1px_0_2px_0_rgba(15,23,42,0.04)]";

const STICKY_USER_HEADER_CLASS = cn(
  "sticky left-0 z-20 min-w-36 whitespace-nowrap border-r border-border bg-slate-50 px-3 py-2.5 font-medium",
  STICKY_USER_SHADOW,
);

function stickyUserCellClass(
  rowIndex: number,
  isSelected: boolean,
) {
  return cn(
    "sticky left-0 z-10 min-w-36 whitespace-nowrap border-r border-border px-3 py-2.5 align-middle",
    STICKY_USER_SHADOW,
    isSelected
      ? "bg-brand-50"
      : rowIndex % 2 === 1
        ? "bg-slate-50"
        : "bg-background",
    "group-hover:bg-slate-100",
  );
}

const TH_CLASS = "whitespace-nowrap px-3 py-2.5 font-medium";
const TD_CLASS = "whitespace-nowrap px-3 py-2.5 align-middle";
const FIXED_COLUMN_200 = "min-w-[200px] w-[200px] max-w-[200px]";

type ActionLogTableProps = {
  rows: ActionLogRow[];
  totalCount: number;
  retryingId: string | null;
  onRetry: (entryId: string) => void;
};

export function ActionLogTable({
  rows,
  totalCount,
  retryingId,
  onRetry,
}: ActionLogTableProps) {
  const [detailRow, setDetailRow] = useState<ActionLogRow | null>(null);

  return (
    <>
      <div className="space-y-0.5">
        <h2 className="m-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Total actions
        </h2>
        <p className="m-0 text-xs text-muted-foreground">
          Showing {rows.length} of {totalCount} actions · newest first
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/80 text-left text-xs font-medium text-muted-foreground">
              <th className={STICKY_USER_HEADER_CLASS}>User</th>
              <th className={TH_CLASS}>Date</th>
              <th className={TH_CLASS}>Status</th>
              <th className={cn(TH_CLASS, FIXED_COLUMN_200)}>Source</th>
              <th className={cn(TH_CLASS, FIXED_COLUMN_200)}>Action</th>
              <th className={TH_CLASS}>Entity</th>
              <th className={TH_CLASS}>Entity type</th>
              <th className={TH_CLASS}>Campaign name</th>
              <th className={cn(TH_CLASS, "min-w-max")}>Campaign type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isRetrying = retryingId === row.parentEntryId;
              const isSelected = detailRow?.id === row.id;

              return (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${row.entityName}`}
                  onClick={() => setDetailRow(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailRow(row);
                    }
                  }}
                  className={cn(
                    "group cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-slate-50/80",
                    index % 2 === 1 && "bg-slate-50/40",
                    isSelected && "bg-brand-50/60",
                  )}
                >
                  <td className={stickyUserCellClass(index, isSelected)}>
                    <UserCell actor={row.actor} />
                  </td>
                  <td className={cn(TD_CLASS, "text-muted-foreground")}>
                    <time dateTime={row.timestamp}>
                      {formatActionLogDate(row.timestamp)}
                    </time>
                  </td>
                  <td className={TD_CLASS}>
                    <ActionStatusIndicator
                      status={row.status}
                      isRetrying={isRetrying}
                    />
                  </td>
                  <td
                    className={cn(
                      TD_CLASS,
                      FIXED_COLUMN_200,
                      "truncate text-muted-foreground",
                    )}
                  >
                    {row.source}
                  </td>
                  <td
                    className={cn(
                      TD_CLASS,
                      FIXED_COLUMN_200,
                      "truncate text-foreground",
                    )}
                  >
                    {row.actionLabel}
                  </td>
                  <td
                    className={cn(
                      TD_CLASS,
                      "max-w-35 truncate font-medium text-foreground",
                    )}
                  >
                    {row.entityName}
                  </td>
                  <td className={cn(TD_CLASS, "text-muted-foreground")}>
                    {row.entityType}
                  </td>
                  <td
                    className={cn(
                      TD_CLASS,
                      "max-w-45 truncate",
                      row.entityType === "Campaign"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.entityType === "Campaign" ? row.campaignName : "—"}
                  </td>
                  <td className={cn(TD_CLASS, "min-w-max text-muted-foreground")}>
                    {row.campaignType}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
      >
        <SheetContent
          side="right"
          className="h-full w-3/4 max-w-3xl overflow-y-auto p-0 data-[side=right]:sm:max-w-3xl"
        >
          {detailRow ? (
            <>
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle>
                  {detailRow.parentEntry.isSessionGroup
                    ? "Setup session review"
                    : "Action details"}
                </SheetTitle>
              </SheetHeader>
              <div className="px-6 py-4">
                <LogEntryExpanded
                  entry={detailRow.parentEntry}
                  isRetrying={retryingId === detailRow.parentEntryId}
                  onRetry={() => onRetry(detailRow.parentEntryId)}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function UserCell({ actor }: { actor: ActionLogRow["actor"] }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <ActorMarkFromActor actor={actor} />
      <span className="text-foreground">{actor.label}</span>
    </div>
  );
}

function ActionStatusIndicator({
  status,
  isRetrying,
}: {
  status: ActionStatus;
  isRetrying: boolean;
}) {
  const label = isRetrying ? "Retrying" : STATUS_LABELS[status];

  if (isRetrying) {
    return (
      <span
        className="inline-flex items-center text-muted-foreground"
        title={label}
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  if (status === "success") {
    return (
      <span
        className="inline-flex items-center text-success-600"
        title={label}
      >
        <Check className="size-4 stroke-[2.5]" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span
        className="inline-flex items-center text-warning-600"
        title={label}
      >
        <AlertTriangle className="size-4" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-error-600" title={label}>
      <AlertCircle className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
