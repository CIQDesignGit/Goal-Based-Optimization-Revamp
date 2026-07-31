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
import { ExportPopover } from "@/components/gbo-explainability/export-popover";
import {
  ExplainabilityPanel,
  ExplainabilityPanelHeader,
} from "@/components/gbo-explainability/explainability-panel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

const STICKY_USER_SHADOW = "shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]";
const USER_COLUMN_MIN_W = "min-w-[202px]";

const TH_CLASS =
  "whitespace-nowrap px-4 py-2 text-[10px] font-medium tracking-wider text-slate-500 uppercase";

const STICKY_USER_HEADER_CLASS = cn(
  "sticky left-0 z-20 bg-slate-50/50",
  TH_CLASS,
  USER_COLUMN_MIN_W,
  STICKY_USER_SHADOW,
);

function stickyUserCellClass(isSelected: boolean) {
  return cn(
    "sticky left-0 z-10 whitespace-nowrap align-middle px-4 py-3",
    USER_COLUMN_MIN_W,
    STICKY_USER_SHADOW,
    isSelected ? "bg-brand-50/80 group-hover:bg-brand-50/80" : "bg-white group-hover:bg-brand-25",
  );
}

function bodyCellClass(isSelected: boolean, extra?: string) {
  return cn(
    TD_CELL,
    extra,
    isSelected ? "bg-brand-50/60 group-hover:bg-brand-50/60" : "bg-white group-hover:bg-brand-25",
  );
}

const TD_CELL = "whitespace-nowrap align-middle truncate px-4 py-3";
const FIXED_COLUMN_200 = "min-w-[200px] w-[200px] max-w-[200px]";

type ActionLogTableProps = {
  rows: ActionLogRow[];
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  retryingId: string | null;
  onRetry: (entryId: string) => void;
  filteredCount: number;
  todayAllyCount: number;
  onExport: () => void;
  onDownloadToday: () => void;
};

export function ActionLogTable({
  rows,
  totalCount,
  page,
  totalPages,
  onPageChange,
  retryingId,
  onRetry,
  filteredCount,
  todayAllyCount,
  onExport,
  onDownloadToday,
}: ActionLogTableProps) {
  const [detailRow, setDetailRow] = useState<ActionLogRow | null>(null);

  return (
    <>
      <ExplainabilityPanel>
        <ExplainabilityPanelHeader
          title="Total actions"
          description={`Showing ${rows.length} of ${totalCount} actions · newest first`}
          actions={
            <ExportPopover
              filteredCount={filteredCount}
              todayAllyCount={todayAllyCount}
              onExportFiltered={onExport}
              onExportTodayAlly={onDownloadToday}
            />
          }
        />

        <div className="overflow-hidden border-t border-slate-100/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="border-b border-slate-100/80 bg-slate-50/50 text-left">
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
                  {rows.map((row) => {
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
                          "group cursor-pointer border-b border-slate-100 transition-colors last:border-b-0",
                          isSelected && "bg-brand-50/60",
                        )}
                      >
                        <td className={stickyUserCellClass(isSelected)}>
                          <UserCell actor={row.actor} />
                        </td>
                        <td className={bodyCellClass(isSelected)}>
                          <time
                            dateTime={row.timestamp}
                            className="text-xs tabular-nums text-slate-500"
                          >
                            {formatActionLogDate(row.timestamp)}
                          </time>
                        </td>
                        <td className={bodyCellClass(isSelected)}>
                          <ActionStatusIndicator
                            status={row.status}
                            isRetrying={isRetrying}
                          />
                        </td>
                        <td
                          className={bodyCellClass(
                            isSelected,
                            cn(FIXED_COLUMN_200, "text-xs text-slate-500 sm:text-sm"),
                          )}
                        >
                          {row.source}
                        </td>
                        <td
                          className={bodyCellClass(
                            isSelected,
                            cn(
                              FIXED_COLUMN_200,
                              "text-sm font-medium text-slate-800",
                            ),
                          )}
                        >
                          {row.actionLabel}
                        </td>
                        <td
                          className={bodyCellClass(
                            isSelected,
                            "text-sm font-medium text-slate-800",
                          )}
                        >
                          {row.entityName}
                        </td>
                        <td
                          className={bodyCellClass(
                            isSelected,
                            "text-xs text-slate-500 sm:text-sm",
                          )}
                        >
                          {row.entityType}
                        </td>
                        <td
                          className={bodyCellClass(
                            isSelected,
                            "text-xs text-slate-600 sm:text-sm",
                          )}
                        >
                          {row.entityType === "Campaign" ? row.campaignName : "—"}
                        </td>
                        <td
                          className={bodyCellClass(
                            isSelected,
                            "text-xs text-slate-500 sm:text-sm",
                          )}
                        >
                          {row.campaignType}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>

        <footer className="border-t border-slate-100/80 bg-slate-50/60 px-5 py-2">
          <Pagination aria-label="Action log pagination" className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                  className={cn(
                    page <= 1 && "pointer-events-none opacity-40",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      aria-label={`Go to page ${pageNumber}`}
                      onClick={(event) => {
                        event.preventDefault();
                        onPageChange(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={page >= totalPages}
                  tabIndex={page >= totalPages ? -1 : undefined}
                  className={cn(
                    page >= totalPages && "pointer-events-none opacity-40",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </footer>
      </ExplainabilityPanel>

      <Sheet
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
      >
        <SheetContent
          side="right"
          className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200/80 p-0 shadow-xl data-[side=right]:sm:max-w-md"
        >
          {detailRow ? (
            <>
              <SheetHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <SheetTitle className="text-base font-semibold text-slate-800">
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
        "flex gap-2.5",
        actor.email ? "items-start" : "items-center",
      )}
    >
      <ActorMarkFromActor actor={actor} size="sm" />
      <div className="min-w-0 py-0.5">
        <p className="truncate text-sm font-medium leading-snug text-slate-800">
          {actor.label}
        </p>
        {actor.email ? (
          <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500">
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
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }

  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
        <Check className="size-3.5 shrink-0 stroke-[2.5]" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-error-50 px-2 py-0.5 text-xs font-medium text-error-700">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
