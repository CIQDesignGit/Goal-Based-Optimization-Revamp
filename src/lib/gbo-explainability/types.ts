/**
 * Action Logs (GBO Explainability) — core types for P0.
 * One unified event stream; Alerts (daily role summaries) vs Action Log (detail).
 */

import type {
  ChangeLedgerEntry,
  TaxonomySnapshot,
} from "@/lib/gbo-optimization/setup-session-store";

export type SetupSessionSnapshot = {
  goalLabel?: string;
  aggressivenessLabel?: string;
  taxonomyBaseline?: TaxonomySnapshot;
  taxonomyCurrent?: TaxonomySnapshot;
  changeLedger: ChangeLedgerEntry[];
};

export type ActorKind =
  | "ally-ai"
  | "rule-based"
  | "human"
  | "day-parting";

export type ActionStatus = "success" | "failure" | "partial" | "retrying";

export type ChangeStatus = "created" | "updated" | "deleted";

/** Legacy field on entries — no longer drives top-level navigation. */
export type ActionTab = "automation" | "setup";

export type PageView = "alerts" | "action-log";

/** Daily alert grouping by who took action — four actor types only. */
export type AlertRole = "human" | "ally-ai" | "day-parting" | "rule-based";

export type AutomationType =
  | "ally-ai"
  | "rule-based"
  | "day-parting"
  | "custom"
  | "out-of-budget";

export type ActionType =
  | "bid-change"
  | "budget-change"
  | "day-parting-change"
  | "status-change"
  | "setup-change"
  | "api-failure"
  | "out-of-budget";

export type FailureReasonCategory =
  | "business-rule"
  | "retailer-api"
  | "transient"
  | "logic"
  | "validation";

export type SummarySource = "ai" | "template" | "human";

export type AccountOptimizerConfig = {
  hasAllyAi: boolean;
  hasRuleBased: boolean;
};

export type DemoPageState =
  | "live"
  | "unsupported-retailer"
  | "strategy-not-live"
  | "purged-entry";

export type Actor = {
  kind: ActorKind;
  /** Display label at action time (immutable) */
  label: string;
  /** Human email when kind = human */
  email?: string;
  deactivated?: boolean;
  /** Ally AI trigger or rule name */
  triggerOrRule?: string;
};

export type ValueDiff = {
  field: string;
  before: string | null;
  after: string | null;
  changeStatus: ChangeStatus;
};

/** Hourly multipliers 0–23 for day-parting deep diff */
export type DayPartingSchedule = {
  label: string;
  hours: number[];
};

export type DayPartingDiff = {
  before: DayPartingSchedule | null;
  after: DayPartingSchedule | null;
};

export type FailureInfo = {
  category: FailureReasonCategory;
  /** Machine / structured code */
  code: string;
  /** Plain-language explanation */
  message: string;
};

export type BatchCounts = {
  succeeded: number;
  failed: number;
  total: number;
};

export type LogActionDetail = {
  id: string;
  label: string;
  changeStatus?: ChangeStatus;
  entityName: string;
  entityId: string;
  scopeLevel: string;
  /** Optional — shown in Action Log table */
  campaignName?: string;
  campaignType?: string;
  diffs: ValueDiff[];
  dayParting?: DayPartingDiff;
  failure?: FailureInfo;
};

/** One flattened row in the Action Log table. */
export type ActionLogRow = {
  id: string;
  parentEntryId: string;
  status: ActionStatus;
  entityName: string;
  entityType: string;
  campaignName: string;
  actor: Actor;
  timestamp: string;
  campaignType: string;
  source: string;
  actionLabel: string;
  parentEntry: LogEntry;
  detail?: LogActionDetail;
};

export type LogEntry = {
  id: string;
  tab: ActionTab;
  timestamp: string; // ISO UTC
  actor: Actor;
  status: ActionStatus;
  actionType: ActionType;
  automationType?: AutomationType;
  /** One-line claim — primary row content */
  claim: string;
  /** Why (trigger, intent, or failure context) */
  reason: string;
  /** Expected impact; use null → show "Impact pending" */
  impact: string | null;
  summarySource: SummarySource;
  entityName: string;
  entityId: string;
  scopeLevel: string;
  campaignName?: string;
  campaignType?: string;
  /** Setup session grouping */
  isSessionGroup?: boolean;
  sessionSummary?: string;
  children?: LogActionDetail[];
  /** Single-action detail when not a group */
  diffs?: ValueDiff[];
  dayParting?: DayPartingDiff;
  failure?: FailureInfo;
  batch?: BatchCounts;
  changeStatus?: ChangeStatus;
  setupStep?: string;
  /** Frozen Save & Launch review payload — mirrors the GBO Summary step. */
  setupSnapshot?: SetupSessionSnapshot;
  /** Retry bookkeeping */
  retryOfId?: string;
  retryAttempt?: number;
  canRetry?: boolean;
  retryBlockedReason?: string;
  retryCooldownUntil?: string;
  retryOutcomeLabel?: string;
  /** Actions overridden by another actor (e.g. rule after Ally AI). */
  conflictCount?: number;
  /** Optional per-conflict detail when available from the backend. */
  conflictDetails?: ConflictDetail[];
};

export type ConflictActorChange = {
  actorType: string;
  actorName?: string;
  timestamp: string;
  change: string;
  /** One-line summary shown at the bottom of the card. */
  summary: string;
};

export type ConflictDetail = {
  entityName: string;
  overriddenActor: string;
  timeSinceOverride: string;
  /** First actor chronologically — left card. */
  otherChange: ConflictActorChange;
  /** Second actor that superseded the first — right card. */
  inEffectNow: ConflictActorChange;
};

export type AlertConflictDetail = ConflictDetail & {
  id: string;
};

export type AlertDeviationDetail = {
  id: string;
  entityName: string;
  field: string;
  before: string;
  after: string;
  percentChange: number;
};

export type AlertSummary = {
  id: string;
  date: string; // YYYY-MM-DD local
  timestamp: string;
  role: AlertRole;
  /** Newest entry in the daily role group — for reference only. */
  entryId: string;
  /** All entries rolled into this daily role card. */
  entryIds: string[];
  actionCount: number;
  failureCount: number;
  conflictCount: number;
  highDeviationCount: number;
  conflicts: AlertConflictDetail[];
  deviations: AlertDeviationDetail[];
  aiSummary: string;
  /** Primary line — what changed */
  claim: string;
  /** Why / trigger context */
  reason: string;
  /** Expected impact; null → omit or show pending */
  impact: string | null;
  summarySource: SummarySource;
  status: ActionStatus;
  actor: Actor;
  entityName: string;
};

export type ActiveFilterChip = {
  id: string;
  /** Full label for screen readers and fallbacks. */
  label: string;
  /** Muted category shown on the left of the chip (e.g. "Entity Type"). */
  categoryLabel: string;
  /** Primary value shown on the chip (e.g. "Campaign"). */
  valueLabel: string;
  scope: "common" | "detail";
  key: string;
  value: string;
};

export type FilterState = {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  actionStatus: ActionStatus | "all";
  actorRole: AlertRole | "all";
  user: string;
  changeStatus: ChangeStatus | "all";
  setupStep: string;
  actionType: ActionType | "all";
  failureCategory: FailureReasonCategory | "all";
  outOfBudgetOnly: boolean;
  /** Retailer categorization filters (Action Log panel). */
  entityType: string;
  campaignType: string;
  matchType: string;
  source: string;
  objective: string;
  strategy: string;
};
