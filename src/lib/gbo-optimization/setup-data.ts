export const SETUP_STEPS = [
  {
    id: 1,
    key: "general",
    label: "General",
    nextLabel: "Goals & Budgets",
  },
  {
    id: 2,
    key: "goals-budgets",
    label: "Goals & Budgets",
    nextLabel: "Set Constraints",
  },
  {
    id: 3,
    key: "constraints",
    label: "Constraints",
    nextLabel: "Set Optimizer",
  },
  {
    id: 4,
    key: "optimizer",
    label: "Optimizer",
    nextLabel: "Complete Setup",
  },
] as const;

export type SetupStepKey = (typeof SETUP_STEPS)[number]["key"];

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
] as const;

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
    goalMetric: "",
    goalValue: "",
    last30Days: "",
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
    goalValue: "",
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
    ],
    fyTotal: "$206,808",
  },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "",
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
    goalValue: "",
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
    ],
    fyTotal: "$37,500",
  },
  {
    id: "pilgrims",
    name: "Pilgrims",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "",
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
  { id: "jbc-fresh", name: "JBC Fresh", indent: true, goal: "ROAS", value: "$12" },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    goal: "ROAS",
    value: "$1,232",
  },
  {
    id: "ocean-adventures",
    name: "Ocean Adventures",
    indent: true,
    goal: "ROAS",
    value: "$1,234",
  },
  { id: "pilgrims", name: "Pilgrims", indent: true, goal: "ROAS", value: "$23,432" },
] as const;
