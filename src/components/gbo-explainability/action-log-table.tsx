"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";

import {
  ActionDetailPanel,
  ActionDetailPanelTitle,
} from "@/components/gbo-explainability/action-detail-panel";
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
/** User column — min-w-44 (176px) + 15% ≈ 202px */
const USER_COLUMN_MIN_W = "min-w-[202px]";
const CELL_X = "px-4";
const CELL_Y = "py-3.5";

const STICKY_USER_HEADER_CLASS = cn(
  "sticky left-0 z-20 whitespace-nowrap bg-slate-50 font-medium",
  CELL_X,
  CELL_Y,
  USER_COLUMN_MIN_W,
  STICKY_USER_SHADOW,
);

function stickyUserCellClass(
  rowIndex: number,
  isSelected: boolean,
) {
  return cn(
    "sticky left-0 z-10 whitespace-nowrap align-middle",
    CELL_X,
    CELL_Y,
    USER_COLUMN_MIN_W,
    STICKY_USER_SHADOW,
    isSelected
      ? "bg-brand-50"
      : rowIndex % 2 === 1
        ? "bg-slate-50"
        : "bg-background",
    "group-hover:bg-slate-100",
  );
}

const TH_CLASS = cn("whitespace-nowrap font-medium", CELL_X, CELL_Y);
const TD_CELL = cn(
  "whitespace-nowrap align-middle font-normal truncate text-foreground",
  CELL_X,
  CELL_Y,
);
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
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-2.5">
          <h2 className="m-0 text-sm font-semibold text-muted-foreground">
            Total actions
          </h2>
          <p className="m-0 mt-0.5 text-xs text-muted-foreground">
            Showing {rows.length} of {totalCount} actions · newest first
          </p>
        </div>

        <div className="overflow-x-auto">
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
                  <td className={TD_CELL}>
                    <time dateTime={row.timestamp}>
                      {formatActionLogDate(row.timestamp)}
                    </time>
                  </td>
                  <td className={TD_CELL}>
                    <ActionStatusIndicator
                      status={row.status}
                      isRetrying={isRetrying}
                    />
                  </td>
                  <td className={cn(TD_CELL, FIXED_COLUMN_200)}>
                    {row.source}
                  </td>
                  <td className={cn(TD_CELL, FIXED_COLUMN_200)}>
                    {row.actionLabel}
                  </td>
                  <td className={TD_CELL}>{row.entityName}</td>
                  <td className={TD_CELL}>{row.entityType}</td>
                  <td className={TD_CELL}>
                    {row.entityType === "Campaign" ? row.campaignName : "—"}
                  </td>
                  <td className={TD_CELL}>{row.campaignType}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <Sheet
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
      >
        <SheetContent
          side="right"
          className="h-full w-full max-w-md overflow-y-auto p-0 data-[side=right]:sm:max-w-md"
        >
          {detailRow ? (
            <>
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle>
                  <ActionDetailPanelTitle />
                </SheetTitle>
              </SheetHeader>
              <div className="px-6 py-5">
                <ActionDetailPanel
                  row={detailRow}
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
    <div
      className={cn(
        "flex gap-2",
        actor.email ? "items-start" : "items-center",
      )}
    >
      <ActorMarkFromActor actor={actor} size="sm" />
      <div className="min-w-0 py-0.5">
        <p className="truncate text-sm font-normal leading-snug text-foreground">
          {actor.label}
        </p>
        {actor.email ? (
          <p className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">
            {actor.email}
          </p>
        ) : null}
      </div>
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
  const label = isRetrying ? STATUS_LABELS.retrying : STATUS_LABELS[status];

  if (isRetrying) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }

  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-success-700">
        <Check className="size-4 shrink-0 stroke-[2.5]" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 text-warning-700">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-error-700">
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
