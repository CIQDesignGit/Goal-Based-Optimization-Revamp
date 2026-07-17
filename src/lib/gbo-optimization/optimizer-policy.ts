import type {
  GoalType,
  OptimizerType,
} from "@/lib/gbo-optimization/setup-data";

/** Per-column mode used by Budget Optimization and Bid Optimization. */
export type OptimizerColumnMode = "ally" | "rule-based" | "none";

export type RowOptimizerModes = {
  budget: OptimizerColumnMode | null;
  bid: OptimizerColumnMode | null;
};

export type OptimizerCapabilities = {
  allowedColumnModes: OptimizerColumnMode[];
  budgetsEnabled: boolean;
  campaignConstraintsEnabled: boolean;
  seasonalityEnabled: boolean;
  spendConstraintsEnabled: boolean;
};

const OPTIMIZER_CAPABILITIES: Record<OptimizerType, OptimizerCapabilities> = {
  "ally-ai": {
    allowedColumnModes: ["ally", "none"],
    budgetsEnabled: true,
    campaignConstraintsEnabled: false,
    seasonalityEnabled: true,
    spendConstraintsEnabled: true,
  },
  "rule-based": {
    allowedColumnModes: ["rule-based", "none"],
    budgetsEnabled: false,
    campaignConstraintsEnabled: false,
    seasonalityEnabled: false,
    spendConstraintsEnabled: false,
  },
  custom: {
    allowedColumnModes: ["ally", "rule-based", "none"],
    budgetsEnabled: true,
    campaignConstraintsEnabled: true,
    seasonalityEnabled: true,
    spendConstraintsEnabled: true,
  },
};

export function getOptimizerCapabilities(
  optimizerType: OptimizerType,
): OptimizerCapabilities {
  return OPTIMIZER_CAPABILITIES[optimizerType];
}

export function getAllowedOptimizerColumnModes(
  optimizerType: OptimizerType,
): OptimizerColumnMode[] {
  return getOptimizerCapabilities(optimizerType).allowedColumnModes;
}

export function isOptimizerColumnModeAllowed(
  optimizerType: OptimizerType,
  mode: OptimizerColumnMode,
): boolean {
  return getAllowedOptimizerColumnModes(optimizerType).includes(mode);
}

/**
 * Invalid values become None instead of silently selecting another optimizer.
 * Custom accepts every value and therefore keeps the row unchanged.
 */
export function sanitizeRowModesForOptimizer(
  modes: RowOptimizerModes,
  optimizerType: OptimizerType,
): RowOptimizerModes {
  const sanitize = (
    mode: OptimizerColumnMode | null,
  ): OptimizerColumnMode | null => {
    if (optimizerType === "custom") return mode;
    if (mode && isOptimizerColumnModeAllowed(optimizerType, mode)) return mode;
    return "none";
  };

  return {
    budget: sanitize(modes.budget),
    bid: sanitize(modes.bid),
  };
}

export function getDefaultRowModesForOptimizer(
  optimizerType: OptimizerType,
): RowOptimizerModes {
  if (optimizerType === "custom") {
    return { budget: null, bid: null };
  }

  if (optimizerType === "rule-based") {
    return { budget: "rule-based", bid: "rule-based" };
  }

  return { budget: "ally", bid: "ally" };
}

/** SOV is cleared when Ally AI becomes the portfolio policy. */
export function getCompatibleGoalForOptimizer(
  goal: GoalType | null,
  optimizerType: OptimizerType,
): GoalType | null {
  return optimizerType === "ally-ai" && goal === "sov" ? null : goal;
}
