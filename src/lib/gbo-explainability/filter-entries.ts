import { mapEntryToAlertRole } from "./aggregate-alerts";
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
    entityType: "all",
    campaignType: "all",
    matchType: "all",
    source: "all",
    objective: "all",
    strategy: "all",
  };
}
