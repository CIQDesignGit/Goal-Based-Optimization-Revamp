export type OptimizerType = "ally-ai" | "rule-based";

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
] as const;

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
  includeSeasonality: boolean,
  includeConstraints: boolean,
): StepDefinition[] {
  const flow: StepDefinition[] = [
    { key: "general", label: "General" },
    { key: "goals-budgets", label: "Goals & Budgets" },
  ];

  if (includeSeasonality) {
    flow.push({ key: "seasonality", label: "Seasonality" });
  }

  if (includeConstraints) {
    flow.push({ key: "constraints", label: "Constraints" });
  }

  flow.push({ key: "optimizer", label: "Optimizer" });
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

export type SetupFlowOptions = {
  includeSeasonality?: boolean;
  includeConstraints?: boolean;
};

/** Returns wizard steps for the selected optimizer and optional step toggles (FR-005). */
export function getSetupSteps(
  optimizer: OptimizerType,
  options: SetupFlowOptions = {},
): SetupStepConfig[] {
  const { includeSeasonality = false, includeConstraints = false } = options;

  if (optimizer === "ally-ai") {
    return withStepIds(buildAllyAiFlow(includeSeasonality, includeConstraints));
  }

  return withStepIds(RULE_BASED_FLOW);
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

export const PREFILL_METRIC_OPTIONS = [
  { value: "roas", label: "ROAS" },
  { value: "acos", label: "ACOS" },
] as const;

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

export function getDefaultBudgetWindowStart(
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): number {
  return Math.max(0, currentMonthIndex - (BUDGET_MONTH_VISIBLE_RECENT - 1));
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
      "",
      "",
      "",
      "",
    ],
    fyTotal: "$10,000",
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
      "",
      "",
    ],
    fyTotal: "$12,600",
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

export type ConstraintRow = {
  id: string;
  name: string;
  indent?: boolean;
  goalValue: string;
  genericKeyword?: string;
  clientBrandedKeyword?: string;
  clientBrandedProduct?: string;
  competitorKeyword?: string;
  competitorProduct?: string;
  auto?: string;
  others?: string;
  total?: string;
  sp?: string;
  sb?: string;
};

export const CONSTRAINTS_SCOPE_ROWS: ConstraintRow[] = [
  {
    id: "entire-business",
    name: "Entire Business",
    goalValue: "",
  },
  {
    id: "jbc-fresh",
    name: "JBC Fresh",
    indent: true,
    goalValue: "$12",
    genericKeyword: "70%",
    competitorKeyword: "30%",
    total: "100% / 100%",
    sb: "15%",
  },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    goalValue: "$1,232",
    genericKeyword: "70%",
    competitorKeyword: "8%",
    competitorProduct: "20%",
    auto: "2%",
    total: "100% / 100%",
    sb: "15%",
  },
  {
    id: "ocean-adventures",
    name: "Ocean Adventures",
    indent: true,
    goalValue: "$1,234",
    total: "0% / 100%",
  },
  {
    id: "pilgrims",
    name: "Pilgrims",
    indent: true,
    goalValue: "$23,432",
    genericKeyword: "62%",
    competitorKeyword: "10%",
    competitorProduct: "20%",
    auto: "8%",
    total: "100% / 100%",
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
