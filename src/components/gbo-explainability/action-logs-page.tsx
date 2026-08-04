"use client";

import { useEffect, useLayoutEffect, useMemo, useState, useTransition } from "react";

import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import { ActionLogTable } from "@/components/gbo-explainability/action-log-table";
import { ActionLogsToolbar } from "@/components/gbo-explainability/action-logs-toolbar";
import { AlertsView } from "@/components/gbo-explainability/alerts-view";
import { usePageTitle } from "@/components/layout/page-title-context";
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
  actionStatusLabel,
  actionTypeLabel,
  budgetLevelLabel,
  changeStatusLabel,
  failureCategoryChipValueLabel,
  isFailureCategoryFilterActive,
  parseUserFilterValues,
  userFilterChipValueLabel,
  retailerFilterChipLabel,
} from "@/lib/gbo-explainability/core-filter-definitions";
import {
  buildDefaultFilters,
  defaultDateRange,
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

const PAGE_SIZE = 15;

function buildDefaultAlertsFilters(): FilterState {
  return {
    ...buildDefaultFilters(),
    ...defaultDateRange(),
  };
}

function buildDefaultActionLogFilters(): FilterState {
  return {
    ...buildDefaultFilters(),
    ...defaultDateRange(),
  };
}

function filterChip(
  chip: Omit<ActiveFilterChip, "label"> & { label?: string },
): ActiveFilterChip {
  const label =
    chip.label ?? `${chip.categoryLabel}: ${chip.valueLabel}`.trim();
  return { ...chip, label };
}

function formatDateChipValue(dateFrom: string, dateTo: string): string {
  if (dateFrom === dateTo) {
    return formatAlertDate(dateFrom);
  }
  return `${formatAlertDate(dateFrom)} – ${formatAlertDate(dateTo)}`;
}

function isDefaultAlertsDateRange(filters: FilterState): boolean {
  const defaults = defaultDateRange();
  return (
    filters.dateFrom === defaults.dateFrom && filters.dateTo === defaults.dateTo
  );
}

function isDefaultActionLogDateRange(filters: FilterState): boolean {
  const defaults = defaultDateRange();
  return (
    filters.dateFrom === defaults.dateFrom && filters.dateTo === defaults.dateTo
  );
}

function chipsFromFilters(
  filters: FilterState,
  view: PageView,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const isAlertDrill =
    hasDateFilter(filters) &&
    filters.dateFrom === filters.dateTo &&
    filters.actorRole !== "all";
  const showDateChip =
    hasDateFilter(filters) &&
    !isAlertDrill &&
    !(view === "alerts" && isDefaultAlertsDateRange(filters)) &&
    !(view === "action-log" && isDefaultActionLogDateRange(filters));

  if (showDateChip) {
    chips.push(
      filterChip({
        id: "dateRange",
        key: "dateRange",
        value: `${filters.dateFrom}:${filters.dateTo}`,
        categoryLabel: "Date",
        valueLabel: formatDateChipValue(filters.dateFrom, filters.dateTo),
        scope: "common",
      }),
    );
  }

  if (filters.budgetLevel !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "budgetLevel",
        key: "budgetLevel",
        value: filters.budgetLevel,
        categoryLabel: "Budget level",
        valueLabel: budgetLevelLabel(filters.budgetLevel),
        scope: "detail",
      }),
    );
  }

  if (filters.entityScope.trim() !== "" && view === "action-log") {
    chips.push(
      filterChip({
        id: "entityScope",
        key: "entityScope",
        value: filters.entityScope,
        categoryLabel: "Entity / scope",
        valueLabel: filters.entityScope,
        scope: "detail",
      }),
    );
  }

  if (filters.actionStatus !== "all") {
    chips.push(
      filterChip({
        id: "status",
        key: "actionStatus",
        value: filters.actionStatus,
        categoryLabel: "Action status",
        valueLabel: actionStatusLabel(filters.actionStatus),
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
    const userValues = parseUserFilterValues(filters.user);
    if (userValues.length > 0) {
      chips.push(
        filterChip({
          id: "user",
          key: "user",
          value: filters.user,
          categoryLabel: view === "alerts" ? "Type" : "User",
          valueLabel: userFilterChipValueLabel(filters.user),
          scope: "detail",
        }),
      );
    }
  }

  if (filters.changeStatus !== "all") {
    chips.push(
      filterChip({
        id: "changeStatus",
        key: "changeStatus",
        value: filters.changeStatus,
        categoryLabel: "Change status",
        valueLabel: changeStatusLabel(filters.changeStatus),
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
        valueLabel: actionTypeLabel(filters.actionType),
        scope: "detail",
      }),
    );
  }

  if (filters.strategy !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "strategy",
        key: "strategy",
        value: filters.strategy,
        categoryLabel: "Strategy",
        valueLabel: retailerFilterChipLabel(
          "strategy",
          filters.strategy,
          MOCK_ACCOUNT_CONFIG,
        ),
        scope: "detail",
      }),
    );
  }

  if (filters.entityType !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "entityType",
        key: "entityType",
        value: filters.entityType,
        categoryLabel: "Entity type",
        valueLabel: retailerFilterChipLabel(
          "entityType",
          filters.entityType,
          MOCK_ACCOUNT_CONFIG,
        ),
        scope: "detail",
      }),
    );
  }

  if (filters.campaignType !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "campaignType",
        key: "campaignType",
        value: filters.campaignType,
        categoryLabel: "Campaign type",
        valueLabel: retailerFilterChipLabel(
          "campaignType",
          filters.campaignType,
          MOCK_ACCOUNT_CONFIG,
        ),
        scope: "detail",
      }),
    );
  }

  if (filters.matchType !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "matchType",
        key: "matchType",
        value: filters.matchType,
        categoryLabel: "Match type",
        valueLabel: retailerFilterChipLabel(
          "matchType",
          filters.matchType,
          MOCK_ACCOUNT_CONFIG,
        ),
        scope: "detail",
      }),
    );
  }

  if (filters.source !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "source",
        key: "source",
        value: filters.source,
        categoryLabel: "Source",
        valueLabel: retailerFilterChipLabel(
          "source",
          filters.source,
          MOCK_ACCOUNT_CONFIG,
        ),
        scope: "detail",
      }),
    );
  }

  if (filters.objective !== "all" && view === "action-log") {
    chips.push(
      filterChip({
        id: "objective",
        key: "objective",
        value: filters.objective,
        categoryLabel: "Objective",
        valueLabel: retailerFilterChipLabel(
          "objective",
          filters.objective,
          MOCK_ACCOUNT_CONFIG,
        ),
        scope: "detail",
      }),
    );
  }

  if (isFailureCategoryFilterActive(filters.failureCategory)) {
    chips.push(
      filterChip({
        id: "failureCategory",
        key: "failureCategory",
        value: filters.failureCategory,
        categoryLabel: "Failure reason",
        valueLabel: failureCategoryChipValueLabel(filters.failureCategory),
        scope: "detail",
      }),
    );
  }

  if (filters.highDeviationOnly) {
    chips.push(
      filterChip({
        id: "highDeviation",
        key: "highDeviationOnly",
        value: "true",
        categoryLabel: "High deviation",
        valueLabel: "Flagged only",
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

  if (isAlertDrill && filters.actorRole !== "all") {
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
  const { setBreadcrumbs } = usePageTitle();

  const [entries, setEntries] = useState<LogEntry[]>(INITIAL_MOCK_ENTRIES);
  const [view, setView] = useState<PageView>("alerts");
  const [alertsFilters, setAlertsFilters] = useState<FilterState>(
    buildDefaultAlertsFilters,
  );
  const [actionLogFilters, setActionLogFilters] = useState<FilterState>(
    buildDefaultActionLogFilters,
  );
  const [alertsSearch, setAlertsSearch] = useState("");
  const [actionLogSearch, setActionLogSearch] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const filters = view === "alerts" ? alertsFilters : actionLogFilters;
  const search = view === "alerts" ? alertsSearch : actionLogSearch;
  const setSearch = view === "alerts" ? setAlertsSearch : setActionLogSearch;

  useLayoutEffect(() => {
    setBreadcrumbs([
      { label: "Home", href: "/" },
      { label: "Advertising" },
      { label: "Optimization", href: "/" },
      { label: view === "alerts" ? "Alerts" : "Action Log" },
    ]);
  }, [view, setBreadcrumbs]);

  useEffect(() => {
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const chips = useMemo(
    () => chipsFromFilters(filters, view),
    [filters, view],
  );

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

  const actionLogTotalPages = Math.max(
    1,
    Math.ceil(flatRows.length / PAGE_SIZE),
  );
  const pageRows = flatRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const alertsTotalPages = Math.max(
    1,
    Math.ceil(filteredAlerts.length / PAGE_SIZE),
  );
  const pageAlerts = useMemo(
    () =>
      filteredAlerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredAlerts, page],
  );

  const filtered = useMemo(
    () => sortNewestFirst(filteredEntries),
    [filteredEntries],
  );

  const todayAlly = useMemo(() => filterTodaysAllyAi(entries), [entries]);

  const hasActiveNarrowing = chips.length > 0 || search.trim().length > 0;

  function patchFilters(patch: Partial<FilterState>) {
    startTransition(() => {
      if (view === "alerts") {
        setAlertsFilters((prev) => ({ ...prev, ...patch }));
      } else {
        setActionLogFilters((prev) => ({ ...prev, ...patch }));
      }
      setPage(1);
    });
  }

  function handleViewChange(next: PageView) {
    setView(next);
    setPage(1);
  }

  function handleAlertClick(alert: AlertSummary) {
    setActionLogFilters({
      ...buildDefaultActionLogFilters(),
      dateFrom: alert.date,
      dateTo: alert.date,
      actorRole: alert.role,
    });
    setActionLogSearch("");
    setView("action-log");
    setPage(1);
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

    if (chip.id === "dateRange") {
      patchFilters(
        view === "alerts" || view === "action-log"
          ? defaultDateRange()
          : { dateFrom: "", dateTo: "" },
      );
      return;
    }

    if (chip.key === "entityScope") {
      patchFilters({ entityScope: "" });
      return;
    }

    if (chip.key === "outOfBudgetOnly") {
      patchFilters({ outOfBudgetOnly: false });
      return;
    }
    if (chip.key === "highDeviationOnly") {
      patchFilters({ highDeviationOnly: false });
      return;
    }
    if (chip.key === "actionStatus") {
      patchFilters({ actionStatus: "all" });
      return;
    }
    if (chip.key === "user") {
      patchFilters({ user: "all" });
      return;
    }
    patchFilters({ [chip.key]: "all" } as Partial<FilterState>);
  }

  function clearAll() {
    if (view === "alerts") {
      setAlertsFilters(buildDefaultAlertsFilters());
      setAlertsSearch("");
    } else {
      setActionLogFilters(buildDefaultActionLogFilters());
      setActionLogSearch("");
    }
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
    <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
      <div className="shrink-0 border-b border-slate-200/80 bg-white py-1.5">
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
          alertCount={allAlerts.length}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "alerts" ? (
          filteredAlerts.length === 0 ? (
            <ActionLogsEmptyState
              kind={hasActiveNarrowing ? "no-results" : "no-activity"}
              onClearFilters={hasActiveNarrowing ? clearAll : undefined}
            />
          ) : (
            <AlertsView
              alerts={pageAlerts}
              page={page}
              totalPages={alertsTotalPages}
              onPageChange={setPage}
              onAlertClick={handleAlertClick}
            />
          )
        ) : flatRows.length === 0 ? (
          <ActionLogsEmptyState
            kind={hasActiveNarrowing ? "no-results" : "no-activity"}
            onClearFilters={hasActiveNarrowing ? clearAll : undefined}
          />
        ) : (
          <ActionLogTable
            rows={pageRows}
            totalCount={flatRows.length}
            page={page}
            totalPages={actionLogTotalPages}
            onPageChange={setPage}
            retryingId={retryingId}
            onRetry={handleRetry}
            filteredCount={flatRows.length}
            todayAllyCount={todayAlly.length}
            onExport={handleExport}
            onDownloadToday={handleDownloadToday}
          />
        )}
      </div>
    </div>
  );
}
