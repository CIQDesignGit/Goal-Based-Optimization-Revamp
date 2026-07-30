import { toIsoDate } from "./filter-entries";
import {
  countSignalsInEntries,
  extractAlertConflictDetails,
  extractAlertDeviationDetails,
} from "./alert-signals";
import type {
  AlertConflictDetail,
  AlertDeviationDetail,
  AlertRole,
  AlertSummary,
  Actor,
  LogEntry,
} from "./types";

/** Map a log entry to one of four daily alert actor buckets. */
export function mapEntryToAlertRole(entry: LogEntry): AlertRole {
  if (
    entry.actor.kind === "day-parting" ||
    entry.actionType === "day-parting-change" ||
    entry.automationType === "day-parting"
  ) {
    return "day-parting";
  }
  if (entry.actor.kind === "human") return "human";
  if (
    entry.actor.kind === "rule-based" ||
    entry.automationType === "rule-based"
  ) {
    return "rule-based";
  }
  // Ally AI, custom automations, and other optimizer-driven actions
  return "ally-ai";
}

/** Consistent card order within each day section. */
export const ALERT_ROLE_ORDER: AlertRole[] = [
  "human",
  "ally-ai",
  "day-parting",
  "rule-based",
];

function toLocalIsoDate(isoTimestamp: string): string {
  return toIsoDate(new Date(isoTimestamp));
}

function compareEntriesNewestFirst(a: LogEntry, b: LogEntry): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

function compareAlerts(a: AlertSummary, b: AlertSummary): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

function isFailureStatus(status: LogEntry["status"]): boolean {
  return status === "failure" || status === "partial";
}

function entryClaim(entry: LogEntry): string {
  return entry.isSessionGroup
    ? (entry.sessionSummary ?? entry.claim)
    : entry.claim;
}

function representativeActor(role: AlertRole, entries: LogEntry[]): Actor {
  const newest = [...entries].sort(compareEntriesNewestFirst)[0];

  switch (role) {
    case "human":
      if (entries.length === 1) return newest.actor;
      return {
        kind: "human",
        label: `${entries.length} people`,
      };
    case "ally-ai":
      return {
        kind: "ally-ai",
        label: "Ally AI",
        triggerOrRule: newest.actor.triggerOrRule,
      };
    case "day-parting":
      return {
        kind: "day-parting",
        label: "Day Parting",
        triggerOrRule: newest.actor.triggerOrRule ?? newest.reason,
      };
    case "rule-based":
      return {
        kind: "rule-based",
        label: "Rule Based",
        triggerOrRule: newest.actor.triggerOrRule,
      };
  }
}

function buildGroupClaim(role: AlertRole, entries: LogEntry[]): string {
  if (entries.length === 1) {
    return entryClaim(entries[0]);
  }

  const roleLabel = alertRoleLabel(role);
  const failureCount = entries.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;

  if (failureCount > 0) {
    return `${entries.length} ${roleLabel} actions — ${failureCount} with failures`;
  }

  return `${entries.length} ${roleLabel} actions`;
}

function buildGroupReason(entries: LogEntry[]): string {
  if (entries.length === 1) {
    return entries[0].reason;
  }

  const triggers = [
    ...new Set(
      entries
        .map(
          (entry) =>
            entry.actor.triggerOrRule ??
            entry.reason.split("—")[0]?.trim() ??
            entry.reason,
        )
        .filter(Boolean),
    ),
  ].slice(0, 2);

  return triggers.length > 0
    ? triggers.join("; ")
    : "Multiple triggers across the day";
}

function buildGroupImpact(entries: LogEntry[]): string | null {
  if (entries.length === 1) {
    return entries[0].impact;
  }

  const impacts = entries
    .map((entry) => entry.impact)
    .filter((impact): impact is string => Boolean(impact));

  if (impacts.length === 0) return null;
  if (impacts.length === 1) return impacts[0];

  return `${impacts.length} actions with estimated impact`;
}

function buildGroupEntityName(entries: LogEntry[]): string {
  const entities = [...new Set(entries.map((entry) => entry.entityName))];
  if (entities.length === 1) return entities[0];
  return `${entities.length} entities`;
}

function aggregateGroupStatus(
  entries: LogEntry[],
): AlertSummary["status"] {
  const failureCount = entries.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;

  if (failureCount === 0) return "success";
  if (failureCount === entries.length) return "failure";
  return "partial";
}

/** Daily digest copy for the expanded alert panel. */
function buildAlertAiSummary(
  role: AlertRole,
  entries: LogEntry[],
  conflicts: AlertConflictDetail[],
  deviations: AlertDeviationDetail[],
): string {
  const sorted = [...entries].sort(compareEntriesNewestFirst);
  const newest = sorted[0];
  const roleLabel = alertRoleLabel(role);
  const signalParts: string[] = [];

  if (conflicts.length > 0) {
    signalParts.push(
      `${conflicts.length} change${conflicts.length === 1 ? "" : "s"} were later overridden by another actor`,
    );
  }

  if (deviations.length > 0) {
    signalParts.push(
      `${deviations.length} field update${deviations.length === 1 ? "" : "s"} exceeded the 12.5% deviation threshold`,
    );
  }

  if (sorted.length === 1) {
    const parts = [newest.claim];
    if (newest.impact) parts.push(newest.impact);
    if (signalParts.length > 0) parts.push(`${signalParts.join("; ")}.`);
    return parts.join(" ");
  }

  const failureCount = sorted.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;

  const base = `${sorted.length} ${roleLabel} actions today`;
  const failureNote =
    failureCount > 0 ? `, including ${failureCount} with failures` : "";
  const signalNote =
    signalParts.length > 0 ? `. ${signalParts.join("; ")}.` : ".";

  return `${base}${failureNote}${signalNote}`;
}

function summarizeRoleDay(
  date: string,
  role: AlertRole,
  entries: LogEntry[],
): AlertSummary {
  const sorted = [...entries].sort(compareEntriesNewestFirst);
  const newest = sorted[0];
  const failureCount = sorted.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;
  const { conflictCount, highDeviationCount } = countSignalsInEntries(sorted);
  const conflicts = extractAlertConflictDetails(sorted);
  const deviations = extractAlertDeviationDetails(sorted);
  const aiSummary = buildAlertAiSummary(
    role,
    sorted,
    conflicts,
    deviations,
  );

  return {
    id: `${date}:${role}`,
    date,
    timestamp: newest.timestamp,
    role,
    entryId: newest.id,
    entryIds: sorted.map((entry) => entry.id),
    actionCount: sorted.length,
    failureCount,
    conflictCount,
    highDeviationCount,
    conflicts,
    deviations,
    aiSummary,
    claim: buildGroupClaim(role, sorted),
    reason: buildGroupReason(sorted),
    impact: buildGroupImpact(sorted),
    summarySource: newest.summarySource,
    status: aggregateGroupStatus(sorted),
    actor: representativeActor(role, sorted),
    entityName: buildGroupEntityName(sorted),
  };
}

/** One alert card per (calendar day, role) — daily digest for the Alerts tab. */
export function aggregateAlerts(entries: LogEntry[]): AlertSummary[] {
  const groups = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const date = toLocalIsoDate(entry.timestamp);
    const role = mapEntryToAlertRole(entry);
    const key = `${date}:${role}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  const alerts = [...groups.entries()].map(([key, groupEntries]) => {
    const [date, role] = key.split(":") as [string, AlertRole];
    return summarizeRoleDay(date, role, groupEntries);
  });

  return alerts.sort(compareAlerts);
}

export function alertRoleLabel(role: AlertRole): string {
  const labels: Record<AlertRole, string> = {
    human: "Manual",
    "ally-ai": "Ally AI",
    "day-parting": "Day Parting",
    "rule-based": "Rule Based",
  };
  return labels[role];
}

export function formatAlertDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Section header label for date separators in the Alerts feed. */
export function formatAlertDateSeparator(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Group consecutive alerts by calendar day (newest day first). */
export function groupAlertsByDate(
  alerts: AlertSummary[],
): { date: string; alerts: AlertSummary[] }[] {
  const groups: { date: string; alerts: AlertSummary[] }[] = [];

  for (const alert of alerts) {
    const last = groups.at(-1);
    if (last?.date === alert.date) {
      last.alerts.push(alert);
    } else {
      groups.push({ date: alert.date, alerts: [alert] });
    }
  }

  for (const group of groups) {
    group.alerts.sort(
      (a, b) =>
        ALERT_ROLE_ORDER.indexOf(a.role) - ALERT_ROLE_ORDER.indexOf(b.role),
    );
  }

  return groups;
}

/** Title line: claim plus impact when not already included. */
export function formatAlertTitle(alert: AlertSummary): string {
  if (alert.actionCount > 1) {
    return alert.claim;
  }

  if (!alert.impact || alert.claim.includes(alert.impact)) {
    return alert.claim;
  }
  return `${alert.claim} — ${alert.impact}`;
}

/** Subtitle: trigger / reason · entity */
export function formatAlertSubtitle(alert: AlertSummary): string {
  if (alert.actionCount > 1) {
    const trigger =
      alert.reason.split(";")[0]?.trim() ??
      alert.reason.split("—")[0]?.trim() ??
      alert.reason;
    return `${trigger} · ${alert.entityName}`;
  }

  const trigger =
    alert.actor.triggerOrRule ??
    alert.reason.split("—")[0]?.trim() ??
    alert.reason;
  return `${trigger} · ${alert.entityName}`;
}
