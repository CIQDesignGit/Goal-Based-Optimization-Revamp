import { mapEntryToAlertRole } from "./aggregate-alerts";
import { countHighDeviationsInEntry } from "./alert-signals";
import { isAutomationActorFilter } from "./core-filter-definitions";
import {
  filterActionLogRows,
  filterActionLogRowsByRetailer,
  flattenLogEntries,
} from "./flatten-log-entries";
import type { AlertRole, FilterState, LogEntry } from "./types";

function startOfDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

function endOfDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999`);
}

export function hasDateFilter(filters: FilterState): boolean {
  return filters.dateFrom !== "" && filters.dateTo !== "";
}

/** AND-combine unified filters. Search applied separately. */
export function filterEntries(
  entries: LogEntry[],
  filters: FilterState,
): LogEntry[] {
  const from = hasDateFilter(filters)
    ? startOfDay(filters.dateFrom)
    : null;
  const to = hasDateFilter(filters) ? endOfDay(filters.dateTo) : null;

  return entries.filter((entry) => {
    if (from && to) {
      const ts = new Date(entry.timestamp);
      if (ts < from || ts > to) return false;
    }

    if (filters.actionStatus !== "all") {
      if (filters.actionStatus === "failure") {
        if (entry.status !== "failure" && entry.status !== "partial") {
          return false;
        }
      } else if (entry.status !== filters.actionStatus) {
        return false;
      }
    }

    if (filters.actorRole !== "all") {
      if (mapEntryToAlertRole(entry) !== filters.actorRole) return false;
    }

    if (filters.user !== "all") {
      if (isAutomationActorFilter(filters.user)) {
        const role = filters.user.slice("actor:".length) as AlertRole;
        if (mapEntryToAlertRole(entry) !== role) return false;
      } else {
        const who =
          entry.actor.kind === "human"
            ? (entry.actor.email ?? entry.actor.label)
            : entry.actor.label;
        if (
          who.toLowerCase() !== filters.user.toLowerCase() &&
          entry.actor.label.toLowerCase() !== filters.user.toLowerCase()
        ) {
          return false;
        }
      }
    }

    if (
      filters.changeStatus !== "all" &&
      entry.changeStatus !== filters.changeStatus
    ) {
      return false;
    }

    if (
      filters.setupStep !== "all" &&
      entry.setupStep !== filters.setupStep
    ) {
      return false;
    }

    if (
      filters.actionType !== "all" &&
      entry.actionType !== filters.actionType
    ) {
      return false;
    }

    if (
      filters.failureCategory !== "all" &&
      entry.failure?.category !== filters.failureCategory
    ) {
      return false;
    }

    if (filters.outOfBudgetOnly && entry.automationType !== "out-of-budget") {
      return false;
    }

    if (filters.highDeviationOnly) {
      if (entry.actionType !== "setup-change") return false;
      if (countHighDeviationsInEntry(entry) === 0) return false;
    }

    if (filters.budgetLevel !== "all") {
      const matchesLevel =
        entry.scopeLevel === filters.budgetLevel ||
        entry.children?.some(
          (child) => child.scopeLevel === filters.budgetLevel,
        );
      if (!matchesLevel) return false;
    }

    if (filters.entityScope.trim()) {
      const scoped = searchEntries([entry], filters.entityScope);
      if (scoped.length === 0) return false;
    }

    return true;
  });
}

/**
 * Narrow log entries before aggregating into daily alert cards.
 * Mirrors Action Log row filters (status + retailer categorization).
 */
export function filterEntriesForAlerts(
  entries: LogEntry[],
  filters: FilterState,
): LogEntry[] {
  const base = filterEntries(entries, { ...filters, actionStatus: "all" });
  const rows = flattenLogEntries(base);
  const byRetailer = filterActionLogRowsByRetailer(rows, filters);
  const byStatus = filterActionLogRows(byRetailer, filters.actionStatus);
  const allowedIds = new Set(byStatus.map((row) => row.parentEntry.id));
  return base.filter((entry) => allowedIds.has(entry.id));
}

/** Entity name (case-insensitive) or exact entity ID. */
export function searchEntries(
  entries: LogEntry[],
  query: string,
): LogEntry[] {
  const q = query.trim();
  if (!q) return entries;

  const lower = q.toLowerCase();

  return entries.filter((entry) => {
    if (entry.entityId === q) return true;
    if (entry.entityName.toLowerCase().includes(lower)) return true;
    if (
      entry.children?.some(
        (c) =>
          c.entityId === q || c.entityName.toLowerCase().includes(lower),
      )
    ) {
      return true;
    }
    return false;
  });
}

export function sortNewestFirst(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/** Default last 7 days ending today (local). */
export function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return {
    dateFrom: toIsoDate(from),
    dateTo: toIsoDate(to),
  };
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type DateRangeValue = {
  dateFrom: string;
  dateTo: string;
};

export type DateRangePreset = {
  id: string;
  label: string;
  range: () => DateRangeValue;
};

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Canned ranges for the Date / time filter panel. */
export function dateRangePresets(): DateRangePreset[] {
  return [
    {
      id: "last-7-days",
      label: "Last 7 days",
      range: defaultDateRange,
    },
    {
      id: "last-week",
      label: "Last week",
      range: () => {
        const thisWeekStart = startOfWeekMonday(new Date());
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        return {
          dateFrom: toIsoDate(lastWeekStart),
          dateTo: toIsoDate(lastWeekEnd),
        };
      },
    },
    {
      id: "last-month",
      label: "Last month",
      range: () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        const firstDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
        return {
          dateFrom: toIsoDate(firstDay),
          dateTo: toIsoDate(lastDay),
        };
      },
    },
    {
      id: "last-quarter",
      label: "Last quarter",
      range: () => {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const firstOfCurrentQuarter = new Date(
          now.getFullYear(),
          currentQuarter * 3,
          1,
        );
        const lastDay = new Date(firstOfCurrentQuarter);
        lastDay.setDate(0);
        const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const year =
          currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const firstDay = new Date(year, prevQuarter * 3, 1);
        return {
          dateFrom: toIsoDate(firstDay),
          dateTo: toIsoDate(lastDay),
        };
      },
    },
    {
      id: "last-30-days",
      label: "Last 30 days",
      range: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 29);
        return {
          dateFrom: toIsoDate(from),
          dateTo: toIsoDate(to),
        };
      },
    },
  ];
}

export function dateRangesMatch(
  a: DateRangeValue,
  b: DateRangeValue,
): boolean {
  return a.dateFrom === b.dateFrom && a.dateTo === b.dateTo;
}

export function formatLocalTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildDefaultFilters(): FilterState {
  return {
    dateFrom: "",
    dateTo: "",
    actionStatus: "all",
    actorRole: "all",
    user: "all",
    changeStatus: "all",
    setupStep: "all",
    actionType: "all",
    failureCategory: "all",
    outOfBudgetOnly: false,
    highDeviationOnly: false,
    budgetLevel: "all",
    entityScope: "",
    entityType: "all",
    campaignType: "all",
    matchType: "all",
    source: "all",
    objective: "all",
    strategy: "all",
  };
}
