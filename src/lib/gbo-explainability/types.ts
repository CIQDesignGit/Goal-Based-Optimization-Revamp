/**
 * Action Logs (GBO Explainability) — core types for P0.
 * One event stream; Automation vs Setup are view filters, not separate stores.
 */

export type ActorKind = "ally-ai" | "rule-based" | "human" | "system";

export type ActionStatus = "success" | "failure" | "partial" | "retrying";

export type ChangeStatus = "created" | "updated" | "deleted";

export type ActionTab = "automation" | "setup";

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
  diffs: ValueDiff[];
  dayParting?: DayPartingDiff;
  failure?: FailureInfo;
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
  /** Retry bookkeeping */
  retryOfId?: string;
  retryAttempt?: number;
  canRetry?: boolean;
  retryBlockedReason?: string;
  retryCooldownUntil?: string;
  retryOutcomeLabel?: string;
};

export type ActiveFilterChip = {
  id: string;
  label: string;
  /** common filters persist across tabs; tab-specific clear on switch */
  scope: "common" | "tab";
  key: string;
  value: string;
};

export type FilterState = {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  actionStatus: ActionStatus | "all";
  /** Setup */
  user?: string;
  changeStatus?: ChangeStatus | "all";
  setupStep?: string | "all";
  /** Automation */
  automationType?: AutomationType | "all";
  actionType?: ActionType | "all";
  failureCategory?: FailureReasonCategory | "all";
  outOfBudgetOnly?: boolean;
};
