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
  searchAlerts,
} from "@/lib/gbo-explainability/aggregate-alerts";
import {
  downloadCsv,
  entriesToCsv,
  filterTodaysAllyAi,
} from "@/lib/gbo-explainability/export-csv";
import {
  buildDefaultFilters,
  filterEntries,
  filterEntriesForAlerts,
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
  filterActionLogRowsByRetailer,
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

function filterChip(
  chip: Omit<ActiveFilterChip, "label"> & { label?: string },
): ActiveFilterChip {
  const label =
    chip.label ?? `${chip.categoryLabel}: ${chip.valueLabel}`.trim();
  return { ...chip, label };
}

function chipsFromFilters(filters: FilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.actionStatus !== "all") {
    chips.push(
      filterChip({
        id: "status",
        key: "actionStatus",
        value: filters.actionStatus,
        categoryLabel: "Status",
        valueLabel:
          filters.actionStatus.charAt(0).toUpperCase() +
          filters.actionStatus.slice(1),
        scope: "common",
      }),
    );
  }

  if (filters.actorRole !== "all") {
    const isAlertDrill =
      hasDateFilter(filters) && filters.dateFrom === filters.dateTo;
    if (!isAlertDrill) {
      chips.push(
        filterChip({
          id: "actorRole",
          key: "actorRole",
          value: filters.actorRole,
          categoryLabel: "Role",
          valueLabel: alertRoleLabel(filters.actorRole),
          scope: "detail",
        }),
      );
    }
  }

  if (filters.user !== "all") {
    chips.push(
      filterChip({
        id: "user",
        key: "user",
        value: filters.user,
        categoryLabel: "Person",
        valueLabel: filters.user,
        scope: "detail",
      }),
    );
  }

  if (filters.changeStatus !== "all") {
    chips.push(
      filterChip({
        id: "changeStatus",
        key: "changeStatus",
        value: filters.changeStatus,
        categoryLabel: "Change",
        valueLabel:
          filters.changeStatus.charAt(0).toUpperCase() +
          filters.changeStatus.slice(1),
        scope: "detail",
      }),
    );
  }

  if (filters.setupStep !== "all") {
    chips.push(
      filterChip({
        id: "setupStep",
        key: "setupStep",
        value: filters.setupStep,
        categoryLabel: "Step",
        valueLabel: filters.setupStep,
        scope: "detail",
      }),
    );
  }

  if (filters.actionType !== "all") {
    chips.push(
      filterChip({
        id: "actionType",
        key: "actionType",
        value: filters.actionType,
        categoryLabel: "Action",
        valueLabel:
          filters.actionType.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        scope: "detail",
      }),
    );
  }

  if (filters.failureCategory !== "all") {
    chips.push(
      filterChip({
        id: "failureCategory",
        key: "failureCategory",
        value: filters.failureCategory,
        categoryLabel: "Failure",
        valueLabel: filters.failureCategory.replace(/-/g, " "),
        scope: "detail",
      }),
    );
  }

  if (filters.outOfBudgetOnly) {
    chips.push(
      filterChip({
        id: "outOfBudget",
        key: "outOfBudgetOnly",
        value: "true",
        categoryLabel: "Budget",
        valueLabel: "Out of budget",
        scope: "detail",
      }),
    );
  }

  const retailerChips: Array<{
    id: string;
    key: keyof FilterState;
    categoryLabel: string;
    value: string;
  }> = [
    {
      id: "entityType",
      key: "entityType",
      categoryLabel: "Entity Type",
      value: filters.entityType,
    },
    {
      id: "campaignType",
      key: "campaignType",
      categoryLabel: "Campaign Type",
      value: filters.campaignType,
    },
    {
      id: "matchType",
      key: "matchType",
      categoryLabel: "Match Type",
      value: filters.matchType,
    },
    { id: "source", key: "source", categoryLabel: "Source", value: filters.source },
    {
      id: "objective",
      key: "objective",
      categoryLabel: "Objective",
      value: filters.objective,
    },
    {
      id: "strategy",
      key: "strategy",
      categoryLabel: "Strategy",
      value: filters.strategy,
    },
  ];

  for (const chip of retailerChips) {
    if (chip.value !== "all") {
      chips.push(
        filterChip({
          id: chip.id,
          key: chip.key,
          value: chip.value,
          categoryLabel: chip.categoryLabel,
          valueLabel: chip.value,
          scope: "detail",
        }),
      );
    }
  }

  if (
    hasDateFilter(filters) &&
    filters.dateFrom === filters.dateTo &&
    filters.actorRole !== "all"
  ) {
    chips.push(
      filterChip({
        id: "alertDrill",
        key: "alertDrill",
        value: `${filters.dateFrom}:${filters.actorRole}`,
        categoryLabel: alertRoleLabel(filters.actorRole),
        valueLabel: formatAlertDate(filters.dateFrom),
        scope: "detail",
      }),
    );
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
      { label: "Advertising" },
      { label: "Optimization", href: "/" },
      { label: view === "alerts" ? "Alerts" : "Action Log" },
    ]);
    return () => setBreadcrumbs([]);
  }, [view, setBreadcrumbs]);

  const chips = useMemo(() => chipsFromFilters(filters), [filters]);

  const allAlerts = useMemo(() => aggregateAlerts(entries), [entries]);

  const filteredAlerts = useMemo(() => {
    const narrowed = filterEntriesForAlerts(entries, filters);
    const aggregated = aggregateAlerts(narrowed);
    return searchAlerts(aggregated, search);
  }, [entries, filters, search]);

  const filteredEntries = useMemo(() => {
    const entryFilters = { ...filters, actionStatus: "all" as const };
    const byFilters = filterEntries(entries, entryFilters);
    return searchEntries(byFilters, search);
  }, [entries, filters, search]);

  const flatRows = useMemo(() => {
    const rows = flattenLogEntries(filteredEntries);
    const byStatus = filterActionLogRows(rows, filters.actionStatus);
    const byRetailer = filterActionLogRowsByRetailer(byStatus, filters);
    return sortActionLogRowsNewestFirst(byRetailer);
  }, [filteredEntries, filters]);

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
      entityType: "all",
      campaignType: "all",
      matchType: "all",
      source: "all",
      objective: "all",
      strategy: "all",
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
        chips={chips}
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
        alertCount={allAlerts.length}
      />

      {view === "alerts" ? (
        filteredAlerts.length === 0 ? (
          <ActionLogsEmptyState
            kind={hasActiveNarrowing ? "no-results" : "no-activity"}
            onClearFilters={hasActiveNarrowing ? clearAll : undefined}
          />
        ) : (
          <AlertsView alerts={filteredAlerts} onAlertClick={handleAlertClick} />
        )
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
