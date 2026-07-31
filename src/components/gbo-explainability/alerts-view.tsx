"use client";

import { AlertRow } from "@/components/gbo-explainability/alert-row";
import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
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
  formatAlertDateSeparator,
  groupAlertsByDate,
} from "@/lib/gbo-explainability/aggregate-alerts";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertsViewProps = {
  alerts: AlertSummary[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAlertClick: (alert: AlertSummary) => void;
};

export function AlertsView({
  alerts,
  page,
  totalPages,
  onPageChange,
  onAlertClick,
}: AlertsViewProps) {
  if (alerts.length === 0) {
    return <ActionLogsEmptyState kind="no-activity" />;
  }

  const dateGroups = groupAlertsByDate(alerts);

  return (
    <ExplainabilityPanel>
      <ExplainabilityPanelHeader title="Alerts" />

      <div className="divide-y divide-slate-100">
        {dateGroups.map((group) => (
          <section key={group.date} aria-label={formatAlertDateSeparator(group.date)}>
            <header className="sticky top-0 z-10 border-b border-slate-100/80 bg-slate-50/95 px-5 py-2 backdrop-blur-sm">
              <h3 className="text-[11px] font-semibold leading-none tracking-wide text-slate-500 uppercase">
                {formatAlertDateSeparator(group.date)}
              </h3>
            </header>

            <ul className="divide-y divide-slate-100">
              {group.alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onClick={() => onAlertClick(alert)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="border-t border-slate-100/80 bg-slate-50/60 px-5 py-2">
        <Pagination aria-label="Alerts pagination" className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
                className={cn(page <= 1 && "pointer-events-none opacity-40")}
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
  );
}
