import type { LogEntry } from "./types";
import { formatLocalTimestamp } from "./filter-entries";

const CSV_COLUMNS = [
  "id",
  "tab",
  "timestamp_local",
  "actor_kind",
  "actor_label",
  "actor_email",
  "status",
  "action_type",
  "automation_type",
  "claim",
  "reason",
  "impact",
  "entity_name",
  "entity_id",
  "scope_level",
  "change_status",
] as const;

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowValues(entry: LogEntry): string[] {
  return [
    entry.id,
    entry.tab,
    formatLocalTimestamp(entry.timestamp),
    entry.actor.kind,
    entry.actor.label,
    entry.actor.email ?? "",
    entry.status,
    entry.actionType,
    entry.automationType ?? "",
    entry.claim,
    entry.reason,
    entry.impact ?? "Impact pending",
    entry.entityName,
    entry.entityId,
    entry.scopeLevel,
    entry.changeStatus ?? "",
  ];
}

/** Build CSV for the current filtered view (exactly these rows). */
export function entriesToCsv(entries: LogEntry[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = entries.map((e) =>
    rowValues(e).map((v) => escapeCsv(String(v))).join(","),
  );
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Today's Ally AI changes only (local calendar day). */
export function filterTodaysAllyAi(entries: LogEntry[]): LogEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return entries.filter((e) => {
    if (e.automationType !== "ally-ai" && e.actor.kind !== "ally-ai") {
      return false;
    }
    const ts = new Date(e.timestamp);
    return ts >= start && ts <= end;
  });
}
