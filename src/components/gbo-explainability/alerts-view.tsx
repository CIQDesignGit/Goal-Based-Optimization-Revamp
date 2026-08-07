"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import {
  AlertDetailEmptyState,
  AlertDetailPane,
} from "@/components/gbo-explainability/alert-detail-pane";
import { AlertMasterCard } from "@/components/gbo-explainability/alert-master-card";
import { ExplainabilityPanel } from "@/components/gbo-explainability/explainability-panel";
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
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
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
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const alertIdsKey = useMemo(
    () => alerts.map((alert) => alert.id).join("\0"),
    [alerts],
  );

  useEffect(() => {
    setSelectedAlertId(null);
  }, [page]);

  const resolvedSelectedId = useMemo(() => {
    if (alerts.length === 0) return null;
    if (
      selectedAlertId &&
      alerts.some((alert) => alert.id === selectedAlertId)
    ) {
      return selectedAlertId;
    }
    return alerts[0]?.id ?? null;
  }, [alerts, selectedAlertId, alertIdsKey]);

  const handleSelectAlert = useCallback((alertId: string) => {
    setSelectedAlertId(alertId);
  }, []);

  if (alerts.length === 0) {
    return <ActionLogsEmptyState kind="no-activity" />;
  }

  const dateGroups = groupAlertsByDate(alerts);
  const selectedAlert =
    alerts.find((alert) => alert.id === resolvedSelectedId) ?? null;

  return (
    <ExplainabilityPanel variant="flush">
      <div className="flex min-h-0 flex-1 divide-x divide-slate-200/80">
        <aside
          className="flex w-[400px] shrink-0 flex-col bg-slate-50/60"
          aria-label="Alerts list"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100/80 bg-white px-4 py-3">
            <h2 className="m-0 text-sm font-semibold tracking-tight text-slate-800">
              Alerts
            </h2>
            <p className={cn("m-0 whitespace-nowrap", explainabilityType.l4)}>
              Showing {alerts.length}
            </p>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-0",
              // Overlay-style scrollbar — no track / rail edge
              "[scrollbar-width:thin] [scrollbar-color:rgb(203_213_225_/_0.8)_transparent]",
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:bg-slate-300/80",
              "[&::-webkit-scrollbar-thumb]:hover:bg-slate-400/80",
            )}
          >
            {dateGroups.map((group) => (
              <section
                key={group.date}
                aria-label={formatAlertDateSeparator(group.date)}
                className="mb-4 last:mb-0"
              >
                <header className="sticky top-0 z-10 mb-2 bg-slate-50 px-1 py-2">
                  <h3 className="text-[11px] font-semibold leading-none tracking-wide text-slate-500 uppercase">
                    {formatAlertDateSeparator(group.date)}
                  </h3>
                </header>

                <ul className="space-y-2">
                  {group.alerts.map((alert) => (
                    <AlertMasterCard
                      key={alert.id}
                      alert={alert}
                      selected={alert.id === resolvedSelectedId}
                      onSelect={() => handleSelectAlert(alert.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <footer className="shrink-0 border-t border-slate-100/80 bg-slate-50/60 px-4 py-2">
            <Pagination
              aria-label="Alerts pagination"
              className="mx-0 w-auto justify-end"
            >
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
                        className={cn(
                          pageNumber === page &&
                            explainabilityActionable.paginationActive,
                        )}
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
        </aside>

        <main
          className="min-w-0 flex-1 bg-slate-50"
          aria-label="Alert details"
        >
          {selectedAlert ? (
            <AlertDetailPane
              key={selectedAlert.id}
              alert={selectedAlert}
              onViewActionLog={() => onAlertClick(selectedAlert)}
            />
          ) : (
            <AlertDetailEmptyState />
          )}
        </main>
      </div>
    </ExplainabilityPanel>
  );
}
