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
  getDefaultBudgetWindowStart,
  GOALS_SCOPE_ROWS,
  type ConstraintLast30Days,
} from "@/lib/gbo-optimization/setup-data";

// ---------------------------------------------------------------------------
// Shared row-state types (lifted from step components)
// ---------------------------------------------------------------------------

export type GoalsRowState = {
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
  changeCount: number;
};

// ---------------------------------------------------------------------------
// Initial state factories
// ---------------------------------------------------------------------------

function padMonthlyBudgets(budgets: string[]): string[] {
  return Array.from(
    { length: BUDGET_MONTHS.length },
    (_, index) => budgets[index] ?? "",
  );
}

export function createInitialGoalsRowState(): Record<string, GoalsRowState> {
  return Object.fromEntries(
    GOALS_SCOPE_ROWS.map((row) => {
      const monthlyBudgets = padMonthlyBudgets(row.monthlyBudgets);

      return [
        row.id,
        {
          goalValue: row.goalValue,
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

function nextChangeId(): string {
  changeIdCounter += 1;
  return `change-${changeIdCounter}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SetupSessionState = {
  goalsRowState: Record<string, GoalsRowState>;
  constraintsRowState: Record<string, ConstraintRowState>;
  monthWindowStart: number;
  goalsHistoricHintDismissed: boolean;
  changeLedger: ChangeLedgerEntry[];
  summaryReviewed: boolean;

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

  setMonthWindowStart: (
    value: number | ((current: number) => number),
  ) => void;

  setGoalsHistoricHintDismissed: (value: boolean) => void;

  setSummaryReviewed: (value: boolean) => void;

  recordChange: (entry: Omit<ChangeLedgerEntry, "id" | "timestamp">) => void;

  getImpactedScopes: () => ImpactedScope[];

  resetSession: () => void;
};

function createInitialSessionState(): Pick<
  SetupSessionState,
  | "goalsRowState"
  | "constraintsRowState"
  | "monthWindowStart"
  | "goalsHistoricHintDismissed"
  | "changeLedger"
  | "summaryReviewed"
> {
  return {
    goalsRowState: createInitialGoalsRowState(),
    constraintsRowState: createInitialConstraintsRowState(),
    monthWindowStart: getDefaultBudgetWindowStart(BUDGET_CURRENT_MONTH_INDEX),
    goalsHistoricHintDismissed: false,
    changeLedger: [],
    summaryReviewed: false,
  };
}

export const useSetupSessionStore = create<SetupSessionState>((set, get) => ({
  ...createInitialSessionState(),

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

  setMonthWindowStart: (value) => {
    set((state) => ({
      monthWindowStart:
        typeof value === "function" ? value(state.monthWindowStart) : value,
    }));
  },

  setGoalsHistoricHintDismissed: (value) => {
    set({ goalsHistoricHintDismissed: value });
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
        existing.changeCount += 1;
        continue;
      }

      grouped.set(entry.scopeId, {
        scopeId: entry.scopeId,
        scopeName: entry.scopeName,
        fields: [entry.fieldLabel],
        changeCount: 1,
      });
    }

    return Array.from(grouped.values());
  },

  resetSession: () => {
    changeIdCounter = 0;
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
