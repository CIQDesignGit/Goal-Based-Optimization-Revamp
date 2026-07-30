import type { ReactNode } from "react";

import {
  inferMatchType,
  inferObjective,
  inferStrategy,
} from "@/lib/gbo-explainability/flatten-log-entries";
import { resolveSetupSnapshot } from "@/lib/gbo-explainability/setup-snapshot";
import type {
  ActionLogRow,
  ActionStatus,
  LogEntry,
  ValueDiff,
} from "@/lib/gbo-explainability/types";

export type ActionDetailField = {
  label: string;
  value: ReactNode;
};

const OBJECTIVE_LABELS: Record<string, string> = {
  roas: "Improve ROAS",
  sov: "Improve share of voice",
  sales: "Improve sales",
};

const STRATEGY_LABELS: Record<string, string> = {
  "ally-ai": "Ally AI",
  "rule-based": "Rule Based",
  "day-parting": "Day Parting",
  custom: "Custom portfolio rule",
  human: "Manual setup",
};

const STATUS_LABELS: Record<ActionStatus, string> = {
  success: "Success",
  failure: "Failure",
  partial: "Partial success",
  retrying: "Retrying",
};

function formatObjective(row: ActionLogRow): string {
  const snapshot = resolveSetupSnapshot(row.parentEntry);
  if (snapshot?.goalLabel) {
    return snapshot.goalLabel;
  }

  const key = inferObjective(row);
  return OBJECTIVE_LABELS[key] ?? key;
}

function formatStrategy(row: ActionLogRow): string {
  const entry = row.parentEntry;

  if (entry.tab === "setup" || entry.actionType === "setup-change") {
    return entry.setupStep ?? "Save & Launch";
  }

  if (entry.actor.triggerOrRule) {
    return entry.actor.triggerOrRule;
  }

  const key = inferStrategy(row);
  return STRATEGY_LABELS[key] ?? key.replace(/-/g, " ");
}

function resolveDiffs(row: ActionLogRow): ValueDiff[] {
  return row.detail?.diffs ?? row.parentEntry.diffs ?? [];
}

export type ConditionDisplay = {
  field: string;
  before?: string;
  after?: string;
  text?: string;
};

function resolveConditionDisplay(
  row: ActionLogRow,
): ConditionDisplay | null {
  const diffs = resolveDiffs(row);
  const diff = diffs[0];

  if (diff) {
    if (diff.before && diff.after) {
      return { field: diff.field, before: diff.before, after: diff.after };
    }
    if (diff.after) {
      return { field: diff.field, after: diff.after };
    }
    if (diff.before) {
      return { field: diff.field, before: diff.before };
    }
  }

  const trigger = row.parentEntry.actor.triggerOrRule;
  if (trigger) {
    return { field: row.actionLabel, text: `from ${trigger}` };
  }

  const reason = row.parentEntry.reason;
  return reason ? { field: "Reason", text: reason } : null;
}

function formatScope(row: ActionLogRow): string {
  const entry = row.parentEntry;

  if (entry.setupStep) {
    return `${entry.setupStep} · ${row.entityType}`;
  }

  if (entry.reason && entry.reason !== entry.claim) {
    return entry.reason;
  }

  return `${row.entityType} · ${entry.scopeLevel}`;
}

function formatCampaignName(row: ActionLogRow): string | null {
  if (row.entityType === "Campaign" && row.campaignName) {
    return row.campaignName;
  }

  if (row.campaignName) {
    return row.campaignName;
  }

  return null;
}

function formatUser(row: ActionLogRow): string | null {
  if (row.actor.kind !== "human") {
    return null;
  }

  return row.actor.email
    ? `${row.actor.label} (${row.actor.email})`
    : row.actor.label;
}

/** Key fields for the Action Log side panel — matches the simple reference layout. */
export function buildActionDetailFields(
  row: ActionLogRow,
  _options?: { isRetrying?: boolean },
): { fields: ActionDetailField[]; condition: ConditionDisplay | null } {
  const fields: ActionDetailField[] = [];
  const matchType = inferMatchType(row);
  const campaignName = formatCampaignName(row);
  const user = formatUser(row);
  const condition = resolveConditionDisplay(row);

  fields.push({ label: "Source", value: row.source });
  fields.push({ label: "Objective", value: formatObjective(row) });

  if (campaignName) {
    fields.push({ label: "Campaign Name", value: campaignName });
  }

  fields.push({
    label: "Entity Type",
    value: row.entityType.toUpperCase(),
  });
  fields.push({ label: "Scope", value: formatScope(row) });

  if (matchType) {
    fields.push({ label: "Match Type", value: matchType });
  }

  fields.push({ label: "Strategy", value: formatStrategy(row) });
  fields.push({ label: "Entity", value: row.entityName });

  if (user) {
    fields.push({ label: "User", value: user });
  }

  return { fields, condition };
}

/** Same layout for inline row expansion when only a LogEntry is available. */
export function buildLogEntryDetailFields(
  entry: LogEntry,
  options?: { isRetrying?: boolean },
): { fields: ActionDetailField[]; condition: ConditionDisplay | null } {
  const pseudoRow: ActionLogRow = {
    id: entry.id,
    parentEntryId: entry.id,
    status: entry.status,
    entityName: entry.entityName,
    entityType: entry.scopeLevel,
    campaignName: entry.campaignName ?? "",
    actor: entry.actor,
    timestamp: entry.timestamp,
    campaignType: entry.campaignType ?? "—",
    source:
      entry.tab === "setup" || entry.actionType === "setup-change"
        ? "Goal Based Optimizer"
        : "Campaign Optimizer",
    actionLabel: entry.claim,
    parentEntry: entry,
  };

  return buildActionDetailFields(pseudoRow, options);
}

export { STATUS_LABELS, resolveConditionDisplay };
