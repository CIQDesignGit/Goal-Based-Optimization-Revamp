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

/** Portfolio-level copy when the whole setup uses rule-based (General / Goals banners). */
export const RULE_BASED_OPTIMIZER_NOTICE =
  "Rule-based mode does not include budget entry, and seasonality is not available. Your flow will be Goals (targets only) → Optimizer → Summary (plus Constraints if you enable the toggle for floor/ceiling). The Optimizer step is always included before Summary.";

/**
 * Item-level copy when one brand/scope row flips Ally → rule-based (FR-019b).
 * Portfolio wizard does not rebuild — only this item skips those steps.
 */
export const RULE_BASED_ITEM_MODE_NOTICE =
  "For this item only: rule-based skips budget entry and seasonality. Path is Goals → Optimizer → Summary (Constraints only if the floor/ceiling toggle is on). Other items keep their own path.";

/** Short toast copy — same length/style as other setup toasts. */
export const RULE_BASED_ITEM_MODE_TOAST =
  "Rule-based skips budget and seasonality for this item. Path: Goals → Optimizer → Summary.";

/** Short persistent cue shown on a rule-based Optimizer row. */
export const RULE_BASED_ITEM_SKIP_CUE =
  "Since you have selected rule-based, budget entry and seasonality are skipped for this item";

/**
 * Prototype default rules shown under the Rule Based chip (stacked cards).
 * Top name is visible; remaining count drives the “stack” depth peek.
 */
export const DEFAULT_RULE_BASED_BID_STRATEGIES = [
  "Reward High Performers",
  "Protect Low Performers",
  "Maintain Average ROAS",
] as const;

export const DEFAULT_RULE_BASED_BUDGET_STRATEGIES = [
  "Redistribute Underperforming",
  "Pace to Monthly Budget",
] as const;

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

  if (includeSeasonality) {
    flow.push({ key: "seasonality", label: "Seasonality" });
  }

  if (includeConstraints) {
    flow.push({ key: "constraints", label: "Constraints" });
  }

  // Optimizer is always in the flow (no toggle) — after Constraints, before Summary.
  flow.push(
    { key: "optimizer", label: "Optimizer" },
    { key: "summary", label: "Summary", nextLabel: "Save & Launch" },
  );

  return flow;
}

function buildRuleBasedFlow(includeConstraints: boolean): StepDefinition[] {
  const flow: StepDefinition[] = [
    { key: "general", label: "General" },
    { key: "goals-budgets", label: "Goals" },
  ];

  if (includeConstraints) {
    flow.push({ key: "constraints", label: "Constraints" });
  }

  flow.push(
    { key: "optimizer", label: "Optimizer" },
    { key: "summary", label: "Summary", nextLabel: "Save & Launch" },
  );

  return flow;
}

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
    return withStepIds(buildRuleBasedFlow(includeConstraints));
  }

  // Ally AI and Custom share the full flow (budgets, optional constraints/seasonality).
  return withStepIds(
    buildAllyAiFlow(includeConstraints, includeSeasonality),
  );
}

/** Default Ally AI flow — optional steps off; Optimizer always sits before Summary. */
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

/**
 * Synthetic ledger scope for seasonality Level 2–style Summary tags.
 * Not a real taxonomy row — Summary uses it only for edit-level styling.
 */
export const SEASONALITY_LEVEL2_SCOPE_ID = "seasonality-level2";

export type SeasonalityBudgetMode = "percent" | "absolute";

export type SeasonalityEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  scope: string;
  budgetMode: SeasonalityBudgetMode;
  budgetValue: string;
  sourceKind?: "custom" | "prefilled";
  templateId?: string;
};

export type SuggestedSeasonalityEventTemplate = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type SeasonalityDraftFormState = {
  name: string;
  startDate: string;
  endDate: string;
  scope: string | null;
  budgetMode: SeasonalityBudgetMode;
  budgetValue: string;
};

export const BLANK_SEASONALITY_FORM: SeasonalityDraftFormState = {
  name: "",
  startDate: "Jul 01, 2026",
  endDate: "Jul 01, 2026",
  scope: null,
  budgetMode: "percent",
  budgetValue: "0",
};

export type SeasonalityDraftRowTemplate = {
  id: string;
  kind: "custom" | "prefilled";
  form: SeasonalityDraftFormState;
};

/** Holiday event drafts shown together in the Suggested section. */
export const PREFILLED_HOLIDAY_SEASONALITY_DRAFTS: SeasonalityDraftRowTemplate[] = [
  {
    id: "halloween",
    kind: "prefilled",
    form: {
      name: "Halloween",
      startDate: "Oct 29, 2026",
      endDate: "Oct 31, 2026",
      scope: null,
      budgetMode: "percent",
      budgetValue: "0",
    },
  },
  {
    id: "thanksgiving",
    kind: "prefilled",
    form: {
      name: "Thanksgiving",
      startDate: "Nov 26, 2026",
      endDate: "Nov 28, 2026",
      scope: null,
      budgetMode: "percent",
      budgetValue: "0",
    },
  },
  {
    id: "christmas",
    kind: "prefilled",
    form: {
      name: "Christmas",
      startDate: "Dec 24, 2026",
      endDate: "Dec 26, 2026",
      scope: null,
      budgetMode: "percent",
      budgetValue: "0",
    },
  },
  {
    id: "new-years",
    kind: "prefilled",
    form: {
      name: "New Year's",
      startDate: "Dec 31, 2026",
      endDate: "Jan 01, 2027",
      scope: null,
      budgetMode: "percent",
      budgetValue: "0",
    },
  },
];

/**
 * Prototype seed data: 22 saved events so the Seasonality page can demo
 * Active / Upcoming / Past volume (relative to ~Jul 13, 2026).
 */
export const MOCK_SAVED_SEASONALITY_EVENTS: SeasonalityEvent[] = [
  // --- Active (running today) ---
  {
    id: "mock-active-midyear-push",
    name: "Mid-Year Push",
    startDate: "Jul 08, 2026",
    endDate: "Jul 18, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "12",
    sourceKind: "custom",
  },
  {
    id: "mock-active-summer-clearance",
    name: "Summer Clearance",
    startDate: "Jul 01, 2026",
    endDate: "Jul 31, 2026",
    scope: "portfolio",
    budgetMode: "percent",
    budgetValue: "8",
    sourceKind: "custom",
  },
  // --- Upcoming ---
  {
    id: "mock-upcoming-prime-day",
    name: "Prime Day Warm-up",
    startDate: "Jul 20, 2026",
    endDate: "Jul 22, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "15",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-back-to-school",
    name: "Back to School",
    startDate: "Aug 10, 2026",
    endDate: "Aug 24, 2026",
    scope: "profiles",
    budgetMode: "percent",
    budgetValue: "10",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-labor-day",
    name: "Labor Day Weekend",
    startDate: "Sep 04, 2026",
    endDate: "Sep 07, 2026",
    scope: "portfolio",
    budgetMode: "absolute",
    budgetValue: "4500",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-fall-launch",
    name: "Fall Assortment Launch",
    startDate: "Sep 15, 2026",
    endDate: "Sep 30, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "9",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-halloween",
    name: "Halloween Peak",
    startDate: "Oct 25, 2026",
    endDate: "Oct 31, 2026",
    scope: "profiles",
    budgetMode: "percent",
    budgetValue: "11",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-bfcm",
    name: "BFCM Week",
    startDate: "Nov 23, 2026",
    endDate: "Nov 30, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "22",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-holiday-gift",
    name: "Holiday Gift Guide",
    startDate: "Dec 01, 2026",
    endDate: "Dec 20, 2026",
    scope: "portfolio",
    budgetMode: "percent",
    budgetValue: "18",
    sourceKind: "custom",
  },
  {
    id: "mock-upcoming-boxing-day",
    name: "Boxing Day Sale",
    startDate: "Dec 26, 2026",
    endDate: "Dec 28, 2026",
    scope: "entire-business",
    budgetMode: "absolute",
    budgetValue: "6200",
    sourceKind: "custom",
  },
  // --- Past (ended before today) ---
  {
    id: "mock-past-new-year-2026",
    name: "New Year Kickoff",
    startDate: "Jan 01, 2026",
    endDate: "Jan 05, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "14",
    sourceKind: "custom",
  },
  {
    id: "mock-past-mlk",
    name: "MLK Weekend",
    startDate: "Jan 17, 2026",
    endDate: "Jan 19, 2026",
    scope: "portfolio",
    budgetMode: "percent",
    budgetValue: "5",
    sourceKind: "custom",
  },
  {
    id: "mock-past-super-bowl",
    name: "Super Bowl Promo",
    startDate: "Feb 06, 2026",
    endDate: "Feb 09, 2026",
    scope: "profiles",
    budgetMode: "percent",
    budgetValue: "16",
    sourceKind: "custom",
  },
  {
    id: "mock-past-valentines",
    name: "Valentine's Day",
    startDate: "Feb 10, 2026",
    endDate: "Feb 14, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "12",
    sourceKind: "custom",
  },
  {
    id: "mock-past-presidents-day",
    name: "Presidents' Day",
    startDate: "Feb 14, 2026",
    endDate: "Feb 16, 2026",
    scope: "portfolio",
    budgetMode: "absolute",
    budgetValue: "2800",
    sourceKind: "custom",
  },
  {
    id: "mock-past-spring-reset",
    name: "Spring Reset",
    startDate: "Mar 15, 2026",
    endDate: "Mar 28, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "7",
    sourceKind: "custom",
  },
  {
    id: "mock-past-easter",
    name: "Easter Weekend",
    startDate: "Apr 03, 2026",
    endDate: "Apr 05, 2026",
    scope: "profiles",
    budgetMode: "percent",
    budgetValue: "9",
    sourceKind: "custom",
  },
  {
    id: "mock-past-mothers-day",
    name: "Mother's Day",
    startDate: "May 08, 2026",
    endDate: "May 10, 2026",
    scope: "portfolio",
    budgetMode: "percent",
    budgetValue: "10",
    sourceKind: "custom",
  },
  {
    id: "mock-past-memorial-day",
    name: "Memorial Day",
    startDate: "May 22, 2026",
    endDate: "May 25, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "11",
    sourceKind: "custom",
  },
  {
    id: "mock-past-june-brand",
    name: "Brand Anniversary",
    startDate: "Jun 01, 2026",
    endDate: "Jun 07, 2026",
    scope: "entire-business",
    budgetMode: "absolute",
    budgetValue: "8000",
    sourceKind: "custom",
  },
  {
    id: "mock-past-fathers-day",
    name: "Father's Day",
    startDate: "Jun 19, 2026",
    endDate: "Jun 21, 2026",
    scope: "profiles",
    budgetMode: "percent",
    budgetValue: "8",
    sourceKind: "custom",
  },
  {
    id: "mock-past-july-4",
    name: "July 4th Weekend",
    startDate: "Jul 02, 2026",
    endDate: "Jul 05, 2026",
    scope: "entire-business",
    budgetMode: "percent",
    budgetValue: "13",
    sourceKind: "custom",
  },
];

/** @deprecated Use BLANK_SEASONALITY_FORM + PREFILLED_HOLIDAY_SEASONALITY_DRAFTS */
export const DEFAULT_SEASONALITY_DRAFT_ROWS: SeasonalityDraftRowTemplate[] = [
  { id: "custom", kind: "custom", form: BLANK_SEASONALITY_FORM },
  ...PREFILLED_HOLIDAY_SEASONALITY_DRAFTS,
];

export function suggestedTemplateToDraftForm(
  template: Pick<SuggestedSeasonalityEventTemplate, "name" | "startDate" | "endDate">,
): SeasonalityDraftFormState {
  return {
    name: template.name,
    startDate: template.startDate,
    endDate: template.endDate,
    scope: null,
    budgetMode: "percent",
    budgetValue: "0",
  };
}

/** Prototype "today" — keeps suggested events aligned with the 2026 demo data. */
export const SEASONALITY_REFERENCE_DATE = new Date(2026, 6, 6);

const SUGGESTED_SEASONALITY_EVENTS_BY_MONTH: Record<
  string,
  SuggestedSeasonalityEventTemplate[]
> = {
  "2026-07": [
    {
      id: "independence-day",
      name: "Independence Day",
      startDate: "Jul 03, 2026",
      endDate: "Jul 05, 2026",
      description: "US holiday weekend promotions",
    },
    {
      id: "prime-day",
      name: "Amazon Prime Day",
      startDate: "Jul 15, 2026",
      endDate: "Jul 16, 2026",
      description: "Major Amazon retail event",
    },
    {
      id: "mid-summer-sale",
      name: "Mid-Summer Sale",
      startDate: "Jul 10, 2026",
      endDate: "Jul 12, 2026",
      description: "Seasonal clearance across categories",
    },
    {
      id: "back-to-school",
      name: "Back to School Early Access",
      startDate: "Jul 28, 2026",
      endDate: "Jul 31, 2026",
      description: "Early school-season demand",
    },
  ],
  "2026-08": [
    {
      id: "tax-free-weekend",
      name: "Tax-Free Weekend",
      startDate: "Aug 07, 2026",
      endDate: "Aug 09, 2026",
      description: "State back-to-school tax holidays",
    },
    {
      id: "labor-day-prep",
      name: "Labor Day Prep",
      startDate: "Aug 28, 2026",
      endDate: "Aug 31, 2026",
      description: "End-of-summer holiday lead-in",
    },
  ],
  "2026-11": [
    {
      id: "black-friday",
      name: "Black Friday",
      startDate: "Nov 27, 2026",
      endDate: "Nov 29, 2026",
      description: "Peak holiday shopping weekend",
    },
    {
      id: "cyber-monday",
      name: "Cyber Monday",
      startDate: "Nov 30, 2026",
      endDate: "Nov 30, 2026",
      description: "Online-focused holiday sales day",
    },
  ],
};

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatSeasonalityMonthLabel(
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
) {
  return referenceDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** FR-019 — known retail events for the month containing the reference date. */
export function getSuggestedSeasonalityEvents(
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): SuggestedSeasonalityEventTemplate[] {
  return SUGGESTED_SEASONALITY_EVENTS_BY_MONTH[monthKeyFromDate(referenceDate)] ?? [];
}

export const BUDGET_GRANULARITIES = [
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Yearly",
] as const;

/** Retailer categorization — Level 1 and Level 2 share the same option set. */
export const RETAILER_LEVEL_OPTIONS = [
  { value: "portfolio", label: "Portfolio" },
  { value: "profiles", label: "Profiles" },
] as const;

/**
 * Internal (Campaign Taxonomy) levels.
 * Level 2 excludes whatever is selected for Level 1.
 */
export const INTERNAL_LEVEL_OPTIONS = [
  { value: "campaign-type", label: "Campaign Type" },
  { value: "product-line", label: "Product Line" },
  { value: "brand", label: "Brand" },
  { value: "sub-category", label: "Sub Category" },
  { value: "category", label: "Category" },
  { value: "sub-brand", label: "Sub Brand" },
] as const;

export const BUDGET_DEFINITION_LABELS = {
  retailer: "Retailer Categorization",
  internal: "Internal Categorization",
} as const;

/** @deprecated Prefer getLevelOptions(budgetType) — kept for seasonality portfolio filter. */
export const LEVEL_1_OPTIONS = RETAILER_LEVEL_OPTIONS;

export const LEVEL_2_OPTIONS = RETAILER_LEVEL_OPTIONS;

export type BudgetDefinitionTypeForLevels = "retailer" | "internal";

export function getLevelOptions(
  budgetType: BudgetDefinitionTypeForLevels,
): readonly { value: string; label: string }[] {
  return budgetType === "retailer"
    ? RETAILER_LEVEL_OPTIONS
    : INTERNAL_LEVEL_OPTIONS;
}

/** Level 2 cannot repeat the Level 1 pick. */
export function getLevel2Options(
  budgetType: BudgetDefinitionTypeForLevels,
  level1: string,
): { value: string; label: string }[] {
  return getLevelOptions(budgetType).filter((option) => option.value !== level1);
}

export function getDefaultLevelsForBudgetType(
  budgetType: BudgetDefinitionTypeForLevels,
): { level1: string; level2: string } {
  if (budgetType === "retailer") {
    return { level1: "portfolio", level2: "profiles" };
  }

  return { level1: "brand", level2: "sub-brand" };
}

export function getLevelLabel(
  budgetType: BudgetDefinitionTypeForLevels,
  value: string,
): string {
  return (
    getLevelOptions(budgetType).find((option) => option.value === value)
      ?.label ?? value
  );
}

/**
 * Seasonality Scope dropdown — Entire Business + the Level 1 / Level 2
 * dimensions chosen under Retailer or Internal Categorization in General.
 */
export function getSeasonalityScopeOptions(
  budgetType: BudgetDefinitionTypeForLevels,
  level1: string,
  level2: string,
): { value: string; label: string }[] {
  return [
    { value: "entire-business", label: "Entire Business" },
    { value: level1, label: getLevelLabel(budgetType, level1) },
    { value: level2, label: getLevelLabel(budgetType, level2) },
  ];
}

/** Resolve a saved event’s scope value to a display label (any taxonomy). */
export function getSeasonalityScopeLabel(
  scope: string,
  budgetType: BudgetDefinitionTypeForLevels,
  level1: string,
  level2: string,
): string {
  if (scope === "entire-business") return "Entire Business";

  const fromCurrent = getSeasonalityScopeOptions(
    budgetType,
    level1,
    level2,
  ).find((option) => option.value === scope);
  if (fromCurrent) return fromCurrent.label;

  // Fall back if taxonomy changed since the event was saved
  return (
    RETAILER_LEVEL_OPTIONS.find((option) => option.value === scope)?.label ??
    INTERNAL_LEVEL_OPTIONS.find((option) => option.value === scope)?.label ??
    scope
  );
}

export function getBudgetDefinitionLabel(
  budgetType: BudgetDefinitionTypeForLevels,
): string {
  return BUDGET_DEFINITION_LABELS[budgetType];
}

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
export const BUDGET_MONTH_VISIBLE_FUTURE = 1;

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

/** Calendar month immediately after the anchor (e.g. August when anchor is July). */
export function getNextBudgetMonthIndex(
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): number | null {
  const nextIndex = currentMonthIndex + 1;
  return nextIndex < BUDGET_MONTHS.length ? nextIndex : null;
}

export function isBudgetNextMonth(
  monthIndex: number,
  currentMonthIndex: number = BUDGET_CURRENT_MONTH_INDEX,
): boolean {
  return monthIndex === currentMonthIndex + 1;
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

/**
 * Taxonomy attributes for every leaf scope row.
 * Keys match Level 1 / Level 2 option values from retailer vs internal categorization.
 */
export type ScopeTaxonomy = {
  portfolio: string;
  profiles: string;
  brand: string;
  "sub-brand": string;
  category: string;
  "sub-category": string;
  "product-line": string;
  "campaign-type": string;
};

export type ScopeTaxonomyKey = keyof ScopeTaxonomy;

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
  /** Present on leaf rows — used when Level 1 / Level 2 columns are shown. */
  taxonomy?: ScopeTaxonomy;
};

/** Monthly budget default from last-30-day spend (prototype uses the row's L30D budget). */
export function getScopeRowDefaultMonthlyBudget(row: ScopeRow): string {
  return row.monthlyBudgets.find((budget) => budget.trim() !== "")?.trim() ?? "";
}

export function resolveInitialMonthlyBudgets(row: ScopeRow): string[] {
  const defaultBudget = getScopeRowDefaultMonthlyBudget(row);

  return Array.from({ length: BUDGET_MONTHS.length }, (_, index) => {
    // Current + future months stay empty — user must enter them (current gets a red nudge).
    if (isBudgetFutureMonth(index) || isBudgetCurrentMonth(index)) {
      return "";
    }

    const existing = row.monthlyBudgets[index]?.trim() ?? "";
    return existing || defaultBudget;
  });
}

/** Parent rollup row — goals are set on child brands only. */
export const ENTIRE_BUSINESS_SCOPE_ID = "entire-business";

/** Minimal shape needed to read Level 1 / Level 2 labels. */
export type TaxonomyScopeLike = {
  id: string;
  name: string;
  taxonomy?: ScopeTaxonomy;
};

/** Level keys that represent the parent rollup label on Entire Business. */
const ENTIRE_BUSINESS_LEVEL1_KEYS = new Set<string>([
  "portfolio",
  "brand",
  "category",
  "product-line",
  "campaign-type",
]);

/** Read Level 1 or Level 2 cell text from a row's taxonomy (or fall back to name). */
export function getScopeTaxonomyValue(
  row: TaxonomyScopeLike,
  levelKey: string,
): string {
  if (row.id === ENTIRE_BUSINESS_SCOPE_ID) {
    return ENTIRE_BUSINESS_LEVEL1_KEYS.has(levelKey) ? row.name : "";
  }

  if (!row.taxonomy) {
    return row.name;
  }

  const value = row.taxonomy[levelKey as ScopeTaxonomyKey];
  return value?.trim() ? value : row.name;
}

/** Keep Entire Business first; sort leaf rows by the selected Level 1 then Level 2. */
export function sortScopeRowsByLevels<T extends TaxonomyScopeLike>(
  rows: readonly T[],
  level1: string,
  level2: string,
): T[] {
  const parent = rows.find((row) => row.id === ENTIRE_BUSINESS_SCOPE_ID);
  const leaves = rows.filter((row) => row.id !== ENTIRE_BUSINESS_SCOPE_ID);

  const sortedLeaves = [...leaves].sort((a, b) => {
    const a1 = getScopeTaxonomyValue(a, level1);
    const b1 = getScopeTaxonomyValue(b, level1);
    if (a1 !== b1) return a1.localeCompare(b1);

    const a2 = getScopeTaxonomyValue(a, level2);
    const b2 = getScopeTaxonomyValue(b, level2);
    return a2.localeCompare(b2);
  });

  return parent ? [parent, ...sortedLeaves] : sortedLeaves;
}

/** Shared 12-month budget filler — repeats first filled month through Dec. */
function fillMonthlyBudgets(amounts: string[]): string[] {
  const seed =
    amounts.find((amount) => amount.trim() !== "")?.trim() ?? "$1,000";
  return Array.from({ length: BUDGET_MONTHS.length }, (_, index) =>
    amounts[index]?.trim() ? amounts[index] : seed,
  );
}

export const GOALS_SCOPE_ROWS: ScopeRow[] = [
  {
    id: "entire-business",
    name: "Entire Business",
    expandable: true,
    goalMetric: "ROAS",
    goalValue: "14.8",
    last30Days: "14.6",
    monthlyBudgets: fillMonthlyBudgets(["$28,500"]),
    fyTotal: "$342,000",
  },
  // --- JBC (brand) — multiple sub-brands ---
  {
    id: "jbc-fresh",
    name: "JBC Fresh",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "17.5",
    last30Days: "18.48",
    monthlyBudgets: fillMonthlyBudgets(["$13,808"]),
    fyTotal: "$165,696",
    taxonomy: {
      portfolio: "National Grocery",
      profiles: "JBC Fresh — US",
      brand: "JBC",
      "sub-brand": "JBC Fresh",
      category: "Fresh Foods",
      "sub-category": "Produce & Chilled",
      "product-line": "Core Grocery",
      "campaign-type": "Sponsored Products",
    },
  },
  {
    id: "jbc-frozen",
    name: "JBC Frozen Prepared",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "15.0",
    last30Days: "16.21",
    monthlyBudgets: fillMonthlyBudgets(["$3,000"]),
    fyTotal: "$36,000",
    taxonomy: {
      portfolio: "National Grocery",
      profiles: "JBC Frozen — US",
      brand: "JBC",
      "sub-brand": "JBC Frozen Prepared",
      category: "Frozen",
      "sub-category": "Prepared Meals",
      "product-line": "Core Grocery",
      "campaign-type": "Sponsored Products",
    },
  },
  {
    id: "jbc-deli",
    name: "JBC Deli",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "16.2",
    last30Days: "15.9",
    monthlyBudgets: fillMonthlyBudgets(["$2,400"]),
    fyTotal: "$28,800",
    taxonomy: {
      portfolio: "National Grocery",
      profiles: "JBC Deli — US",
      brand: "JBC",
      "sub-brand": "JBC Deli",
      category: "Fresh Foods",
      "sub-category": "Deli & Prepared",
      "product-line": "Core Grocery",
      "campaign-type": "Sponsored Brands",
    },
  },
  // --- Ocean Adventures ---
  {
    id: "ocean-adventures",
    name: "Ocean Adventures",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "12.8",
    last30Days: "12.34",
    monthlyBudgets: fillMonthlyBudgets(["$2,500"]),
    fyTotal: "$30,000",
    taxonomy: {
      portfolio: "Specialty Retail",
      profiles: "Ocean Adventures — Core",
      brand: "Ocean Adventures",
      "sub-brand": "Ocean Adventures Classic",
      category: "Seafood",
      "sub-category": "Wild Catch",
      "product-line": "Specialty",
      "campaign-type": "Sponsored Brands",
    },
  },
  {
    id: "ocean-premium",
    name: "Ocean Adventures Premium",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "11.4",
    last30Days: "11.02",
    monthlyBudgets: fillMonthlyBudgets(["$1,650"]),
    fyTotal: "$19,800",
    taxonomy: {
      portfolio: "Specialty Retail",
      profiles: "Ocean Adventures — Premium",
      brand: "Ocean Adventures",
      "sub-brand": "Ocean Adventures Premium",
      category: "Seafood",
      "sub-category": "Premium Cuts",
      "product-line": "Specialty",
      "campaign-type": "Sponsored Display",
    },
  },
  // --- Pilgrims ---
  {
    id: "pilgrims",
    name: "Pilgrims",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "14.2",
    last30Days: "14.56",
    monthlyBudgets: fillMonthlyBudgets(["$3,501"]),
    fyTotal: "$42,012",
    taxonomy: {
      portfolio: "National Grocery",
      profiles: "Pilgrims — Classic",
      brand: "Pilgrims",
      "sub-brand": "Pilgrims Classic",
      category: "Meat & Poultry",
      "sub-category": "Poultry",
      "product-line": "Core Grocery",
      "campaign-type": "Sponsored Products",
    },
  },
  {
    id: "pilgrims-organic",
    name: "Pilgrims Organic",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "13.1",
    last30Days: "12.85",
    monthlyBudgets: fillMonthlyBudgets(["$1,900"]),
    fyTotal: "$22,800",
    taxonomy: {
      portfolio: "National Grocery",
      profiles: "Pilgrims — Organic",
      brand: "Pilgrims",
      "sub-brand": "Pilgrims Organic",
      category: "Meat & Poultry",
      "sub-category": "Organic Poultry",
      "product-line": "Organic",
      "campaign-type": "Sponsored Products",
    },
  },
  // --- Other brands (single sub-brand each) ---
  {
    id: "harvest-gold",
    name: "Harvest Gold",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "15.5",
    last30Days: "15.02",
    monthlyBudgets: fillMonthlyBudgets(["$4,200"]),
    fyTotal: "$50,400",
    taxonomy: {
      portfolio: "Bakery Network",
      profiles: "Harvest Gold — National",
      brand: "Harvest Gold",
      "sub-brand": "Harvest Gold Bakery",
      category: "Bakery",
      "sub-category": "Bread & Rolls",
      "product-line": "Core Grocery",
      "campaign-type": "Sponsored Brands",
    },
  },
  {
    id: "natures-best",
    name: "Nature's Best",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "11.5",
    last30Days: "11.87",
    monthlyBudgets: fillMonthlyBudgets(["$1,850"]),
    fyTotal: "$22,200",
    taxonomy: {
      portfolio: "Organic Collective",
      profiles: "Nature's Best — West",
      brand: "Nature's Best",
      "sub-brand": "Nature's Best Essentials",
      category: "Organic Grocery",
      "sub-category": "Pantry Staples",
      "product-line": "Organic",
      "campaign-type": "Sponsored Products",
    },
  },
  {
    id: "coastal-select",
    name: "Coastal Select",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "13.2",
    last30Days: "13.44",
    monthlyBudgets: fillMonthlyBudgets(["$2,100"]),
    fyTotal: "$25,200",
    taxonomy: {
      portfolio: "Specialty Retail",
      profiles: "Coastal Select — East",
      brand: "Coastal Select",
      "sub-brand": "Coastal Select Catch",
      category: "Seafood",
      "sub-category": "Shellfish",
      "product-line": "Specialty",
      "campaign-type": "Sponsored Display",
    },
  },
  {
    id: "premium-pet",
    name: "Premium Pet Care",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "10.5",
    last30Days: "10.92",
    monthlyBudgets: fillMonthlyBudgets(["$980"]),
    fyTotal: "$11,760",
    taxonomy: {
      portfolio: "Pet Specialty",
      profiles: "Premium Pet — National",
      brand: "Premium Pet Care",
      "sub-brand": "Premium Pet Nutrition",
      category: "Pet",
      "sub-category": "Dog & Cat Food",
      "product-line": "Pet Care",
      "campaign-type": "Sponsored Products",
    },
  },
  {
    id: "sunrise-dairy",
    name: "Sunrise Dairy",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "16.8",
    last30Days: "17.33",
    monthlyBudgets: fillMonthlyBudgets(["$5,600"]),
    fyTotal: "$67,200",
    taxonomy: {
      portfolio: "National Grocery",
      profiles: "Sunrise Dairy — Midwest",
      brand: "Sunrise Dairy",
      "sub-brand": "Sunrise Dairy Fresh",
      category: "Dairy",
      "sub-category": "Milk & Cream",
      "product-line": "Core Grocery",
      "campaign-type": "Sponsored Brands",
    },
  },
  {
    id: "valley-organics",
    name: "Valley Organics",
    indent: true,
    goalMetric: "ROAS",
    goalValue: "9.5",
    last30Days: "9.78",
    monthlyBudgets: fillMonthlyBudgets(["$1,200"]),
    fyTotal: "$14,400",
    taxonomy: {
      portfolio: "Organic Collective",
      profiles: "Valley Organics — CA",
      brand: "Valley Organics",
      "sub-brand": "Valley Organics Farm",
      category: "Organic Grocery",
      "sub-category": "Produce",
      "product-line": "Organic",
      "campaign-type": "Sponsored Display",
    },
  },
];

/** Brand rows where users pick goals — excludes the Entire Business rollup row. */
export const GOALS_GOAL_EDITABLE_ROWS = GOALS_SCOPE_ROWS.filter(
  (row) => row.id !== ENTIRE_BUSINESS_SCOPE_ID,
);

export function isGoalEditableScopeRow(scopeId: string): boolean {
  return scopeId !== ENTIRE_BUSINESS_SCOPE_ID;
}

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
  taxonomy?: ScopeTaxonomy;
  /** Prefill source — last 30 days of performance (shown until the user edits). */
  last30Days?: ConstraintLast30Days;
};

/** Historic constraint seeds keyed by Goals brand id. */
const CONSTRAINT_LAST30_BY_ID: Record<string, ConstraintLast30Days> = {
  "jbc-fresh": {
    goalValue: "$28",
    genericKeyword: "70%",
    competitorKeyword: "30%",
    campaignSp: "45%",
    campaignSb: "15%",
    campaignSd: "40%",
  },
  "jbc-frozen": {
    goalValue: "$35",
    genericKeyword: "70%",
    competitorKeyword: "8%",
    competitorProduct: "20%",
    auto: "2%",
    campaignSp: "45%",
    campaignSb: "15%",
    campaignSd: "40%",
  },
  "jbc-deli": {
    goalValue: "$30",
    genericKeyword: "65%",
    competitorKeyword: "25%",
    auto: "10%",
    campaignSp: "50%",
    campaignSb: "30%",
    campaignSd: "20%",
  },
  "ocean-adventures": {
    goalValue: "$22",
    genericKeyword: "55%",
    clientBrandedKeyword: "15%",
    competitorKeyword: "20%",
    competitorProduct: "10%",
  },
  "ocean-premium": {
    goalValue: "$26",
    genericKeyword: "50%",
    clientBrandedKeyword: "20%",
    competitorKeyword: "20%",
    competitorProduct: "10%",
  },
  pilgrims: {
    goalValue: "$40",
    genericKeyword: "62%",
    competitorKeyword: "10%",
    competitorProduct: "20%",
    auto: "8%",
  },
  "pilgrims-organic": {
    goalValue: "$38",
    genericKeyword: "58%",
    competitorKeyword: "12%",
    competitorProduct: "18%",
    auto: "12%",
  },
  "harvest-gold": {
    goalValue: "$32",
    genericKeyword: "48%",
    clientBrandedKeyword: "22%",
    competitorKeyword: "18%",
    competitorProduct: "8%",
    auto: "4%",
    campaignSp: "55%",
    campaignSb: "25%",
    campaignSd: "20%",
  },
  "natures-best": {
    goalValue: "$24",
    genericKeyword: "52%",
    clientBrandedKeyword: "18%",
    competitorKeyword: "20%",
    competitorProduct: "10%",
    campaignSp: "60%",
    campaignSb: "20%",
    campaignSd: "20%",
  },
  "coastal-select": {
    goalValue: "$27",
    genericKeyword: "45%",
    clientBrandedKeyword: "25%",
    competitorKeyword: "20%",
    competitorProduct: "10%",
    campaignSp: "50%",
    campaignSb: "30%",
    campaignSd: "20%",
  },
  "premium-pet": {
    goalValue: "$19",
    genericKeyword: "40%",
    clientBrandedKeyword: "30%",
    competitorKeyword: "20%",
    competitorProduct: "10%",
    campaignSp: "55%",
    campaignSb: "15%",
    campaignSd: "30%",
  },
  "sunrise-dairy": {
    goalValue: "$36",
    genericKeyword: "60%",
    clientBrandedKeyword: "15%",
    competitorKeyword: "15%",
    competitorProduct: "5%",
    auto: "5%",
    campaignSp: "48%",
    campaignSb: "32%",
    campaignSd: "20%",
  },
  "valley-organics": {
    goalValue: "$21",
    genericKeyword: "50%",
    clientBrandedKeyword: "20%",
    competitorKeyword: "18%",
    competitorProduct: "12%",
    campaignSp: "42%",
    campaignSb: "28%",
    campaignSd: "30%",
  },
};

/**
 * Same brands as Goals — characterization (taxonomy) comes from GOALS_SCOPE_ROWS
 * so Level 1 / Level 2 columns match across the wizard.
 */
export const CONSTRAINTS_SCOPE_ROWS: ConstraintRow[] = GOALS_SCOPE_ROWS.map(
  (row) => ({
    id: row.id,
    name: row.name,
    indent: row.id !== ENTIRE_BUSINESS_SCOPE_ID,
    taxonomy: row.taxonomy,
    last30Days: CONSTRAINT_LAST30_BY_ID[row.id],
  }),
);

type OptimizerRowMeta = {
  goal?: string;
  value?: string;
  allyMode?: boolean;
};

/** Prototype Ally / value overlays for Optimizer — keyed by Goals brand id. */
const OPTIMIZER_META_BY_ID: Record<string, OptimizerRowMeta> = {
  "jbc-fresh": { goal: "Brands tROAS", value: "$25", allyMode: true },
  "jbc-frozen": { goal: "Brands tROAS", value: "$7", allyMode: true },
  "jbc-deli": { goal: "Brands tROAS", value: "$12", allyMode: true },
  "ocean-adventures": { goal: "Brands tROAS", value: "$14", allyMode: true },
  "ocean-premium": { goal: "Brands tROAS", value: "$10", allyMode: true },
  pilgrims: { goal: "Brands tROAS", value: "$2", allyMode: true },
  "pilgrims-organic": { goal: "Brands tROAS", value: "$4", allyMode: true },
  "harvest-gold": { goal: "Brands tROAS", value: "$18", allyMode: true },
  "natures-best": { goal: "Brands tROAS", value: "$9", allyMode: true },
  "coastal-select": { goal: "Brands tROAS", value: "$11", allyMode: true },
  "premium-pet": { goal: "Brands tROAS", value: "$6", allyMode: true },
  "sunrise-dairy": { goal: "Brands tROAS", value: "$30", allyMode: true },
  "valley-organics": { goal: "Brands tROAS", value: "$5", allyMode: true },
};

export type OptimizerScopeRow = {
  id: string;
  name: string;
  indent?: boolean;
  expandable?: boolean;
  taxonomy?: ScopeTaxonomy;
  goal?: string;
  value?: string;
  allyMode?: boolean;
};

/**
 * Same brand list + taxonomy as Goals.
 * Every leaf brand gets Optimizer controls (Ally by default) so no row is blank.
 */
export const OPTIMIZER_SCOPE_ROWS: OptimizerScopeRow[] = GOALS_SCOPE_ROWS.map(
  (row) => {
    const isLeaf = row.id !== ENTIRE_BUSINESS_SCOPE_ID;
    const meta = OPTIMIZER_META_BY_ID[row.id];

    return {
      id: row.id,
      name: row.name,
      indent: isLeaf,
      expandable: row.expandable,
      taxonomy: row.taxonomy,
      goal: meta?.goal ?? (isLeaf ? "Brands tROAS" : undefined),
      value: meta?.value ?? (isLeaf ? `$${row.goalValue}` : undefined),
      // Parent rollup has no per-column mode controls; every brand does.
      allyMode: isLeaf ? (meta?.allyMode ?? true) : undefined,
    };
  },
);
