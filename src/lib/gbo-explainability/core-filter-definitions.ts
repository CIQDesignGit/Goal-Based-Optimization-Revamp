import type { AccountOptimizerConfig } from "./types";
import {
  buildActionLogRetailerFilterDefinitions,
  RETAILER_FILTER_SECTION_LABEL,
  type RetailerFilterKey,
} from "./retailer-filter-definitions";
import type {
  ActionStatus,
  ActionType,
  ChangeStatus,
  FailureReasonCategory,
  FilterState,
} from "./types";

/** FR-005 filter keys exposed in the Filters popover. */
export type CoreFilterKey =
  | "dateRange"
  | "budgetLevel"
  | "entityScope"
  | "actionStatus"
  | "changeStatus"
  | "setupStep"
  | "highDeviationOnly"
  | "user"
  | "actionType"
  | "failureCategory"
  | "outOfBudgetOnly"
  | "optimizerType"
  | "entityType"
  | "campaignType"
  | "matchType"
  | "source"
  | "objective"
  | "strategy";

export type CoreFilterOption = {
  value: string;
  label: string;
};

export type CoreFilterDefinition = {
  key: CoreFilterKey;
  label: string;
  options?: CoreFilterOption[];
  /** Renders a free-text panel instead of option buttons. */
  panel?: "text";
};

export type FilterDefinitionSection = {
  id: string;
  label: string;
  definitions: CoreFilterDefinition[];
};

export const CORE_FILTER_SECTION_LABEL = "Filters";

const ACTION_STATUS_OPTIONS: CoreFilterOption[] = [
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
];

const CHANGE_STATUS_OPTIONS: CoreFilterOption[] = [
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
];

const ACTION_TYPE_OPTIONS: CoreFilterOption[] = [
  { value: "bid-change", label: "Bid change" },
  { value: "budget-change", label: "Budget change" },
  { value: "day-parting-change", label: "Day-parting change" },
  { value: "status-change", label: "Status change" },
  { value: "setup-change", label: "Setup change" },
  { value: "out-of-budget", label: "Out of budget" },
  { value: "api-failure", label: "API failure" },
];

const FAILURE_CATEGORY_OPTIONS: CoreFilterOption[] = [
  { value: "business-rule", label: "Business rule" },
  { value: "transient", label: "Rate limiting" },
  { value: "retailer-api", label: "Retailer-side" },
  { value: "logic", label: "Logic error" },
  { value: "validation", label: "Validation" },
];

const FLAGGED_ONLY_OPTIONS: CoreFilterOption[] = [
  { value: "true", label: "Flagged only" },
];

const BUDGET_LEVEL_OPTIONS: CoreFilterOption[] = [
  { value: "Portfolio", label: "Portfolio" },
  { value: "Brand", label: "Brand / Profile" },
  { value: "Campaign", label: "Campaign" },
  { value: "Ad Group", label: "Line-item group" },
  { value: "Keyword", label: "Keyword" },
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

const CORE_ACTION_LOG_DEFINITIONS: CoreFilterDefinition[] = [
  { key: "dateRange", label: "Date / time" },
  { key: "budgetLevel", label: "Budget level", options: BUDGET_LEVEL_OPTIONS },
  { key: "entityScope", label: "Entity / scope", panel: "text" },
  {
    key: "actionStatus",
    label: "Action status",
    options: ACTION_STATUS_OPTIONS,
  },
  {
    key: "changeStatus",
    label: "Change status",
    options: CHANGE_STATUS_OPTIONS,
  },
  { key: "setupStep", label: "Step", options: SETUP_STEP_OPTIONS },
  {
    key: "highDeviationOnly",
    label: "High deviation",
    options: FLAGGED_ONLY_OPTIONS,
  },
  { key: "user", label: "Type", options: WHO_MADE_CHANGE_OPTIONS },
  { key: "actionType", label: "Action", options: ACTION_TYPE_OPTIONS },
  {
    key: "failureCategory",
    label: "Failure reason",
    options: FAILURE_CATEGORY_OPTIONS,
  },
  {
    key: "outOfBudgetOnly",
    label: "Out of budget",
    options: FLAGGED_ONLY_OPTIONS,
  },
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
    { key: "user", label: "User", options: WHO_MADE_CHANGE_OPTIONS },
  ];
}

export function buildAlertsFilterDefinitions(): CoreFilterDefinition[] {
  return CORE_ACTION_LOG_DEFINITIONS.filter(
    (definition) =>
      definition.key !== "budgetLevel" && definition.key !== "entityScope",
  );
}

export function buildActionLogFilterSections(
  config: AccountOptimizerConfig,
): FilterDefinitionSection[] {
  const retailerDefinitions: CoreFilterDefinition[] =
    buildActionLogRetailerFilterDefinitions(config).map((definition) => ({
      key: definition.key as CoreFilterKey,
      label: definition.label,
      options: definition.options,
    }));

  return [
    {
      id: "core",
      label: CORE_FILTER_SECTION_LABEL,
      definitions: CORE_ACTION_LOG_DEFINITIONS,
    },
    {
      id: "retailer",
      label: RETAILER_FILTER_SECTION_LABEL,
      definitions: retailerDefinitions,
    },
  ];
}

export function flattenFilterSections(
  sections: FilterDefinitionSection[],
): CoreFilterDefinition[] {
  return sections.flatMap((section) => section.definitions);
}

export type CoreFilterDraft = Pick<
  FilterState,
  | "dateFrom"
  | "dateTo"
  | "budgetLevel"
  | "entityScope"
  | "actionStatus"
  | "changeStatus"
  | "setupStep"
  | "highDeviationOnly"
  | "user"
  | "actionType"
  | "failureCategory"
  | "outOfBudgetOnly"
  | "entityType"
  | "campaignType"
  | "matchType"
  | "source"
  | "objective"
  | "strategy"
>;

export function pickCoreFilterDraft(filters: FilterState): CoreFilterDraft {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    budgetLevel: filters.budgetLevel,
    entityScope: filters.entityScope,
    actionStatus: filters.actionStatus,
    changeStatus: filters.changeStatus,
    setupStep: filters.setupStep,
    highDeviationOnly: filters.highDeviationOnly,
    user: filters.user,
    actionType: filters.actionType,
    failureCategory: filters.failureCategory,
    outOfBudgetOnly: filters.outOfBudgetOnly,
    entityType: filters.entityType,
    campaignType: filters.campaignType,
    matchType: filters.matchType,
    source: filters.source,
    objective: filters.objective,
    strategy: filters.strategy,
  };
}

export function coreDraftValueForKey(
  draft: CoreFilterDraft,
  key: CoreFilterKey,
): string {
  switch (key) {
    case "dateRange":
      return draft.dateFrom && draft.dateTo
        ? `${draft.dateFrom}:${draft.dateTo}`
        : "";
    case "optimizerType":
      return draft.strategy;
    case "entityScope":
      return draft.entityScope;
    case "outOfBudgetOnly":
      return draft.outOfBudgetOnly ? "true" : "all";
    case "highDeviationOnly":
      return draft.highDeviationOnly ? "true" : "all";
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
    case "entityScope":
      return { ...draft, entityScope: value };
    case "actionType":
      return { ...draft, actionType: value as ActionType | "all" };
    case "actionStatus":
      return { ...draft, actionStatus: value as ActionStatus | "all" };
    case "changeStatus":
      return { ...draft, changeStatus: value as ChangeStatus | "all" };
    case "failureCategory":
      return {
        ...draft,
        failureCategory: value as FailureReasonCategory | "all",
      };
    case "outOfBudgetOnly":
      return { ...draft, outOfBudgetOnly: value === "true" };
    case "highDeviationOnly":
      return { ...draft, highDeviationOnly: value === "true" };
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
  defaultDateRange?: { dateFrom: string; dateTo: string },
): number {
  let count = 0;

  const hasDate = filters.dateFrom !== "" && filters.dateTo !== "";
  const isDefaultDate =
    defaultDateRange !== undefined &&
    filters.dateFrom === defaultDateRange.dateFrom &&
    filters.dateTo === defaultDateRange.dateTo;

  if (hasDate && !isDefaultDate) {
    count += 1;
  }

  if (view === "alerts") {
    if (filters.actionStatus !== "all") count += 1;
    if (filters.changeStatus !== "all") count += 1;
    if (filters.setupStep !== "all") count += 1;
    if (filters.highDeviationOnly) count += 1;
    if (filters.user !== "all") count += 1;
    if (filters.actionType !== "all") count += 1;
    if (filters.failureCategory !== "all") count += 1;
    if (filters.outOfBudgetOnly) count += 1;
  }

  if (view === "action-log") {
    if (filters.budgetLevel !== "all") count += 1;
    if (filters.entityScope.trim() !== "") count += 1;
    if (filters.actionStatus !== "all") count += 1;
    if (filters.changeStatus !== "all") count += 1;
    if (filters.setupStep !== "all") count += 1;
    if (filters.highDeviationOnly) count += 1;
    if (filters.user !== "all") count += 1;
    if (filters.actionType !== "all") count += 1;
    if (filters.failureCategory !== "all") count += 1;
    if (filters.outOfBudgetOnly) count += 1;
    if (filters.entityType !== "all") count += 1;
    if (filters.campaignType !== "all") count += 1;
    if (filters.matchType !== "all") count += 1;
    if (filters.source !== "all") count += 1;
    if (filters.objective !== "all") count += 1;
    if (filters.strategy !== "all") count += 1;
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

export function actionStatusLabel(value: string): string {
  return (
    ACTION_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1)
  );
}

export function changeStatusLabel(value: string): string {
  return (
    CHANGE_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1)
  );
}

export function failureCategoryLabel(value: string): string {
  return (
    FAILURE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/-/g, " ")
  );
}

export function budgetLevelLabel(value: string): string {
  return (
    BUDGET_LEVEL_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function retailerFilterChipLabel(
  key: RetailerFilterKey,
  value: string,
  config: AccountOptimizerConfig,
): string {
  const definition = buildActionLogRetailerFilterDefinitions(config).find(
    (item) => item.key === key,
  );
  return (
    definition?.options.find((option) => option.value === value)?.label ?? value
  );
}
