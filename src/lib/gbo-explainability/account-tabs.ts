import type { AccountOptimizerConfig, AlertRole } from "./types";
import { alertRoleLabel, ALERT_ROLE_ORDER } from "./aggregate-alerts";

/** Which alert role types to show based on account optimizer config. */
export function getAvailableAlertRoles(
  config: AccountOptimizerConfig,
): AlertRole[] {
  return ALERT_ROLE_ORDER.filter((role) => {
    if (role === "ally-ai") return config.hasAllyAi;
    if (role === "rule-based") return config.hasRuleBased;
    return true;
  });
}

export function describeActorRoleFilterOptions(
  config: AccountOptimizerConfig,
): { value: AlertRole; label: string }[] {
  return getAvailableAlertRoles(config).map((role) => ({
    value: role,
    label: alertRoleLabel(role),
  }));
}
