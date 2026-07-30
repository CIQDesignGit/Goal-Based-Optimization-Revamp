import type { AccountOptimizerConfig } from "./types";
import { describeActorRoleFilterOptions } from "./account-tabs";

export type RetailerFilterKey =
  | "entityType"
  | "campaignType"
  | "matchType"
  | "source"
  | "status"
  | "action"
  | "objective"
  | "strategy";

export type RetailerFilterOption = {
  value: string;
  label: string;
};

export type RetailerFilterDefinition = {
  key: RetailerFilterKey;
  label: string;
  options: RetailerFilterOption[];
};

const ENTITY_TYPE_OPTIONS: RetailerFilterOption[] = [
  { value: "Campaign", label: "Campaign" },
  { value: "Keyword", label: "Keyword" },
  { value: "Brand", label: "Brand" },
  { value: "Portfolio", label: "Portfolio" },
  { value: "Ad Group", label: "Ad Group" },
];

const CAMPAIGN_TYPE_OPTIONS: RetailerFilterOption[] = [
  { value: "Sponsored Products", label: "Sponsored Products" },
  { value: "Sponsored Brands", label: "Sponsored Brands" },
  { value: "Sponsored Display", label: "Sponsored Display" },
];

const MATCH_TYPE_OPTIONS: RetailerFilterOption[] = [
  { value: "exact", label: "Exact" },
  { value: "phrase", label: "Phrase" },
  { value: "broad", label: "Broad" },
];

const STATUS_OPTIONS: RetailerFilterOption[] = [
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
  { value: "partial", label: "Partial" },
];

const ACTION_OPTIONS: RetailerFilterOption[] = [
  { value: "bid-change", label: "Bid change" },
  { value: "budget-change", label: "Budget change" },
  { value: "day-parting-change", label: "Day-parting change" },
  { value: "status-change", label: "Status change" },
  { value: "setup-change", label: "Setup change" },
  { value: "out-of-budget", label: "Out of budget" },
  { value: "api-failure", label: "API failure" },
];

const OBJECTIVE_OPTIONS: RetailerFilterOption[] = [
  { value: "roas", label: "ROAS" },
  { value: "sov", label: "Share of voice" },
  { value: "sales", label: "Sales" },
  { value: "awareness", label: "Awareness" },
];

const STRATEGY_OPTIONS: RetailerFilterOption[] = [
  { value: "ally-ai", label: "Ally AI" },
  { value: "rule-based", label: "Rule Based" },
  { value: "custom", label: "Custom" },
  { value: "day-parting", label: "Day Parting" },
];

export function buildRetailerFilterDefinitions(
  config: AccountOptimizerConfig,
): RetailerFilterDefinition[] {
  const sourceOptions: RetailerFilterOption[] = [
    { value: "Goal Based Optimizer", label: "Goal Based Optimizer" },
    ...describeActorRoleFilterOptions(config).map((option) => ({
      value: option.label,
      label: option.label,
    })),
    { value: "Day Parting", label: "Day Parting" },
  ];

  return [
    {
      key: "entityType",
      label: "Entity Type",
      options: ENTITY_TYPE_OPTIONS,
    },
    {
      key: "campaignType",
      label: "Campaign Type",
      options: CAMPAIGN_TYPE_OPTIONS,
    },
    {
      key: "matchType",
      label: "Match Type",
      options: MATCH_TYPE_OPTIONS,
    },
    {
      key: "source",
      label: "Source",
      options: sourceOptions,
    },
    {
      key: "status",
      label: "Status",
      options: STATUS_OPTIONS,
    },
    {
      key: "action",
      label: "Action",
      options: ACTION_OPTIONS,
    },
    {
      key: "objective",
      label: "Objective",
      options: OBJECTIVE_OPTIONS,
    },
    {
      key: "strategy",
      label: "Strategy",
      options: STRATEGY_OPTIONS,
    },
  ];
}

export const RETAILER_FILTER_SECTION_LABEL = "Retailer Categorization";
