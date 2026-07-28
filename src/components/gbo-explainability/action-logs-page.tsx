"use client";

import { useMemo, useState, useTransition } from "react";

import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import { ActionLogsToolbar } from "@/components/gbo-explainability/action-logs-toolbar";
import { LogEntryRow } from "@/components/gbo-explainability/log-entry-row";
import { Button } from "@/components/ui/button";
import {
  getAvailableTabs,
  getDefaultTab,
} from "@/lib/gbo-explainability/account-tabs";
import {
  downloadCsv,
  entriesToCsv,
  filterTodaysAllyAi,
} from "@/lib/gbo-explainability/export-csv";
import {
  defaultDateRange,
  filterEntries,
  searchEntries,
  sortNewestFirst,
} from "@/lib/gbo-explainability/filter-entries";
import {
  INITIAL_MOCK_ENTRIES,
  MOCK_ACCOUNT_CONFIG,
  MOCK_ACCOUNT_META,
} from "@/lib/gbo-explainability/mock-data";
import { buildRetryResult } from "@/lib/gbo-explainability/retry-policy";
import type {
  ActionTab,
  ActiveFilterChip,
  DemoPageState,
  FilterState,
  LogEntry,
} from "@/lib/gbo-explainability/types";

const PAGE_SIZE = 50;

function buildDefaultFilters(): FilterState {
  const range = defaultDateRange();
  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    actionStatus: "all",
    user: "all",
    changeStatus: "all",
    setupStep: "all",
    automationType: "all",
    actionType: "all",
    failureCategory: "all",
    outOfBudgetOnly: false,
  };
}

function chipsFromFilters(
  tab: ActionTab,
  filters: FilterState,
): ActiveFilterChip[] {
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

  if (tab === "setup") {
    if (filters.user && filters.user !== "all") {
      chips.push({
        id: "user",
        key: "user",
        value: filters.user,
        label: `User: ${filters.user}`,
        scope: "tab",
      });
    }
    if (filters.changeStatus && filters.changeStatus !== "all") {
      chips.push({
        id: "changeStatus",
        key: "changeStatus",
        value: filters.changeStatus,
        label: `Change: ${filters.changeStatus}`,
        scope: "tab",
      });
    }
    if (filters.setupStep && filters.setupStep !== "all") {
      chips.push({
        id: "setupStep",
        key: "setupStep",
        value: filters.setupStep,
        label: `Step: ${filters.setupStep}`,
        scope: "tab",
      });
    }
  }

  if (tab === "automation") {
    if (filters.automationType && filters.automationType !== "all") {
      chips.push({
        id: "automationType",
        key: "automationType",
        value: filters.automationType,
        label: `Automation: ${filters.automationType}`,
        scope: "tab",
      });
    }
    if (filters.actionType && filters.actionType !== "all") {
      chips.push({
        id: "actionType",
        key: "actionType",
        value: filters.actionType,
        label: `Action: ${filters.actionType}`,
        scope: "tab",
      });
    }
    if (filters.failureCategory && filters.failureCategory !== "all") {
      chips.push({
        id: "failureCategory",
        key: "failureCategory",
        value: filters.failureCategory,
        label: `Failure: ${filters.failureCategory}`,
        scope: "tab",
      });
    }
    if (filters.outOfBudgetOnly) {
      chips.push({
        id: "outOfBudget",
        key: "outOfBudgetOnly",
        value: "true",
        label: "Out of budget",
        scope: "tab",
      });
    }
  }

  return chips;
}

export function ActionLogsPage() {
  const config = MOCK_ACCOUNT_CONFIG;
  const availableTabs = getAvailableTabs(config);

  const [entries, setEntries] = useState<LogEntry[]>(INITIAL_MOCK_ENTRIES);
  const [tab, setTab] = useState<ActionTab>(getDefaultTab(config));
  const [filters, setFilters] = useState<FilterState>(buildDefaultFilters);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [demoState, setDemoState] = useState<DemoPageState>("live");
  const [, startTransition] = useTransition();

  const chips = useMemo(
    () => chipsFromFilters(tab, filters),
    [tab, filters],
  );

  const filtered = useMemo(() => {
    const byTab = filterEntries(entries, tab, filters);
    const bySearch = searchEntries(byTab, search);
    return sortNewestFirst(bySearch);
  }, [entries, tab, filters, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const todayAlly = useMemo(
    () => filterTodaysAllyAi(entries),
    [entries],
  );

  const hasActiveNarrowing =
    chips.length > 0 || search.trim().length > 0;

  function patchFilters(patch: Partial<FilterState>) {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, ...patch }));
      setPage(1);
    });
  }

  function handleTabChange(next: ActionTab) {
    setTab(next);
    setPage(1);
    setExpandedId(null);
    // Drop tab-specific filters; keep common (date + status)
    setFilters((prev) => ({
      ...prev,
      user: "all",
      changeStatus: "all",
      setupStep: "all",
      automationType: "all",
      actionType: "all",
      failureCategory: "all",
      outOfBudgetOnly: false,
    }));
  }

  function removeChip(chipId: string) {
    const chip = chips.find((c) => c.id === chipId);
    if (!chip) return;
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
    downloadCsv(`action-logs-${tab}-${filters.dateFrom}.csv`, csv);
  }

  function handleDownloadToday() {
    const csv = entriesToCsv(todayAlly);
    downloadCsv(`ally-ai-today.csv`, csv);
  }

  function handleRetry(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    setRetryingId(entryId);
    // Simulate async retailer push
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
      setExpandedId(newEntry.id);
    }, 1200);
  }

  // Full-page empty states for unsupported / not live / purged
  if (demoState === "unsupported-retailer") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader />
        <ActionLogsEmptyState kind="unsupported-retailer" />
      </div>
    );
  }
  if (demoState === "strategy-not-live") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader />
        <ActionLogsEmptyState kind="strategy-not-live" />
      </div>
    );
  }
  if (demoState === "purged-entry") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader />
        <ActionLogsEmptyState
          kind="purged-entry"
          onClearFilters={() => setDemoState("live")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader />

      <ActionLogsToolbar
        tab={tab}
        availableTabs={availableTabs}
        onTabChange={handleTabChange}
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
        onExport={handleExport}
        onDownloadToday={handleDownloadToday}
        todayAllyCount={todayAlly.length}
        demoState={demoState}
        onDemoStateChange={setDemoState}
      />

      {pageEntries.length === 0 ? (
        <ActionLogsEmptyState
          kind={hasActiveNarrowing ? "no-results" : "no-activity"}
          onClearFilters={hasActiveNarrowing ? clearAll : undefined}
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {pageEntries.length} of {filtered.length} · newest first
          </p>
          <ul className="overflow-hidden rounded-lg border border-border bg-background">
            {pageEntries.map((entry) => (
              <LogEntryRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                isRetrying={retryingId === entry.id}
                onToggle={() =>
                  setExpandedId((id) => (id === entry.id ? null : entry.id))
                }
                onRetry={() => handleRetry(entry.id)}
              />
            ))}
          </ul>

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

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Action Logs
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {MOCK_ACCOUNT_META.accountName} · {MOCK_ACCOUNT_META.retailer} (
        {MOCK_ACCOUNT_META.region}) — who changed what, why, and the expected
        impact
      </p>
    </div>
  );
}
