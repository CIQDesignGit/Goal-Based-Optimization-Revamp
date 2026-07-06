export type OptimizerType = "ally-ai" | "rule-based" | "custom";

export type GoalType =
  | "brand-roas"
  | "incremental-roas"
  | "total-roas"
  | "sov";

export type AggressivenessLevel = "aggressive" | "moderate";

export type SetupStepKey =
  | "general"
  | "goals-budgets"
  | "constraints"
  | "seasonality"
  | "optimizer"
  | "summary";

export type SetupStepConfig = {
  id: number;
  key: SetupStepKey;
  label: string;
  nextLabel: string;
};

export const OPTIMIZER_OPTIONS = [
  {
    value: "ally-ai" as const,
    label: "Ally AI",
    description:
      "Recommended — allocates spend and manages constraints automatically. No manual rules required.",
    recommended: true,
  },
  {
    value: "rule-based" as const,
    label: "Rule-based",
    description:
      "Define explicit strategies and rules manually. Constraints and seasonality do not apply (except floor/ceiling).",
    recommended: false,
  },
  {
    value: "custom" as const,
    label: "Custom",
    description:
      "Mix Ally AI and rule-based — choose the optimizer independently for each brand on the Goals step.",
    recommended: false,
  },
] as const;

export const GOAL_TYPE_OPTIONS = [
  {
    value: "brand-roas" as const,
    label: "Brand ROAS",
    description: "Optimize return on ad spend at the brand level.",
  },
  {
    value: "incremental-roas" as const,
    label: "Incremental ROAS",
    description: "Focus on incremental lift from advertising spend.",
  },
  {
    value: "total-roas" as const,
    label: "Total ROAS",
    description: "Optimize total return including organic and paid.",
  },
  {
    value: "sov" as const,
    label: "SOV (Share of Voice)",
    description:
      "Maximize share of voice in the category. Available with rule-based optimization only.",
    blocksAllyAi: true,
  },
] as const;

export const AGGRESSIVENESS_OPTIONS = [
  {
    value: "aggressive" as const,
    label: "Aggressive",
    description: "Prioritize growth and market share over efficiency.",
  },
  {
    value: "moderate" as const,
    label: "Moderate",
    description: "Balance growth targets with spend efficiency.",
  },
] as const;

export function isSovGoal(goalType: GoalType | null): boolean {
  return goalType === "sov";
}

export function getGoalTypeLabel(goalType: GoalType): string {
  return (
    GOAL_TYPE_OPTIONS.find((option) => option.value === goalType)?.label ??
    goalType
  );
}

export function getOptimizerLabel(optimizerType: OptimizerType): string {
  return (
    OPTIMIZER_OPTIONS.find((option) => option.value === optimizerType)?.label ??
    optimizerType
  );
}

export function getGoalChangeImpactMessage(
  optimizerType: OptimizerType,
  goalType: GoalType,
): string {
  const goalLabel = getGoalTypeLabel(goalType);

  if (optimizerType === "rule-based") {
    return `Changing the goal to ${goalLabel} will recalibrate existing strategies across all brands in this portfolio. Review goals, floor/ceiling constraints, and optimizer rules before continuing.`;
  }

  return `Changing the goal to ${goalLabel} will recalibrate Ally AI targets across all brands in this portfolio. Review goals, budgets, constraints, and seasonality before continuing.`;
}

export const RULE_BASED_OPTIMIZER_NOTICE =
  "Rule-based mode does not include budget entry. Your flow will be Goals (targets only) → Constraints (floor/ceiling only) → Optimizer → Summary.";

export const ALLY_AI_RECOMMENDATION_NOTICE =
  "Ally AI is recommended — it allocates spend and manages constraints automatically, with no manual rules required.";

type StepDefinition = {
  key: SetupStepKey;
  label: string;
  nextLabel?: string;
};

function withStepIds(flow: StepDefinition[]): SetupStepConfig[] {
  return flow.map((step, index) => {
    const nextStep = flow[index + 1];
    return {
      id: index + 1,
      key: step.key,
      label: step.label,
      nextLabel: step.nextLabel ?? nextStep?.label ?? "Save & Launch",
    };
  });
}

function buildAllyAiFlow(
  includeConstraints: boolean,
  includeSeasonality: boolean,
): StepDefinition[] {
  const flow: StepDefinition[] = [
    { key: "general", label: "General" },
    { key: "goals-budgets", label: "Goals & Budgets" },
  ];

  if (includeConstraints) {
    flow.push({ key: "constraints", label: "Constraints" });
  }

  if (includeSeasonality) {
    flow.push({ key: "seasonality", label: "Seasonality" });
  }

  flow.push({ key: "summary", label: "Summary", nextLabel: "Save & Launch" });

  return flow;
}

const RULE_BASED_FLOW: StepDefinition[] = [
  { key: "general", label: "General" },
  { key: "goals-budgets", label: "Goals" },
  { key: "constraints", label: "Constraints" },
  { key: "optimizer", label: "Optimizer" },
  { key: "summary", label: "Summary", nextLabel: "Save & Launch" },
];

/** Returns wizard steps for the selected optimizer and optional step toggles (FR-005). */
export type SetupFlowOptions = {
  includeSeasonality?: boolean;
  includeConstraints?: boolean;
};

export function getSetupSteps(
  optimizer: OptimizerType,
  options: SetupFlowOptions = {},
): SetupStepConfig[] {
  const { includeSeasonality = false, includeConstraints = false } = options;

  if (optimizer === "rule-based") {
    return withStepIds(RULE_BASED_FLOW);
  }

  // Ally AI and Custom share the full flow (budgets, optional constraints/seasonality).
  return withStepIds(
    buildAllyAiFlow(includeConstraints, includeSeasonality),
  );
}

/** Default Ally AI flow — optional steps off, optimizer before summary. */
export const SETUP_STEPS = getSetupSteps("ally-ai");

export type SeasonalityChartPoint = {
  date: string;
  value: number;
};

/** Sample daily budget curve for the seasonality chart prototype. */
export const SEASONALITY_CHART_DATA: SeasonalityChartPoint[] = [
  { date: "1 Jan", value: 2600 },
  { date: "7 Jan", value: 2750 },
  { date: "14 Jan", value: 2400 },
  { date: "21 Jan", value: 2800 },
  { date: "28 Jan", value: 2200 },
  { date: "7 Feb", value: 2500 },
  { date: "14 Feb", value: 2100 },
  { date: "21 Feb", value: 2700 },
  { date: "28 Feb", value: 2300 },
  { date: "7 Mar", value: 2000 },
  { date: "16 Mar", value: 2400 },
  { date: "23 Mar", value: 1800 },
  { date: "30 Mar", value: 2100 },
  { date: "7 Apr", value: 1900 },
  { date: "22 Apr", value: 2200 },
  { date: "29 Apr", value: 1700 },
  { date: "7 May", value: 2000 },
  { date: "29 May", value: 1600 },
  { date: "5 Jun", value: 1800 },
  { date: "19 Jun", value: 1500 },
  { date: "5 Jul", value: 1700 },
  { date: "19 Jul", value: 1400 },
  { date: "2 Aug", value: 1600 },
  { date: "16 Aug", value: 1450 },
  { date: "30 Aug", value: 1500 },
  { date: "13 Sep", value: 1400 },
  { date: "27 Sep", value: 1550 },
  { date: "11 Oct", value: 1450 },
  { date: "25 Oct", value: 1500 },
  { date: "8 Nov", value: 1400 },
  { date: "30 Nov", value: 1450 },
];

export const SEASONALITY_SCOPE_OPTIONS = [
  { value: "entire-business", label: "Entire Business" },
  { value: "portfolio", label: "Portfolio" },
  { value: "category", label: "Category" },
] as const;

export const BUDGET_GRANULARITIES = [
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Yearly",
] as const;

export const LEVEL_1_OPTIONS = [
  { value: "portfolio", label: "Portfolio" },
] as const;

export const LEVEL_2_OPTIONS = [{ value: "na", label: "NA" }] as const;

export const PREFILL_METRIC_OPTIONS = GOAL_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export type GoalMetricValue = GoalType;

export function normalizeGoalMetricValue(metric: string): GoalMetricValue {
  const normalized = metric.trim().toLowerCase();

  if (normalized === "sov" || normalized.includes("share of voice")) {
    return "sov";
  }
  if (
    normalized === "incremental-roas" ||
    normalized === "incremental roas" ||
    normalized === "incremental"
  ) {
    return "incremental-roas";
  }
  if (
    normalized === "total-roas" ||
    normalized === "total roas" ||
    normalized === "total"
  ) {
    return "total-roas";
  }
  if (
    normalized === "brand-roas" ||
    normalized === "brand roas" ||
    normalized === "roas" ||
    normalized === "acos"
  ) {
    return "brand-roas";
  }

  const match = GOAL_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match?.value ?? "brand-roas";
}

export function isRoasGoalMetric(metric: string): boolean {
  return normalizeGoalMetricValue(metric) !== "sov";
}

export const BUDGET_MONTHS = [
  "Jan '26",
  "Feb '26",
  "Mar '26",
  "Apr '26",
  "May '26",
  "Jun '26",
  "Jul '26",
  "Aug '26",
  "Sep '26",
  "Oct '26",
  "Nov '26",
  "Dec '26",
] as const;

/** Months shown before the anchor month in the default budget window (FR-009). */
export const BUDGET_MONTH_VISIBLE_RECENT = 4;

/** Future months shown after the recent window (may be blank). */
export const BUDGET_MONTH_VISIBLE_FUTURE = 2;

export const BUDGET_MONTH_VISIBLE_COUNT =
  BUDGET_MONTH_VISIBLE_RECENT + BUDGET_MONTH_VISIBLE_FUTURE;

/** Prototype anchor month — July 2026. */
export const BUDGET_CURRENT_MONTH_INDEX = 6;

/** Past months before the anchor cannot be edited in the budget table. */
export function isBudgetMonthLocked(
  monthIndex: number,
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): boolean {
  return monthIndex < currentMonthIndex;
}

export function isBudgetCurrentMonth(
  monthIndex: number,
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): boolean {
  return monthIndex === currentMonthIndex;
}

/** Months after the anchor are not prefilled — users enter them when ready. */
export function isBudgetFutureMonth(
  monthIndex: number,
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): boolean {
  return monthIndex > currentMonthIndex;
}

export function getDefaultBudgetWindowStart(
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): number {
  return Math.max(0, currentMonthIndex - (BUDGET_MONTH_VISIBLE_RECENT - 1));
}

export function getDefaultBudgetWindowEnd(
  windowStart: number = getDefaultBudgetWindowStart(),
): number {
  return Math.min(
    BUDGET_MONTHS.length,
    windowStart + BUDGET_MONTH_VISIBLE_COUNT,
  );
}

export type ScopeRow = {
  id: string;
  name: string;
  indent?: boolean;
  expandable?: boolean;
  goalMetric: string;
  goalValue: string;
  last30Days: string;
  monthlyBudgets: string[];
  fyTotal: string;
};

/** Monthly budget default from last-30-day spend (prototype uses the row's L30D budget). */
export function getScopeRowDefaultMonthlyBudget(row: ScopeRow): string {
  return row.monthlyBudgets.find((budget) => budget.trim() !== "")?.trim() ?? "";
}

export function resolveInitialMonthlyBudgets(row: ScopeRow): string[] {
  const defaultBudget = getScopeRowDefaultMonthlyBudget(row);

  return Array.from({ length: BUDGET_MONTHS.length }, (_, index) => {
    if (isBudgetFutureMonth(index)) {
      return "";
    }

    const existing = row.monthlyBudgets[index]?.trim() ?? "";
    return existing || defaultBudget;
  });
}

export const GOALS_SCOPE_ROWS: ScopeRow[] = [
  {
    id: "entire-business",
    name: "Entire Business",
    expandable: true,
    goalMetric: "ROAS",
    goalValue: "14.8",
    last30Days: "14.6",
    monthlyBudgets: [
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
      "$22,809",
    ],
    fyTotal: "$341,256",
  },
  {
    id: "jbc-fresh",
    name: "JBC Fresh",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "17.5",
    last30Days: "18.48",
    monthlyBudgets: [
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
      "$13,808",
    ],
    fyTotal: "$206,808",
  },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "15.0",
    last30Days: "16.21",
    monthlyBudgets: [
      "$3,000",
      "$3,000",
      "$3,000",
      "$3,000",
      "$3,000",
      "$3,000",
      "$3,000",
      "$3,000",
    ],
    fyTotal: "$45,000",
  },
  {
    id: "ocean-adventures",
    name: "Ocean Adventures",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "12.8",
    last30Days: "12.34",
    monthlyBudgets: [
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
      "$2,500",
    ],
    fyTotal: "$30,000",
  },
  {
    id: "pilgrims",
    name: "Pilgrims",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "14.2",
    last30Days: "14.56",
    monthlyBudgets: [
      "$3,501",
      "$3,501",
      "$3,501",
      "$3,501",
      "$3,501",
      "$3,501",
      "$3,501",
      "$3,501",
    ],
    fyTotal: "$52,515",
  },
  {
    id: "harvest-gold",
    name: "Harvest Gold",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "15.5",
    last30Days: "15.02",
    monthlyBudgets: [
      "$4,200",
      "$4,200",
      "$4,200",
      "$4,200",
      "$4,200",
      "$4,200",
      "$4,200",
      "$4,200",
    ],
    fyTotal: "$50,400",
  },
  {
    id: "natures-best",
    name: "Nature's Best",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "11.5",
    last30Days: "11.87",
    monthlyBudgets: [
      "$1,850",
      "$1,850",
      "$1,850",
      "$1,850",
      "$1,850",
      "$1,850",
      "$1,850",
      "$1,850",
    ],
    fyTotal: "$22,200",
  },
  {
    id: "coastal-select",
    name: "Coastal Select",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "13.2",
    last30Days: "13.44",
    monthlyBudgets: [
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
      "$2,100",
    ],
    fyTotal: "$25,200",
  },
  {
    id: "premium-pet",
    name: "Premium Pet Care",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "10.5",
    last30Days: "10.92",
    monthlyBudgets: [
      "$980",
      "$980",
      "$980",
      "$980",
      "$980",
      "$980",
      "$980",
      "$980",
    ],
    fyTotal: "$11,760",
  },
  {
    id: "sunrise-dairy",
    name: "Sunrise Dairy",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "16.8",
    last30Days: "17.33",
    monthlyBudgets: [
      "$5,600",
      "$5,600",
      "$5,600",
      "$5,600",
      "$5,600",
      "$5,600",
      "$5,600",
      "$5,600",
    ],
    fyTotal: "$67,200",
  },
  {
    id: "valley-organics",
    name: "Valley Organics",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "9.5",
    last30Days: "9.78",
    monthlyBudgets: [
      "$1,200",
      "$1,200",
      "$1,200",
      "$1,200",
      "$1,200",
      "$1,200",
      "$1,200",
      "$1,200",
    ],
    fyTotal: "$14,400",
  },
];

export type ConstraintLast30Days = {
  goalValue?: string;
  genericKeyword?: string;
  clientBrandedKeyword?: string;
  competitorKeyword?: string;
  competitorProduct?: string;
  auto?: string;
  others?: string;
  campaignSp?: string;
  campaignSb?: string;
  campaignSd?: string;
  bidFloor?: string;
  bidCeiling?: string;
  budgetFloor?: string;
  budgetCeiling?: string;
};

export type ConstraintRow = {
  id: string;
  name: string;
  indent?: boolean;
  /** Prefill source — last 30 days of performance (shown until the user edits). */
  last30Days?: ConstraintLast30Days;
};

export const CONSTRAINTS_SCOPE_ROWS: ConstraintRow[] = [
  {
    id: "entire-business",
    name: "Entire Business",
  },
  {
    id: "jbc-fresh",
    name: "JBC Fresh",
    indent: true,
    last30Days: {
      goalValue: "$28",
      genericKeyword: "70%",
      competitorKeyword: "30%",
      campaignSp: "45%",
      campaignSb: "15%",
      campaignSd: "40%",
    },
  },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    last30Days: {
      goalValue: "$35",
      genericKeyword: "70%",
      competitorKeyword: "8%",
      competitorProduct: "20%",
      auto: "2%",
      campaignSp: "45%",
      campaignSb: "15%",
      campaignSd: "40%",
    },
  },
  {
    id: "ocean-adventures",
    name: "Ocean Adventures",
    indent: true,
    last30Days: {
      goalValue: "$22",
      genericKeyword: "55%",
      clientBrandedKeyword: "15%",
      competitorKeyword: "20%",
      competitorProduct: "10%",
    },
  },
  {
    id: "pilgrims",
    name: "Pilgrims",
    indent: true,
    last30Days: {
      goalValue: "$40",
      genericKeyword: "62%",
      competitorKeyword: "10%",
      competitorProduct: "20%",
      auto: "8%",
    },
  },
];

export const OPTIMIZER_SCOPE_ROWS = [
  { id: "entire-business", name: "Entire Business", expandable: true },
  {
    id: "jbc-fresh",
    name: "JBC Fresh",
    indent: true,
    goal: "Brands tROAS",
    value: "$25",
    allyMode: true,
  },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    goal: "Brands tROAS",
    value: "$7",
    allyMode: true,
  },
  {
    id: "pilgrims",
    name: "Pilgrims",
    indent: true,
    goal: "Brands tROAS",
    value: "$2",
    allyMode: true,
  },
  {
    id: "ocean-adventures",
    name: "Ocean Adventures",
    indent: true,
  },
] as const;
