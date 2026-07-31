import {
  SETUP_CHANGE_STEP_LABELS,
  type ChangeLedgerEntry,
} from "@/lib/gbo-optimization/setup-session-store";

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
  ChangeStatus,
  LogActionDetail,
  LogEntry,
  ManualContributorSummary,
  ValueDiff,
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

function personKey(entry: LogEntry): string {
  return entry.actor.email ?? entry.actor.label;
}

/** One manual change surfaced as its own Alerts row. */
type ManualChangeUnit = {
  id: string;
  claim: string;
  entityName: string;
  changeStatus?: ChangeStatus;
  setupStep?: string;
};

function inferLedgerChangeStatus(row: ChangeLedgerEntry): ChangeStatus {
  const from = row.from.trim();
  const to = row.to.trim();
  if (!from && to) return "created";
  if (from && !to) return "deleted";
  return "updated";
}

function formatLedgerChangeClaim(row: ChangeLedgerEntry): string {
  return formatValueChangeClaim(row.scopeName, row.fieldLabel, row.from, row.to);
}

function formatValueChangeClaim(
  entityName: string,
  fieldLabel: string,
  from: string | null | undefined,
  to: string | null | undefined,
  fallbackLabel?: string,
): string {
  const before = from?.trim() ?? "";
  const after = to?.trim() ?? "";

  if (before && after) {
    return `${fieldLabel} for ${entityName}: ${before} → ${after}`;
  }

  if (after) {
    return `${fieldLabel} for ${entityName}: set to ${after}`;
  }

  if (before) {
    return `${fieldLabel} for ${entityName}: cleared from ${before}`;
  }

  return fallbackLabel ?? `${fieldLabel} for ${entityName}`;
}

function formatDiffClaim(
  entityName: string,
  diff: ValueDiff,
  fallbackLabel?: string,
): string {
  return formatValueChangeClaim(
    entityName,
    diff.field,
    diff.before,
    diff.after,
    fallbackLabel,
  );
}

function formatChildChangeClaim(child: LogActionDetail): string {
  const diff = child.diffs[0];
  if (diff) {
    return formatDiffClaim(child.entityName, diff, child.label);
  }

  return `${child.label} · ${child.entityName}`;
}

/** Split a manual log entry into one unit per individual change. */
function explodeManualChangeUnits(entry: LogEntry): ManualChangeUnit[] {
  if (entry.children && entry.children.length > 0) {
    return entry.children.map((child) => ({
      id: child.id,
      claim: formatChildChangeClaim(child),
      entityName: child.entityName,
      changeStatus: child.changeStatus,
      setupStep: entry.setupStep,
    }));
  }

  const ledger = entry.setupSnapshot?.changeLedger;
  if (ledger && ledger.length > 0) {
    return ledger.map((row) => ({
      id: row.id,
      claim: formatLedgerChangeClaim(row),
      entityName: row.scopeName,
      changeStatus: inferLedgerChangeStatus(row),
      setupStep: SETUP_CHANGE_STEP_LABELS[row.step],
    }));
  }

  if (entry.diffs && entry.diffs.length > 0) {
    return entry.diffs.map((diff, index) => ({
      id: `${entry.id}-diff-${index}`,
      claim: formatDiffClaim(entry.entityName, diff, entryClaim(entry)),
      entityName: entry.entityName,
      changeStatus: diff.changeStatus ?? entry.changeStatus,
      setupStep: entry.setupStep,
    }));
  }

  return [
    {
      id: entry.id,
      claim: entryClaim(entry),
      entityName: entry.entityName,
      changeStatus: entry.changeStatus,
      setupStep: entry.setupStep,
    },
  ];
}

function buildManualContributors(entries: LogEntry[]): ManualContributorSummary[] {
  const byPerson = new Map<
    string,
    {
      actor: LogEntry["actor"];
      claims: string[];
      entryIds: string[];
    }
  >();

  for (const entry of entries) {
    const key = personKey(entry);
    const bucket = byPerson.get(key) ?? {
      actor: entry.actor,
      claims: [],
      entryIds: [],
    };

    bucket.claims.push(...explodeManualChangeUnits(entry).map((unit) => unit.claim));

    if (!bucket.entryIds.includes(entry.id)) {
      bucket.entryIds.push(entry.id);
    }

    byPerson.set(key, bucket);
  }

  return [...byPerson.values()]
    .map(({ actor, claims, entryIds }) => {
      const changeSummary =
        claims.length === 1
          ? claims[0]
          : `${claims.length} changes — ${claims.join("; ")}`;

      return {
        id: actor.email ?? actor.label,
        name: actor.label,
        email: actor.email,
        deactivated: actor.deactivated,
        actionCount: claims.length,
        changeSummary,
        claims,
        entryIds,
      };
    })
    .sort((a, b) => {
      const aNewest = entries.find((entry) => personKey(entry) === a.id);
      const bNewest = entries.find((entry) => personKey(entry) === b.id);
      if (!aNewest || !bNewest) return 0;
      return (
        new Date(bNewest.timestamp).getTime() -
        new Date(aNewest.timestamp).getTime()
      );
    });
}

function countManualChanges(entries: LogEntry[]): number {
  return entries.reduce(
    (total, entry) => total + explodeManualChangeUnits(entry).length,
    0,
  );
}

function buildManualGroupClaim(
  entries: LogEntry[],
  contributors: ManualContributorSummary[],
): string {
  const changeCount = countManualChanges(entries);

  if (changeCount === 1) {
    for (const entry of entries) {
      const units = explodeManualChangeUnits(entry);
      if (units.length === 1) return units[0].claim;
    }
    return entryClaim(entries[0]);
  }

  const failureCount = entries.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;

  const peopleLabel =
    contributors.length === 1
      ? contributors[0].name
      : `${contributors.length} people`;

  if (failureCount > 0) {
    return `${peopleLabel} made ${changeCount} manual changes — ${failureCount} with failures`;
  }

  return `${peopleLabel} made ${changeCount} manual changes today`;
}

function entryClaim(entry: LogEntry): string {
  return entry.isSessionGroup
    ? (entry.sessionSummary ?? entry.claim)
    : entry.claim;
}

function representativeActor(role: AlertRole, entries: LogEntry[]): Actor {
  const newest = [...entries].sort(compareEntriesNewestFirst)[0];

  switch (role) {
    case "human": {
      const contributors = buildManualContributors(entries);
      if (contributors.length === 1) return contributors[0].email
        ? { ...newest.actor, label: contributors[0].name, email: contributors[0].email }
        : newest.actor;
      return {
        kind: "human",
        label: `${contributors.length} people`,
      };
    }
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
  if (role === "human") {
    return buildManualGroupClaim(entries, buildManualContributors(entries));
  }

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

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

function summarizeEntityPhrase(entities: string[]): string {
  if (entities.length === 1) return entities[0];
  if (entities.length === 2) return `${entities[0]} and ${entities[1]}`;
  return `${entities.slice(0, -1).join(", ")}, and ${entities.at(-1)}`;
}

function formatRuleTrigger(entry: LogEntry): string | null {
  const trigger = entry.actor.triggerOrRule?.trim();
  if (trigger) return trigger;

  const reason = entry.reason.trim();
  if (reason.toLowerCase().startsWith("rule:")) {
    return reason.slice(5).trim();
  }

  return null;
}

function formatPrimaryDiff(entry: LogEntry): string | null {
  const diff = entry.diffs?.[0];
  if (!diff) return null;

  const before = diff.before?.trim() ?? "";
  const after = diff.after?.trim() ?? "";

  if (before && after) {
    return `${diff.field} changed from ${before} to ${after}`;
  }
  if (after) {
    return `${diff.field} set to ${after}`;
  }
  if (before) {
    return `${diff.field} cleared from ${before}`;
  }

  return null;
}

function formatScheduleChange(entry: LogEntry): string | null {
  const before = entry.dayParting?.before?.label?.trim();
  const after = entry.dayParting?.after?.label?.trim();
  if (!before || !after || before === after) return null;
  return `from ${before} to ${after}`;
}

function appendSignalNotes(base: string, signalParts: string[]): string {
  if (signalParts.length === 0) return base;
  return `${base} ${signalParts.join("; ")}.`;
}

/** Richer digest for rule-based alerts — includes rule, diff, and impact. */
function buildRuleBasedAiSummary(
  entries: LogEntry[],
  signalParts: string[],
): string {
  const sorted = [...entries].sort(compareEntriesNewestFirst);

  if (sorted.length === 1) {
    const entry = sorted[0];
    const rule = formatRuleTrigger(entry);
    const diff = formatPrimaryDiff(entry);
    const claim = entry.claim.trim();
    const sentences: string[] = [];

    if (rule && !claim.toLowerCase().includes(rule.toLowerCase())) {
      sentences.push(ensureSentence(`${rule}: ${claim}`));
    } else {
      sentences.push(ensureSentence(claim));
    }

    const reason = entry.reason.trim().replace(/^Rule:\s*/i, "").trim();
    if (
      reason &&
      reason !== rule &&
      !sentences.join(" ").toLowerCase().includes(reason.toLowerCase())
    ) {
      sentences.push(ensureSentence(reason));
    }

    if (diff && !sentences.join(" ").includes(diff)) {
      sentences.push(ensureSentence(diff));
    }

    if (entry.impact && !sentences.join(" ").includes(entry.impact.trim())) {
      sentences.push(ensureSentence(entry.impact));
    }

    return appendSignalNotes(sentences.join(" "), signalParts);
  }

  const entities = [
    ...new Set(sorted.map((entry) => entry.entityName)),
  ];
  const rules = [
    ...new Set(
      sorted
        .map((entry) => formatRuleTrigger(entry))
        .filter((rule): rule is string => Boolean(rule)),
    ),
  ];
  const failureCount = sorted.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;

  const rulePhrase =
    rules.length === 0
      ? ""
      : rules.length === 1
        ? `, triggered by ${rules[0]}`
        : `, triggered by ${rules.length} rules (${summarizeEntityPhrase(rules)})`;

  let base = `${sorted.length} rule-based actions on ${summarizeEntityPhrase(entities)}${rulePhrase}. Latest: ${sorted[0].claim.trim()}`;

  const latestDiff = formatPrimaryDiff(sorted[0]);
  if (latestDiff) {
    base += `. ${latestDiff}`;
  }

  const impacts = [
    ...new Set(
      sorted
        .map((entry) => entry.impact?.trim())
        .filter((impact): impact is string => Boolean(impact)),
    ),
  ];
  if (impacts.length === 1) {
    base += `. ${impacts[0]}`;
  } else if (impacts.length > 1) {
    base += `. ${impacts.length} actions with estimated impact`;
  }

  if (failureCount > 0) {
    base += `. ${failureCount} action${failureCount === 1 ? "" : "s"} failed`;
  }

  return appendSignalNotes(ensureSentence(base), signalParts);
}

/** Richer digest for day-parting alerts — includes schedule shift and intent. */
function buildDayPartingAiSummary(
  entries: LogEntry[],
  signalParts: string[],
): string {
  const sorted = [...entries].sort(compareEntriesNewestFirst);

  if (sorted.length === 1) {
    const entry = sorted[0];
    const entity = entry.campaignName ?? entry.entityName;
    const trigger =
      entry.actor.triggerOrRule?.trim() ?? "Day-parting update";
    const scheduleChange = formatScheduleChange(entry);
    const sentences: string[] = [];

    if (scheduleChange) {
      sentences.push(
        ensureSentence(
          `${trigger} for ${entity} shifted the bid window ${scheduleChange}`,
        ),
      );
    } else {
      sentences.push(ensureSentence(entry.claim.trim()));
    }

    const reason = entry.reason.trim();
    if (
      reason &&
      !sentences.join(" ").toLowerCase().includes(reason.toLowerCase())
    ) {
      sentences.push(ensureSentence(reason));
    }

    if (entry.impact && !sentences.join(" ").includes(entry.impact.trim())) {
      sentences.push(ensureSentence(entry.impact));
    }

    return appendSignalNotes(sentences.join(" "), signalParts);
  }

  const entities = [
    ...new Set(
      sorted.map((entry) => entry.campaignName ?? entry.entityName),
    ),
  ];
  const scheduleChanges = sorted
    .map((entry) => formatScheduleChange(entry))
    .filter((change): change is string => Boolean(change));
  const failureCount = sorted.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;

  let base = `${sorted.length} day-parting schedule updates on ${summarizeEntityPhrase(entities)}`;

  if (scheduleChanges.length === 1) {
    base += `. One window shifted ${scheduleChanges[0]}`;
  } else if (scheduleChanges.length > 1) {
    base += `. ${scheduleChanges.length} bid windows adjusted`;
  }

  base += `. Latest: ${sorted[0].claim.trim()}`;

  const impacts = [
    ...new Set(
      sorted
        .map((entry) => entry.impact?.trim())
        .filter((impact): impact is string => Boolean(impact)),
    ),
  ];
  if (impacts.length === 1) {
    base += `. ${impacts[0]}`;
  }

  if (failureCount > 0) {
    base += `. ${failureCount} update${failureCount === 1 ? "" : "s"} failed`;
  }

  return appendSignalNotes(ensureSentence(base), signalParts);
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

  if (role === "rule-based") {
    return buildRuleBasedAiSummary(sorted, signalParts);
  }

  if (role === "day-parting") {
    return buildDayPartingAiSummary(sorted, signalParts);
  }

  if (sorted.length === 1) {
    const parts = [newest.claim];
    if (newest.impact) parts.push(newest.impact);
    if (signalParts.length > 0) parts.push(`${signalParts.join("; ")}.`);
    return parts.join(" ");
  }

  if (role === "human") {
    const contributors = buildManualContributors(sorted);
    const entities = [
      ...new Set(sorted.map((entry) => entry.entityName)),
    ];
    const entityPhrase =
      entities.length === 1
        ? entities[0]
        : entities.length === 2
          ? `${entities[0]} and ${entities[1]}`
          : `${entities.slice(0, -1).join(", ")}, and ${entities.at(-1)}`;

    const base =
      contributors.length === 1
        ? sorted[0].claim
        : `${contributors.length} manual saves across ${entityPhrase}.`;

    const failureCount = sorted.filter((entry) =>
      isFailureStatus(entry.status),
    ).length;
    const notes: string[] = [];
    if (failureCount > 0) {
      notes.push(
        `${failureCount} failed action${failureCount === 1 ? "" : "s"}`,
      );
    }
    if (conflicts.length > 0) {
      notes.push(
        `${conflicts.length} override${conflicts.length === 1 ? "" : "s"}`,
      );
    }
    if (deviations.length > 0) {
      notes.push(
        `${deviations.length} high deviation${deviations.length === 1 ? "" : "s"}`,
      );
    }

    if (notes.length === 0) return base;
    return `${base} ${notes.join("; ")}.`;
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
  id?: string,
): AlertSummary {
  const sorted = [...entries].sort(compareEntriesNewestFirst);
  const newest = sorted[0];
  const failureCount = sorted.filter((entry) =>
    isFailureStatus(entry.status),
  ).length;
  const { conflictCount, highDeviationCount } = countSignalsInEntries(sorted);
  const conflicts = extractAlertConflictDetails(sorted);
  const deviations = extractAlertDeviationDetails(sorted);
  const manualContributors =
    role === "human" ? buildManualContributors(sorted) : undefined;
  const aiSummary = buildAlertAiSummary(
    role,
    sorted,
    conflicts,
    deviations,
  );
  const actionCount =
    role === "human" ? countManualChanges(sorted) : sorted.length;

  return {
    id: id ?? `${date}:${role}`,
    date,
    timestamp: newest.timestamp,
    role,
    entryId: newest.id,
    entryIds: sorted.map((entry) => entry.id),
    actionCount,
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
    manualContributors,
  };
}

/**
 * Daily digest for the Alerts tab.
 * Manual changes group into one card per person per day; other actor types roll up by day.
 */
export function aggregateAlerts(entries: LogEntry[]): AlertSummary[] {
  const groups = new Map<string, LogEntry[]>();
  const manualGroups = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const role = mapEntryToAlertRole(entry);
    const date = toLocalIsoDate(entry.timestamp);

    if (role === "human") {
      const key = `${date}:${personKey(entry)}`;
      const bucket = manualGroups.get(key);
      if (bucket) {
        bucket.push(entry);
      } else {
        manualGroups.set(key, [entry]);
      }
      continue;
    }

    const key = `${date}:${role}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  const manualAlerts = [...manualGroups.entries()].map(([key, groupEntries]) => {
    const date = toLocalIsoDate(groupEntries[0].timestamp);
    return summarizeRoleDay(date, "human", groupEntries, key);
  });

  const groupedAlerts = [...groups.entries()].map(([key, groupEntries]) => {
    const [date, role] = key.split(":") as [string, AlertRole];
    return summarizeRoleDay(date, role, groupEntries);
  });

  return [...manualAlerts, ...groupedAlerts].sort(compareAlerts);
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

/** Compact date shown on each alert row (top-right). */
export function formatAlertRowDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ordinalDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** Consistent alert row timestamp — e.g. "30th Jun, 08:00am". */
export function formatAlertRowDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: "short" });

  const hours24 = d.getHours();
  const minutes = d.getMinutes();
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;

  const time = `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}${period}`;

  return `${day}${ordinalDaySuffix(day)} ${month}, ${time}`;
}

/** Row timestamp — same format for every alert type. */
export function formatAlertRowTimestamp(
  alert: Pick<AlertSummary, "timestamp">,
): string {
  return formatAlertRowDateTime(alert.timestamp);
}

/** `dateTime` value for the alert row timestamp. */
export function alertRowTimestampValue(
  alert: Pick<AlertSummary, "timestamp">,
): string {
  return alert.timestamp;
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
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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

function formatContributorIdentity(
  contributor: ManualContributorSummary,
): string {
  return contributor.email
    ? `${contributor.name} (${contributor.email})`
    : contributor.name;
}

/** Subtitle: trigger / reason · entity — or contributor names for Manual alerts. */
export function formatAlertSubtitle(alert: AlertSummary): string {
  if (alert.manualContributors && alert.manualContributors.length > 0) {
    if (alert.actionCount === 1 && alert.manualContributors.length === 1) {
      const contributor = alert.manualContributors[0];
      return `${formatContributorIdentity(contributor)} · ${alert.entityName}`;
    }

    if (alert.manualContributors.length > 1) {
      return alert.manualContributors
        .map(formatContributorIdentity)
        .join(", ");
    }

    const contributor = alert.manualContributors[0];
    return `${formatContributorIdentity(contributor)} — ${contributor.changeSummary}`;
  }

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

/** Search aggregated alert cards by claim, context, entity, or actor. */
export function searchAlerts(
  alerts: AlertSummary[],
  query: string,
): AlertSummary[] {
  const q = query.trim();
  if (!q) return alerts;

  const lower = q.toLowerCase();

  return alerts.filter((alert) => {
    if (alert.claim.toLowerCase().includes(lower)) return true;
    if (alert.reason.toLowerCase().includes(lower)) return true;
    if (alert.entityName.toLowerCase().includes(lower)) return true;
    if (alert.aiSummary.toLowerCase().includes(lower)) return true;
    if (alert.actor.label.toLowerCase().includes(lower)) return true;
    if (alert.actor.email?.toLowerCase().includes(lower)) return true;
    if (
      alert.manualContributors?.some(
        (contributor) =>
          contributor.name.toLowerCase().includes(lower) ||
          contributor.email?.toLowerCase().includes(lower) ||
          contributor.changeSummary.toLowerCase().includes(lower) ||
          contributor.claims.some((claim) =>
            claim.toLowerCase().includes(lower),
          ),
      )
    ) {
      return true;
    }
    return false;
  });
}
