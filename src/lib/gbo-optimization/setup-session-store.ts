import { create } from "zustand";

import {
  buildManualLockedPercents,
  formatPercentNumber,
  redistributePercentFields,
  parsePercent,
  SPEND_PERCENT_FIELDS,
  CAMPAIGN_PERCENT_FIELDS,
  type CampaignPercentField,
  type PercentField,
  type SpendPercentField,
} from "@/lib/gbo-optimization/constraint-distribution";
import {
  BUDGET_CURRENT_MONTH_INDEX,
  BUDGET_MONTHS,
  CONSTRAINTS_SCOPE_ROWS,
  ENTIRE_BUSINESS_SCOPE_ID,
  getDefaultBudgetWindowEnd,
  getDefaultBudgetWindowStart,
  getDefaultLevelsForBudgetType,
  getGoalTypeLabel,
  getLevel2Options,
  GOALS_GOAL_EDITABLE_ROWS,
  GOALS_SCOPE_ROWS,
  resolveInitialMonthlyBudgets,
  type AggressivenessLevel,
  type ConstraintLast30Days,
  type GoalType,
  type GoalMetricValue,
} from "@/lib/gbo-optimization/setup-data";

// ---------------------------------------------------------------------------
// Shared row-state types (lifted from step components)
// ---------------------------------------------------------------------------

export type GoalsRowState = {
  goalMetric: GoalMetricValue | null;
  goalValue: string;
  monthlyBudgets: string[];
  historicGoalValue: string;
  historicMonthlyBudgets: string[];
  /** Persists edited styling across wizard navigation (FR-013). */
  editedGoalValue: boolean;
  editedMonthlyBudgets: boolean[];
};

export type ConstraintValues = {
  goalValue: string;
  genericKeyword: string;
  clientBrandedKeyword: string;
  competitorKeyword: string;
  competitorProduct: string;
  auto: string;
  others: string;
  campaignSp: string;
  campaignSb: string;
  campaignSd: string;
  bidFloor: string;
  bidCeiling: string;
  budgetFloor: string;
  budgetCeiling: string;
};

export type ConstraintValueField = keyof ConstraintValues;

export type ConstraintRowState = {
  values: ConstraintValues;
  historicPercents: Record<PercentField, number>;
  historicValues: ConstraintValues;
  overridden: Partial<Record<ConstraintValueField, boolean>>;
  /** Auto-rebalanced fields — keeps blue styling across navigation (FR-013). */
  adjusted: Partial<Record<ConstraintValueField, boolean>>;
};

// ---------------------------------------------------------------------------
// Change ledger — session-wide audit trail for Summary + hover diffs
// ---------------------------------------------------------------------------

export type SetupChangeStep =
  | "general"
  | "goals-budgets"
  | "constraints"
  | "seasonality"
  | "optimizer";

export type SetupChangeCategory =
  | "goal"
  | "budget"
  | "constraint"
  | "seasonality"
  | "general";

export type ChangeLedgerEntry = {
  id: string;
  step: SetupChangeStep;
  scopeId: string;
  scopeName: string;
  field: string;
  fieldLabel: string;
  from: string;
  to: string;
  category: SetupChangeCategory;
  timestamp: number;
};

export type ImpactedScope = {
  scopeId: string;
  scopeName: string;
  fields: string[];
  categories: SetupChangeCategory[];
  changeCount: number;
};

export type BudgetDefinitionType = "retailer" | "internal";

/** Session-start snapshot of how budget Scope is organized (taxonomy). */
export type TaxonomySnapshot = {
  budgetType: BudgetDefinitionType;
  level1: string;
  level2: string;
};

export type GeneralConfig = {
  goalType: GoalType | null;
  aggressiveness: AggressivenessLevel | null;
  granularity: string;
  budgetType: BudgetDefinitionType;
  level1: string;
  level2: string;
  prefillMetric: string;
  /** FR-006 — shown after the user changes goal type mid-session. */
  showGoalChangeImpact: boolean;
  previousGoalType: GoalType | null;
  /** Shown after the user changes budget definition / Level 1 / Level 2. */
  showTaxonomyChangeImpact: boolean;
};

export function createInitialGeneralConfig(): GeneralConfig {
  return {
    goalType: null,
    aggressiveness: null,
    granularity: "Monthly",
    budgetType: "retailer",
    level1: "portfolio",
    level2: "profiles",
    prefillMetric: "roas",
    showGoalChangeImpact: false,
    previousGoalType: null,
    showTaxonomyChangeImpact: false,
  };
}

export function createInitialTaxonomySnapshot(): TaxonomySnapshot {
  const config = createInitialGeneralConfig();

  return {
    budgetType: config.budgetType,
    level1: config.level1,
    level2: config.level2,
  };
}

export function getTaxonomySnapshotFromConfig(
  config: Pick<GeneralConfig, "budgetType" | "level1" | "level2">,
): TaxonomySnapshot {
  return {
    budgetType: config.budgetType,
    level1: config.level1,
    level2: config.level2,
  };
}

export function hasTaxonomyChanged(
  baseline: TaxonomySnapshot,
  config: Pick<GeneralConfig, "budgetType" | "level1" | "level2">,
): boolean {
  return (
    baseline.budgetType !== config.budgetType ||
    baseline.level1 !== config.level1 ||
    baseline.level2 !== config.level2
  );
}

export function isGeneralConfigComplete(_config: GeneralConfig): boolean {
  return true;
}

export function areAllGoalsBudgetsGoalsSelected(
  rowState: Record<string, GoalsRowState>,
): boolean {
  return GOALS_GOAL_EDITABLE_ROWS.every(
    (row) => rowState[row.id]?.goalMetric != null,
  );
}

export function getMissingGoalRowIds(
  rowState: Record<string, GoalsRowState>,
): string[] {
  return GOALS_GOAL_EDITABLE_ROWS.filter(
    (row) => !rowState[row.id]?.goalMetric,
  ).map((row) => row.id);
}

export const PERFORMANCE_GATE_DEFAULT_MIN_SPEND_FLOOR = 70;

/** True when a goal is selected but the target value needed for gating is missing. */
export function rowNeedsPerformanceGateGoalValue(
  state: GoalsRowState | undefined,
): boolean {
  if (!state?.goalMetric) return false;
  return !Boolean(state.goalValue.trim());
}

// ---------------------------------------------------------------------------
// Initial state factories
// ---------------------------------------------------------------------------

export function createInitialGoalsRowState(): Record<string, GoalsRowState> {
  return Object.fromEntries(
    GOALS_SCOPE_ROWS.map((row) => {
      const monthlyBudgets = resolveInitialMonthlyBudgets(row);

      return [
        row.id,
        {
          goalMetric: null,
          goalValue: "",
          monthlyBudgets,
          historicGoalValue: row.goalValue,
          historicMonthlyBudgets: [...monthlyBudgets],
          editedGoalValue: false,
          editedMonthlyBudgets: Array.from(
            { length: BUDGET_MONTHS.length },
            () => false,
          ),
        },
      ];
    }),
  );
}

function emptyConstraintValues(): ConstraintValues {
  return {
    goalValue: "",
    genericKeyword: "",
    clientBrandedKeyword: "",
    competitorKeyword: "",
    competitorProduct: "",
    auto: "",
    others: "",
    campaignSp: "",
    campaignSb: "",
    campaignSd: "",
    bidFloor: "",
    bidCeiling: "",
    budgetFloor: "",
    budgetCeiling: "",
  };
}

function buildHistoricPercents(
  values: ConstraintValues,
): Record<PercentField, number> {
  return Object.fromEntries(
    [...SPEND_PERCENT_FIELDS, ...CAMPAIGN_PERCENT_FIELDS].map((field) => [
      field,
      parsePercent(values[field]),
    ]),
  ) as Record<PercentField, number>;
}

function buildConstraintRowStateFromHistoric(
  last30Days: ConstraintLast30Days = {},
): ConstraintRowState {
  const values: ConstraintValues = {
    ...emptyConstraintValues(),
    goalValue: last30Days.goalValue ?? "",
    genericKeyword: last30Days.genericKeyword ?? "",
    clientBrandedKeyword: last30Days.clientBrandedKeyword ?? "",
    competitorKeyword: last30Days.competitorKeyword ?? "",
    competitorProduct: last30Days.competitorProduct ?? "",
    auto: last30Days.auto ?? "",
    others: last30Days.others ?? "",
    campaignSp: last30Days.campaignSp ?? "",
    campaignSb: last30Days.campaignSb ?? "",
    campaignSd: last30Days.campaignSd ?? "",
    bidFloor: last30Days.bidFloor ?? "",
    bidCeiling: last30Days.bidCeiling ?? "",
    budgetFloor: last30Days.budgetFloor ?? "",
    budgetCeiling: last30Days.budgetCeiling ?? "",
  };

  const historicPercents = buildHistoricPercents(values);
  const spendDistributed = redistributePercentFields(
    SPEND_PERCENT_FIELDS,
    historicPercents,
    {},
  );
  const campaignDistributed = redistributePercentFields(
    CAMPAIGN_PERCENT_FIELDS,
    historicPercents,
    {},
  );

  return {
    values: {
      ...values,
      ...spendDistributed,
      ...campaignDistributed,
    },
    historicPercents,
    historicValues: values,
    overridden: {},
    adjusted: {},
  };
}

export function createInitialConstraintsRowState(): Record<
  string,
  ConstraintRowState
> {
  return Object.fromEntries(
    CONSTRAINTS_SCOPE_ROWS.map((row) => [
      row.id,
      buildConstraintRowStateFromHistoric(row.last30Days),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Scope name lookup
// ---------------------------------------------------------------------------

const SCOPE_NAME_BY_ID = new Map<string, string>(
  [...GOALS_SCOPE_ROWS, ...CONSTRAINTS_SCOPE_ROWS].map((row) => [
    row.id,
    row.name,
  ]),
);

function resolveScopeName(scopeId: string): string {
  return SCOPE_NAME_BY_ID.get(scopeId) ?? scopeId;
}

let changeIdCounter = 0;
let missingGoalHighlightTimer: ReturnType<typeof setTimeout> | null = null;
let setupToastTimer: ReturnType<typeof setTimeout> | null = null;

function nextChangeId(): string {
  changeIdCounter += 1;
  return `change-${changeIdCounter}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SetupSessionState = {
  generalConfig: GeneralConfig;
  /** Taxonomy at session start — used for Summary before/after comparison. */
  taxonomyBaseline: TaxonomySnapshot;
  goalsRowState: Record<string, GoalsRowState>;
  constraintsRowState: Record<string, ConstraintRowState>;
  monthWindowStart: number;
  monthWindowEnd: number;
  goalsHistoricHintDismissed: boolean;
  goalsOptionalStepsHintDismissed: boolean;
  goalsRuleBasedNoticeDismissed: boolean;
  goalsMissingGoalsNoticeDismissed: boolean;
  changeLedger: ChangeLedgerEntry[];
  summaryReviewed: boolean;
  toastMessage: string | null;
  toastVariant: "warning" | "success";
  missingGoalHighlightRowIds: string[];
  includePerformanceGate: boolean;
  performanceGateMinSpendFloor: number;

  setGoalType: (goalType: GoalType | null) => void;
  setAggressiveness: (level: AggressivenessLevel | null) => void;
  updateGeneralConfig: (patch: Partial<GeneralConfig>) => void;
  dismissGoalChangeImpact: () => void;
  dismissTaxonomyChangeImpact: () => void;

  setGoalsRowState: (
    updater:
      | Record<string, GoalsRowState>
      | ((
          current: Record<string, GoalsRowState>,
        ) => Record<string, GoalsRowState>),
  ) => void;

  setConstraintsRowState: (
    updater:
      | Record<string, ConstraintRowState>
      | ((
          current: Record<string, ConstraintRowState>,
        ) => Record<string, ConstraintRowState>),
  ) => void;

  setMonthWindowRange: (start: number, end: number) => void;

  setGoalsHistoricHintDismissed: (value: boolean) => void;

  setGoalsOptionalStepsHintDismissed: (value: boolean) => void;

  setGoalsRuleBasedNoticeDismissed: (value: boolean) => void;

  setGoalsMissingGoalsNoticeDismissed: (value: boolean) => void;

  setIncludePerformanceGate: (value: boolean) => void;

  setPerformanceGateMinSpendFloor: (value: number) => void;

  setSummaryReviewed: (value: boolean) => void;

  recordChange: (entry: Omit<ChangeLedgerEntry, "id" | "timestamp">) => void;

  getImpactedScopes: () => ImpactedScope[];

  showSetupToast: (
    message: string,
    options?: { variant?: "warning" | "success" },
  ) => void;

  triggerMissingGoalsFeedback: () => void;

  resetSession: () => void;
};

function createInitialSessionState(): Pick<
  SetupSessionState,
  | "generalConfig"
  | "taxonomyBaseline"
  | "goalsRowState"
  | "constraintsRowState"
  | "monthWindowStart"
  | "monthWindowEnd"
  | "goalsHistoricHintDismissed"
  | "goalsOptionalStepsHintDismissed"
  | "goalsRuleBasedNoticeDismissed"
  | "goalsMissingGoalsNoticeDismissed"
  | "changeLedger"
  | "summaryReviewed"
  | "toastMessage"
  | "toastVariant"
  | "missingGoalHighlightRowIds"
  | "includePerformanceGate"
  | "performanceGateMinSpendFloor"
> {
  const defaultMonthWindowStart = getDefaultBudgetWindowStart(
    BUDGET_CURRENT_MONTH_INDEX,
  );
  const generalConfig = createInitialGeneralConfig();

  return {
    generalConfig,
    taxonomyBaseline: createInitialTaxonomySnapshot(),
    goalsRowState: createInitialGoalsRowState(),
    constraintsRowState: createInitialConstraintsRowState(),
    monthWindowStart: defaultMonthWindowStart,
    monthWindowEnd: getDefaultBudgetWindowEnd(defaultMonthWindowStart),
    goalsHistoricHintDismissed: false,
    goalsOptionalStepsHintDismissed: false,
    goalsRuleBasedNoticeDismissed: false,
    goalsMissingGoalsNoticeDismissed: false,
    changeLedger: [],
    summaryReviewed: false,
    toastMessage: null,
    toastVariant: "warning",
    missingGoalHighlightRowIds: [],
    includePerformanceGate: false,
    performanceGateMinSpendFloor: PERFORMANCE_GATE_DEFAULT_MIN_SPEND_FLOOR,
  };
}

export const useSetupSessionStore = create<SetupSessionState>((set, get) => ({
  ...createInitialSessionState(),

  setGoalType: (goalType) => {
    set((state) => {
      const previousGoalType = state.generalConfig.goalType;
      const isChange =
        previousGoalType !== null &&
        goalType !== null &&
        previousGoalType !== goalType;

      const goalsRowState = Object.fromEntries(
        Object.entries(state.goalsRowState).map(([rowId, row]) => [
          rowId,
          rowId === ENTIRE_BUSINESS_SCOPE_ID
            ? row
            : { ...row, goalMetric: goalType },
        ]),
      );

      return {
        generalConfig: {
          ...state.generalConfig,
          goalType,
          previousGoalType: isChange
            ? previousGoalType
            : state.generalConfig.previousGoalType,
          showGoalChangeImpact: isChange
            ? true
            : state.generalConfig.showGoalChangeImpact,
        },
        goalsRowState,
      };
    });
  },

  setAggressiveness: (level) => {
    set((state) => ({
      generalConfig: {
        ...state.generalConfig,
        aggressiveness: level,
      },
    }));
  },

  updateGeneralConfig: (patch) => {
    set((state) => {
      const previous = state.generalConfig;
      let next: GeneralConfig = { ...previous, ...patch };

      const budgetTypeChanged =
        patch.budgetType !== undefined &&
        patch.budgetType !== previous.budgetType;
      const level1Changed =
        patch.level1 !== undefined && patch.level1 !== previous.level1;
      const level2Changed =
        patch.level2 !== undefined && patch.level2 !== previous.level2;
      const taxonomyFieldsTouched =
        budgetTypeChanged || level1Changed || level2Changed;

      // Switching retailer ↔ internal resets Level 1/2 to defaults for that type.
      if (budgetTypeChanged) {
        const defaults = getDefaultLevelsForBudgetType(patch.budgetType!);
        next = {
          ...next,
          level1: patch.level1 ?? defaults.level1,
          level2: patch.level2 ?? defaults.level2,
        };
      }

      // Level 2 cannot match Level 1 — pick the first valid alternative.
      if (next.level1 === next.level2) {
        const level2Options = getLevel2Options(next.budgetType, next.level1);
        next = {
          ...next,
          level2: level2Options[0]?.value ?? next.level2,
        };
      }

      const taxonomyChanged = hasTaxonomyChanged(
        state.taxonomyBaseline,
        next,
      );

      return {
        // Taxonomy edits need re-approval on Summary (same as ledger changes).
        summaryReviewed: taxonomyFieldsTouched
          ? false
          : state.summaryReviewed,
        generalConfig: {
          ...next,
          showTaxonomyChangeImpact: taxonomyFieldsTouched
            ? taxonomyChanged
            : taxonomyChanged
              ? previous.showTaxonomyChangeImpact
              : false,
        },
      };
    });
  },

  dismissGoalChangeImpact: () => {
    set((state) => ({
      generalConfig: {
        ...state.generalConfig,
        showGoalChangeImpact: false,
      },
    }));
  },

  dismissTaxonomyChangeImpact: () => {
    set((state) => ({
      generalConfig: {
        ...state.generalConfig,
        showTaxonomyChangeImpact: false,
      },
    }));
  },

  setGoalsRowState: (updater) => {
    set((state) => ({
      goalsRowState:
        typeof updater === "function" ? updater(state.goalsRowState) : updater,
    }));
  },

  setConstraintsRowState: (updater) => {
    set((state) => ({
      constraintsRowState:
        typeof updater === "function"
          ? updater(state.constraintsRowState)
          : updater,
    }));
  },

  setMonthWindowRange: (start, end) => {
    set({
      monthWindowStart: Math.max(0, start),
      monthWindowEnd: Math.min(BUDGET_MONTHS.length, Math.max(start + 1, end)),
    });
  },

  setGoalsHistoricHintDismissed: (value) => {
    set({ goalsHistoricHintDismissed: value });
  },

  setGoalsOptionalStepsHintDismissed: (value) => {
    set({ goalsOptionalStepsHintDismissed: value });
  },

  setGoalsRuleBasedNoticeDismissed: (value) => {
    set({ goalsRuleBasedNoticeDismissed: value });
  },

  setGoalsMissingGoalsNoticeDismissed: (value) => {
    set({ goalsMissingGoalsNoticeDismissed: value });
  },

  setIncludePerformanceGate: (value) => {
    set({ includePerformanceGate: value });
  },

  setPerformanceGateMinSpendFloor: (value) => {
    const clamped = Math.min(99, Math.max(1, Math.round(value)));
    set({ performanceGateMinSpendFloor: clamped });
  },

  setSummaryReviewed: (value) => {
    set({ summaryReviewed: value });
  },

  recordChange: (entry) => {
    const from = entry.from.trim();
    const to = entry.to.trim();

    if (from === to) return;

    set((state) => ({
      summaryReviewed: false,
      changeLedger: [
        ...state.changeLedger,
        {
          ...entry,
          id: nextChangeId(),
          scopeName: entry.scopeName || resolveScopeName(entry.scopeId),
          timestamp: Date.now(),
        },
      ],
    }));
  },

  getImpactedScopes: () => {
    const grouped = new Map<string, ImpactedScope>();

    for (const entry of get().changeLedger) {
      const existing = grouped.get(entry.scopeId);

      if (existing) {
        if (!existing.fields.includes(entry.fieldLabel)) {
          existing.fields.push(entry.fieldLabel);
        }
        if (!existing.categories.includes(entry.category)) {
          existing.categories.push(entry.category);
        }
        existing.changeCount += 1;
        continue;
      }

      grouped.set(entry.scopeId, {
        scopeId: entry.scopeId,
        scopeName: entry.scopeName,
        fields: [entry.fieldLabel],
        categories: [entry.category],
        changeCount: 1,
      });
    }

    return Array.from(grouped.values()).sort(
      (left, right) => right.changeCount - left.changeCount,
    );
  },

  showSetupToast: (message, options) => {
    if (setupToastTimer) {
      clearTimeout(setupToastTimer);
    }

    set({
      toastMessage: message,
      toastVariant: options?.variant ?? "warning",
    });

    setupToastTimer = setTimeout(() => {
      set({ toastMessage: null, toastVariant: "warning" });
      setupToastTimer = null;
    }, 4000);
  },

  triggerMissingGoalsFeedback: () => {
    const missingIds = getMissingGoalRowIds(get().goalsRowState);

    if (missingIds.length === 0) {
      return;
    }

    if (missingGoalHighlightTimer) {
      clearTimeout(missingGoalHighlightTimer);
    }

    if (setupToastTimer) {
      clearTimeout(setupToastTimer);
    }

    set({
      toastMessage: "Goal must be selected to enter budgets.",
      toastVariant: "warning",
      missingGoalHighlightRowIds: missingIds,
    });

    missingGoalHighlightTimer = setTimeout(() => {
      set({ missingGoalHighlightRowIds: [] });
      missingGoalHighlightTimer = null;
    }, 4000);

    setupToastTimer = setTimeout(() => {
      set({ toastMessage: null });
      setupToastTimer = null;
    }, 4000);
  },

  resetSession: () => {
    changeIdCounter = 0;

    if (missingGoalHighlightTimer) {
      clearTimeout(missingGoalHighlightTimer);
      missingGoalHighlightTimer = null;
    }

    if (setupToastTimer) {
      clearTimeout(setupToastTimer);
      setupToastTimer = null;
    }

    set(createInitialSessionState());
  },
}));

// ---------------------------------------------------------------------------
// Change-ledger helpers for step components
// ---------------------------------------------------------------------------

export function isPercentConstraintField(
  field: ConstraintValueField,
): field is PercentField {
  return (
    SPEND_PERCENT_FIELDS.includes(field as SpendPercentField) ||
    CAMPAIGN_PERCENT_FIELDS.includes(field as CampaignPercentField)
  );
}

export const CONSTRAINT_FIELD_LABELS: Record<ConstraintValueField, string> = {
  goalValue: "Goal value",
  genericKeyword: "Generic keyword",
  clientBrandedKeyword: "Client branded keyword",
  competitorKeyword: "Competitor keyword",
  competitorProduct: "Competitor product",
  auto: "Auto",
  others: "Others",
  campaignSp: "SP",
  campaignSb: "SB",
  campaignSd: "SD",
  bidFloor: "Bid floor",
  bidCeiling: "Bid ceiling",
  budgetFloor: "Budget floor",
  budgetCeiling: "Budget ceiling",
};

export function getLatestCellChange(
  scopeId: string,
  field: string,
): ChangeLedgerEntry | undefined {
  const ledger = useSetupSessionStore.getState().changeLedger;

  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const entry = ledger[index];
    if (entry.scopeId === scopeId && entry.field === field) {
      return entry;
    }
  }

  return undefined;
}

export function getGoalsBudgetFieldKey(monthIndex: number): string {
  return `monthlyBudgets.${monthIndex}`;
}

export const SETUP_CHANGE_STEP_LABELS: Record<SetupChangeStep, string> = {
  general: "General",
  "goals-budgets": "Goals & Budgets",
  constraints: "Constraints",
  seasonality: "Seasonality",
  optimizer: "Optimizer",
};

export const SETUP_CHANGE_CATEGORY_LABELS: Record<SetupChangeCategory, string> = {
  goal: "Goal",
  budget: "Budget",
  constraint: "Constraint",
  seasonality: "Seasonality",
  general: "General",
};

export function groupChangesByStep(
  ledger: ChangeLedgerEntry[],
): { step: SetupChangeStep; label: string; entries: ChangeLedgerEntry[] }[] {
  const grouped = new Map<SetupChangeStep, ChangeLedgerEntry[]>();

  for (const entry of ledger) {
    const existing = grouped.get(entry.step) ?? [];
    existing.push(entry);
    grouped.set(entry.step, existing);
  }

  const stepOrder: SetupChangeStep[] = [
    "general",
    "goals-budgets",
    "constraints",
    "seasonality",
    "optimizer",
  ];

  return stepOrder
    .filter((step) => grouped.has(step))
    .map((step) => ({
      step,
      label: SETUP_CHANGE_STEP_LABELS[step],
      entries: grouped.get(step) ?? [],
    }));
}

export function recordConstraintFieldChange(
  rowId: string,
  field: ConstraintValueField,
  from: string,
  to: string,
): void {
  const { recordChange } = useSetupSessionStore.getState();

  recordChange({
    step: "constraints",
    scopeId: rowId,
    scopeName: resolveScopeName(rowId),
    field,
    fieldLabel: CONSTRAINT_FIELD_LABELS[field],
    from,
    to,
    category: "constraint",
  });
}

export function recordGoalsGoalChange(
  rowId: string,
  from: string,
  to: string,
): void {
  const { recordChange } = useSetupSessionStore.getState();

  recordChange({
    step: "goals-budgets",
    scopeId: rowId,
    scopeName: resolveScopeName(rowId),
    field: "goalValue",
    fieldLabel: "Target value",
    from,
    to,
    category: "goal",
  });
}

export function recordGoalsGoalMetricChange(
  rowId: string,
  from: GoalType | null,
  to: GoalType | null,
): void {
  const { recordChange } = useSetupSessionStore.getState();
  const formatMetric = (metric: GoalType | null) =>
    metric ? getGoalTypeLabel(metric) : "None";

  recordChange({
    step: "goals-budgets",
    scopeId: rowId,
    scopeName: resolveScopeName(rowId),
    field: "goalMetric",
    fieldLabel: "Goal",
    from: formatMetric(from),
    to: formatMetric(to),
    category: "goal",
  });
}

export function recordGoalsBudgetChange(
  rowId: string,
  monthIndex: number,
  from: string,
  to: string,
): void {
  const { recordChange } = useSetupSessionStore.getState();
  const monthLabel = BUDGET_MONTHS[monthIndex] ?? `Month ${monthIndex + 1}`;

  recordChange({
    step: "goals-budgets",
    scopeId: rowId,
    scopeName: resolveScopeName(rowId),
    field: `monthlyBudgets.${monthIndex}`,
    fieldLabel: `${monthLabel} budget`,
    from,
    to,
    category: "budget",
  });
}
