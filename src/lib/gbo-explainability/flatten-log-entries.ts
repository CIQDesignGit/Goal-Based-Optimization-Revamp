import type {
  ActionLogRow,
  ActionType,
  LogActionDetail,
  LogEntry,
} from "./types";

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  "bid-change": "Bid change",
  "budget-change": "Budget change",
  "day-parting-change": "Day-parting change",
  "status-change": "Status change",
  "setup-change": "Setup change",
  "api-failure": "API failure",
  "out-of-budget": "Out of budget",
};

function inferCampaignType(entityName: string, scopeLevel: string): string {
  if (entityName.startsWith("SB ") || entityName.includes("SB ")) {
    return "Sponsored Brands";
  }
  if (
    entityName.startsWith("SP ") ||
    entityName.includes("SP ") ||
    scopeLevel === "Keyword"
  ) {
    return "Sponsored Products";
  }
  if (scopeLevel === "Brand" || scopeLevel === "Portfolio") {
    return "—";
  }
  return "Sponsored Products";
}

function resolveCampaignName(
  entry: LogEntry,
  detail?: LogActionDetail,
): string {
  const scopeLevel = detail?.scopeLevel ?? entry.scopeLevel;
  if (scopeLevel !== "Campaign") return "";

  if (detail?.campaignName) return detail.campaignName;
  if (entry.campaignName) return entry.campaignName;
  return detail?.entityName ?? entry.entityName;
}

function resolveActionLabel(
  entry: LogEntry,
  detail?: LogActionDetail,
): string {
  if (detail?.label) return detail.label;

  const diff = detail?.diffs[0] ?? entry.diffs?.[0];
  if (diff) {
    const field = diff.field.toLowerCase();
    if (field.includes("bid")) {
      const before = parseMoney(diff.before);
      const after = parseMoney(diff.after);
      if (before !== null && after !== null) {
        return after > before ? "Increase Bid" : "Decrease Bid";
      }
      return "Bid change";
    }
    if (field.includes("budget")) return "Budget change";
    if (field.includes("status")) return diff.after ?? "Status change";
    return `${diff.changeStatus ?? "Updated"} ${diff.field}`;
  }

  return ACTION_TYPE_LABELS[entry.actionType] ?? entry.claim;
}

function parseMoney(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function resolveSource(entry: LogEntry): string {
  if (entry.tab === "setup" || entry.actionType === "setup-change") {
    return "Goal Based Optimizer";
  }
  return "Campaign Optimizer";
}

function resolveStatus(
  entry: LogEntry,
  detail?: LogActionDetail,
): LogEntry["status"] {
  if (detail?.failure) return "failure";
  if (entry.children?.length && !detail) return entry.status;
  return entry.status === "partial" && !detail?.failure ? "success" : entry.status;
}

function buildRow(entry: LogEntry, detail?: LogActionDetail): ActionLogRow {
  const entityName = detail?.entityName ?? entry.entityName;
  const scopeLevel = detail?.scopeLevel ?? entry.scopeLevel;

  return {
    id: detail?.id ?? entry.id,
    parentEntryId: entry.id,
    status: resolveStatus(entry, detail),
    entityName,
    entityType: scopeLevel,
    campaignName: resolveCampaignName(entry, detail),
    actor: entry.actor,
    timestamp: entry.timestamp,
    campaignType:
      detail?.campaignType ??
      entry.campaignType ??
      inferCampaignType(entityName, scopeLevel),
    source: resolveSource(entry),
    actionLabel: resolveActionLabel(entry, detail),
    parentEntry: entry,
    detail,
  };
}

/** Expand grouped sessions and batches into one table row per action. */
export function flattenLogEntries(entries: LogEntry[]): ActionLogRow[] {
  const rows: ActionLogRow[] = [];

  for (const entry of entries) {
    if (entry.children && entry.children.length > 0) {
      for (const child of entry.children) {
        rows.push(buildRow(entry, child));
      }
    } else {
      rows.push(buildRow(entry));
    }
  }

  return rows;
}

export function filterActionLogRows(
  rows: ActionLogRow[],
  actionStatus: ActionLogRow["status"] | "all",
): ActionLogRow[] {
  if (actionStatus === "all") return rows;
  if (actionStatus === "failure") {
    return rows.filter(
      (row) => row.status === "failure" || row.status === "partial",
    );
  }
  return rows.filter((row) => row.status === actionStatus);
}

export function inferMatchType(row: ActionLogRow): string {
  if (row.entityType !== "Keyword") return "";
  if (row.entityName.includes("exact") || row.entityName.includes("Exact")) {
    return "exact";
  }
  if (row.entityName.includes("phrase") || row.entityName.includes("Phrase")) {
    return "phrase";
  }
  return "broad";
}

export function inferObjective(row: ActionLogRow): string {
  const claim = row.parentEntry.claim.toLowerCase();
  if (claim.includes("sov") || claim.includes("share of voice")) return "sov";
  if (claim.includes("roas")) return "roas";
  if (claim.includes("sales")) return "sales";
  return "roas";
}

export function inferStrategy(row: ActionLogRow): string {
  const automation = row.parentEntry.automationType;
  if (automation) return automation;
  if (row.parentEntry.tab === "setup") return "custom";
  return row.actor.kind;
}

/** Row-level retailer categorization filters for the Action Log table. */
export function filterActionLogRowsByRetailer(
  rows: ActionLogRow[],
  filters: {
    entityType: string;
    campaignType: string;
    matchType: string;
    source: string;
    objective: string;
    strategy: string;
  },
): ActionLogRow[] {
  return rows.filter((row) => {
    if (filters.entityType !== "all" && row.entityType !== filters.entityType) {
      return false;
    }

    if (
      filters.campaignType !== "all" &&
      row.campaignType !== filters.campaignType
    ) {
      return false;
    }

    if (filters.matchType !== "all" && inferMatchType(row) !== filters.matchType) {
      return false;
    }

    if (
      filters.source !== "all" &&
      !row.source.toLowerCase().includes(filters.source.toLowerCase()) &&
      row.actor.label !== filters.source
    ) {
      return false;
    }

    if (filters.objective !== "all" && inferObjective(row) !== filters.objective) {
      return false;
    }

    if (filters.strategy !== "all" && inferStrategy(row) !== filters.strategy) {
      return false;
    }

    return true;
  });
}

export function sortActionLogRowsNewestFirst(rows: ActionLogRow[]): ActionLogRow[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function formatActionLogDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
