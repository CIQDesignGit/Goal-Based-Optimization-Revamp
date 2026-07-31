import type { ActionType, FilterState } from "./types";

/** FR-005 filter keys exposed in the Filters popover. */
export type CoreFilterKey =
  | "dateRange"
  | "actionType"
  | "optimizerType"
  | "setupStep"
  | "user";

export type CoreFilterOption = {
  value: string;
  label: string;
};

export type CoreFilterDefinition = {
  key: CoreFilterKey;
  label: string;
  options?: CoreFilterOption[];
};

export const CORE_FILTER_SECTION_LABEL = "Filters";

const ACTION_TYPE_OPTIONS: CoreFilterOption[] = [
  { value: "bid-change", label: "Bid change" },
  { value: "budget-change", label: "Budget change" },
  { value: "day-parting-change", label: "Day-parting change" },
  { value: "status-change", label: "Status change" },
  { value: "setup-change", label: "Setup change" },
  { value: "out-of-budget", label: "Out of budget" },
  { value: "api-failure", label: "API failure" },
];

/** FR-005 optimizer type — maps to FilterState.strategy via inferStrategy(). */
const OPTIMIZER_TYPE_OPTIONS: CoreFilterOption[] = [
  { value: "ally-ai", label: "Ally AI" },
  { value: "custom", label: "Custom" },
  { value: "rule-based", label: "Rule Based" },
];

const SETUP_STEP_OPTIONS: CoreFilterOption[] = [
  { value: "General", label: "General" },
  { value: "Goals & Budgets", label: "Goals & Budgets" },
  { value: "Seasonality", label: "Seasonality" },
  { value: "Constraints", label: "Constraints" },
  { value: "Optimizer", label: "Optimizer" },
  { value: "Summary", label: "Summary" },
];

/** Automation actors — prefixed so they don't collide with person emails. */
const AUTOMATION_ACTOR_OPTIONS: CoreFilterOption[] = [
  { value: "actor:ally-ai", label: "Ally AI" },
  { value: "actor:rule-based", label: "Rule Based" },
  { value: "actor:day-parting", label: "Day Parting" },
];

const PERSON_OPTIONS: CoreFilterOption[] = [
  { value: "emily.c@commerceiq.ai", label: "Emily C." },
  { value: "marcus.w@commerceiq.ai", label: "Marcus W." },
  { value: "priyal.j@commerceiq.ai", label: "Priyal J." },
  { value: "jordan.l@commerceiq.ai", label: "Jordan L." },
  { value: "sam.c@example.com", label: "Sam C. (deactivated)" },
];

const WHO_MADE_CHANGE_OPTIONS: CoreFilterOption[] = [
  ...AUTOMATION_ACTOR_OPTIONS,
  ...PERSON_OPTIONS,
];

export function buildCoreFilterDefinitions(): CoreFilterDefinition[] {
  return [
    { key: "dateRange", label: "Date / time" },
    { key: "actionType", label: "Action", options: ACTION_TYPE_OPTIONS },
    {
      key: "optimizerType",
      label: "Optimizer type",
      options: OPTIMIZER_TYPE_OPTIONS,
    },
    { key: "setupStep", label: "Step", options: SETUP_STEP_OPTIONS },
    { key: "user", label: "Who made the change", options: WHO_MADE_CHANGE_OPTIONS },
  ];
}

export function buildAlertsFilterDefinitions(): CoreFilterDefinition[] {
  return [{ key: "dateRange", label: "Date / time" }];
}

export type CoreFilterDraft = Pick<
  FilterState,
  "dateFrom" | "dateTo" | "actionType" | "strategy" | "setupStep" | "user"
>;

export function pickCoreFilterDraft(filters: FilterState): CoreFilterDraft {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    actionType: filters.actionType,
    strategy: filters.strategy,
    setupStep: filters.setupStep,
    user: filters.user,
  };
}

export function coreDraftValueForKey(
  draft: CoreFilterDraft,
  key: CoreFilterKey,
): string {
  switch (key) {
    case "dateRange":
      return draft.dateFrom && draft.dateTo ? `${draft.dateFrom}:${draft.dateTo}` : "";
    case "optimizerType":
      return draft.strategy;
    default:
      return draft[key];
  }
}

export function patchCoreDraftForKey(
  draft: CoreFilterDraft,
  key: CoreFilterKey,
  value: string,
): CoreFilterDraft {
  switch (key) {
    case "dateRange": {
      const [dateFrom = "", dateTo = ""] = value.split(":");
      return { ...draft, dateFrom, dateTo };
    }
    case "optimizerType":
      return { ...draft, strategy: value };
    case "actionType":
      return { ...draft, actionType: value as ActionType | "all" };
    default:
      return { ...draft, [key]: value };
  }
}

export function personLabel(value: string): string {
  const automation = AUTOMATION_ACTOR_OPTIONS.find(
    (option) => option.value === value,
  );
  if (automation) return automation.label;

  return (
    PERSON_OPTIONS.find((option) => option.value === value)?.label ?? value
  );
}

/** True when the value selects an automation actor (Ally AI, Rule Based, Day Parting). */
export function isAutomationActorFilter(value: string): boolean {
  return value.startsWith("actor:");
}

export function countActiveCoreFilters(
  filters: FilterState,
  view: "alerts" | "action-log",
  defaultAlertsRange?: { dateFrom: string; dateTo: string },
): number {
  let count = 0;

  const hasDate = filters.dateFrom !== "" && filters.dateTo !== "";
  const isDefaultAlertsDate =
    view === "alerts" &&
    defaultAlertsRange !== undefined &&
    filters.dateFrom === defaultAlertsRange.dateFrom &&
    filters.dateTo === defaultAlertsRange.dateTo;

  if (hasDate && !isDefaultAlertsDate) {
    count += 1;
  }

  if (view === "action-log") {
    if (filters.actionType !== "all") count += 1;
    if (filters.strategy !== "all") count += 1;
    if (filters.setupStep !== "all") count += 1;
    if (filters.user !== "all") count += 1;
  }

  return count;
}

export function optimizerTypeLabel(value: string): string {
  return (
    OPTIMIZER_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function actionTypeLabel(value: string): string {
  return (
    ACTION_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/-/g, " ")
  );
}
