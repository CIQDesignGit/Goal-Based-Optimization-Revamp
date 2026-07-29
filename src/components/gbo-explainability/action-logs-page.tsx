"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import { ActionLogTable } from "@/components/gbo-explainability/action-log-table";
import { ActionLogsToolbar } from "@/components/gbo-explainability/action-logs-toolbar";
import { AlertsView } from "@/components/gbo-explainability/alerts-view";
import { usePageTitle } from "@/components/layout/page-title-context";
import { Button } from "@/components/ui/button";
import {
  aggregateAlerts,
  alertRoleLabel,
  formatAlertDate,
} from "@/lib/gbo-explainability/aggregate-alerts";
import {
  downloadCsv,
  entriesToCsv,
  filterTodaysAllyAi,
} from "@/lib/gbo-explainability/export-csv";
import {
  buildDefaultFilters,
  filterEntries,
  hasDateFilter,
  searchEntries,
  sortNewestFirst,
  toIsoDate,
} from "@/lib/gbo-explainability/filter-entries";
import {
  INITIAL_MOCK_ENTRIES,
  MOCK_ACCOUNT_CONFIG,
} from "@/lib/gbo-explainability/mock-data";
import {
  filterActionLogRows,
  flattenLogEntries,
  sortActionLogRowsNewestFirst,
} from "@/lib/gbo-explainability/flatten-log-entries";
import { buildRetryResult } from "@/lib/gbo-explainability/retry-policy";
import type {
  ActiveFilterChip,
  AlertSummary,
  FilterState,
  LogEntry,
  PageView,
} from "@/lib/gbo-explainability/types";

const PAGE_SIZE = 50;

function chipsFromFilters(filters: FilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.actionStatus !== "all") {
    chips.push({
      id: "status",
      key: "actionStatus",
      value: filters.actionStatus,
      label: `Status: ${filters.actionStatus}`,
      scope: "common",
    });
  }

  if (filters.actorRole !== "all") {
    const isAlertDrill =
      hasDateFilter(filters) && filters.dateFrom === filters.dateTo;
    if (!isAlertDrill) {
      chips.push({
        id: "actorRole",
        key: "actorRole",
        value: filters.actorRole,
        label: `Role: ${alertRoleLabel(filters.actorRole)}`,
        scope: "detail",
      });
    }
  }

  if (filters.user !== "all") {
    chips.push({
      id: "user",
      key: "user",
      value: filters.user,
      label: `Person: ${filters.user}`,
      scope: "detail",
    });
  }

  if (filters.changeStatus !== "all") {
    chips.push({
      id: "changeStatus",
      key: "changeStatus",
      value: filters.changeStatus,
      label: `Change: ${filters.changeStatus}`,
      scope: "detail",
    });
  }

  if (filters.setupStep !== "all") {
    chips.push({
      id: "setupStep",
      key: "setupStep",
      value: filters.setupStep,
      label: `Step: ${filters.setupStep}`,
      scope: "detail",
    });
  }

  if (filters.actionType !== "all") {
    chips.push({
      id: "actionType",
      key: "actionType",
      value: filters.actionType,
      label: `Action: ${filters.actionType}`,
      scope: "detail",
    });
  }

  if (filters.failureCategory !== "all") {
    chips.push({
      id: "failureCategory",
      key: "failureCategory",
      value: filters.failureCategory,
      label: `Failure: ${filters.failureCategory}`,
      scope: "detail",
    });
  }

  if (filters.outOfBudgetOnly) {
    chips.push({
      id: "outOfBudget",
      key: "outOfBudgetOnly",
      value: "true",
      label: "Out of budget",
      scope: "detail",
    });
  }

  if (
    hasDateFilter(filters) &&
    filters.dateFrom === filters.dateTo &&
    filters.actorRole !== "all"
  ) {
    chips.push({
      id: "alertDrill",
      key: "alertDrill",
      value: `${filters.dateFrom}:${filters.actorRole}`,
      label: `${alertRoleLabel(filters.actorRole)} · ${formatAlertDate(filters.dateFrom)}`,
      scope: "detail",
    });
  }

  return chips;
}

export function ActionLogsPage() {
  const config = MOCK_ACCOUNT_CONFIG;
  const { setBreadcrumbs } = usePageTitle();

  const [entries, setEntries] = useState<LogEntry[]>(INITIAL_MOCK_ENTRIES);
  const [view, setView] = useState<PageView>("alerts");
  const [filters, setFilters] = useState<FilterState>(buildDefaultFilters);
  const [search, setSearch] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", href: "/" },
      { label: "GBO", href: "/" },
      { label: "Explainability", href: "/explainability-dashboard" },
      { label: view === "alerts" ? "Alerts" : "Action Log" },
    ]);
    return () => setBreadcrumbs([]);
  }, [view, setBreadcrumbs]);

  const chips = useMemo(() => chipsFromFilters(filters), [filters]);

  const alerts = useMemo(() => aggregateAlerts(entries), [entries]);

  const filteredEntries = useMemo(() => {
    const entryFilters = { ...filters, actionStatus: "all" as const };
    const byFilters = filterEntries(entries, entryFilters);
    return searchEntries(byFilters, search);
  }, [entries, filters, search]);

  const flatRows = useMemo(() => {
    const rows = flattenLogEntries(filteredEntries);
    const byStatus = filterActionLogRows(rows, filters.actionStatus);
    return sortActionLogRowsNewestFirst(byStatus);
  }, [filteredEntries, filters.actionStatus]);

  const totalPages = Math.max(1, Math.ceil(flatRows.length / PAGE_SIZE));
  const pageRows = flatRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filtered = useMemo(
    () => sortNewestFirst(filteredEntries),
    [filteredEntries],
  );

  const todayAlly = useMemo(() => filterTodaysAllyAi(entries), [entries]);

  const hasActiveNarrowing = chips.length > 0 || search.trim().length > 0;

  function patchFilters(patch: Partial<FilterState>) {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, ...patch }));
      setPage(1);
    });
  }

  function handleViewChange(next: PageView) {
    setView(next);
    setPage(1);
    if (next === "alerts") {
      setSearch("");
    }
    if (next === "action-log") {
      setSearch("");
      setFilters(buildDefaultFilters());
    }
  }

  function handleAlertClick(alert: AlertSummary) {
    setView("action-log");
    setPage(1);
    setSearch("");
    setFilters((prev) => ({
      ...prev,
      dateFrom: alert.date,
      dateTo: alert.date,
      actorRole: alert.role,
      actionStatus: "all",
      user: "all",
      changeStatus: "all",
      setupStep: "all",
      actionType: "all",
      failureCategory: "all",
      outOfBudgetOnly: false,
    }));
  }

  function removeChip(chipId: string) {
    const chip = chips.find((c) => c.id === chipId);
    if (!chip) return;

    if (chip.id === "alertDrill") {
      patchFilters({
        dateFrom: "",
        dateTo: "",
        actorRole: "all",
      });
      return;
    }

    if (chip.key === "outOfBudgetOnly") {
      patchFilters({ outOfBudgetOnly: false });
      return;
    }
    if (chip.key === "actionStatus") {
      patchFilters({ actionStatus: "all" });
      return;
    }
    patchFilters({ [chip.key]: "all" } as Partial<FilterState>);
  }

  function clearAll() {
    setFilters(buildDefaultFilters());
    setSearch("");
    setPage(1);
  }

  function handleExport() {
    const csv = entriesToCsv(filtered);
    const suffix = hasDateFilter(filters)
      ? filters.dateFrom
      : toIsoDate(new Date());
    downloadCsv(`action-log-${suffix}.csv`, csv);
  }

  function handleDownloadToday() {
    const csv = entriesToCsv(todayAlly);
    downloadCsv("ally-ai-today.csv", csv);
  }

  function handleRetry(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    setRetryingId(entryId);
    window.setTimeout(() => {
      const { updatedOriginal, newEntry } = buildRetryResult(
        entry,
        "You",
        "you@commerceiq.ai",
      );
      setEntries((prev) => [
        newEntry,
        ...prev.map((e) => (e.id === entryId ? updatedOriginal : e)),
      ]);
      setRetryingId(null);
    }, 1200);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <ActionLogsToolbar
        view={view}
        onViewChange={handleViewChange}
        filters={filters}
        onFiltersChange={patchFilters}
        chips={view === "action-log" ? chips : []}
        onRemoveChip={removeChip}
        onClearAll={clearAll}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        config={config}
        filteredCount={flatRows.length}
        onExport={handleExport}
        onDownloadToday={handleDownloadToday}
        todayAllyCount={todayAlly.length}
        alertCount={alerts.length}
      />

      {view === "alerts" ? (
        <AlertsView alerts={alerts} onAlertClick={handleAlertClick} />
      ) : flatRows.length === 0 ? (
        <ActionLogsEmptyState
          kind={hasActiveNarrowing ? "no-results" : "no-activity"}
          onClearFilters={hasActiveNarrowing ? clearAll : undefined}
        />
      ) : (
        <>
          <ActionLogTable
            rows={pageRows}
            totalCount={flatRows.length}
            retryingId={retryingId}
            onRetry={handleRetry}
          />

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
