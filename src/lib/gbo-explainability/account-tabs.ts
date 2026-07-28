import type { AccountOptimizerConfig, ActionTab } from "./types";

/** Which page tabs to show based on account optimizer config (FR-002). */
export function getAvailableTabs(
  config: AccountOptimizerConfig,
): ActionTab[] {
  // Setup always present when GBO is live; Automation when any optimizer exists
  const tabs: ActionTab[] = [];
  if (config.hasAllyAi || config.hasRuleBased) {
    tabs.push("automation");
  }
  tabs.push("setup");
  return tabs;
}

export function getDefaultTab(config: AccountOptimizerConfig): ActionTab {
  const tabs = getAvailableTabs(config);
  return tabs.includes("automation") ? "automation" : "setup";
}

export function describeAutomationFilterOptions(
  config: AccountOptimizerConfig,
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  if (config.hasAllyAi) {
    options.push({ value: "ally-ai", label: "Ally AI" });
  }
  if (config.hasRuleBased) {
    options.push({ value: "rule-based", label: "Rule Based" });
  }
  options.push({ value: "day-parting", label: "Day-parting" });
  options.push({ value: "custom", label: "Custom" });
  options.push({ value: "out-of-budget", label: "Out of budget" });
  return options;
}
