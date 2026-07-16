"use client";

import { useEffect } from "react";

import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { ImpactBanner } from "@/components/gbo-optimization/impact-banner";
import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AGGRESSIVENESS_OPTIONS,
  BUDGET_GRANULARITIES,
  getGoalChangeImpactMessage,
  getDefaultLevelsForBudgetType,
  getLevel2Options,
  getLevelOptions,
  GOAL_TYPE_OPTIONS,
  GOALS_GOAL_EDITABLE_ROWS,
  isSovGoal,
  OPTIMIZER_OPTIONS,
  RULE_BASED_OPTIMIZER_NOTICE,
  type GoalType,
  type OptimizerType,
} from "@/lib/gbo-optimization/setup-data";
import {
  hasTaxonomyChanged,
  recordGeneralAggressivenessChange,
  recordGeneralGoalTypeChange,
  recordGeneralGranularityChange,
  recordGeneralOptimizerTypeChange,
  useSetupSessionStore,
  type BudgetDefinitionType,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const SETUP_SELECT_TRIGGER_CLASS =
  "w-full border-slate-200 bg-white text-slate-700 shadow-none";

const GOAL_TYPE_SELECT_OPTIONS = GOAL_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const BUDGET_TYPE_OPTIONS: {
  value: BudgetDefinitionType;
  title: string;
  description: string;
}[] = [
  {
    value: "retailer",
    title: "Retailer Categorization",
    description:
      "Select this to use the advertising structure pre-defined within the retailer",
  },
  {
    value: "internal",
    title: "Internal Categorization",
    description:
      "Select this to use a custom advertising structure defined by you in Campaign Taxonomy",
  },
];

function RadioIndicator({
  selected,
  compact = false,
}: {
  selected: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2",
        compact ? "size-3.5" : "mt-0.5 size-4",
        selected ? "border-brand-600" : "border-slate-300",
      )}
      aria-hidden
    >
      {selected ? (
        <span
          className={cn(
            "rounded-full bg-brand-600",
            compact ? "size-1.5" : "size-2",
          )}
        />
      ) : null}
    </span>
  );
}

const ALLY_AI_SOV_DISABLED_MESSAGE =
  "Ally AI is disabled for the SoV goal.";

export function GeneralStep() {
  const { optimizerType, setOptimizerType } = useSetupContext();
  const generalConfig = useSetupSessionStore((state) => state.generalConfig);
  const taxonomyBaseline = useSetupSessionStore(
    (state) => state.taxonomyBaseline,
  );
  const goalsRowState = useSetupSessionStore((state) => state.goalsRowState);
  const setGoalType = useSetupSessionStore((state) => state.setGoalType);
  const setAggressiveness = useSetupSessionStore(
    (state) => state.setAggressiveness,
  );
  const updateGeneralConfig = useSetupSessionStore(
    (state) => state.updateGeneralConfig,
  );
  const dismissGoalChangeImpact = useSetupSessionStore(
    (state) => state.dismissGoalChangeImpact,
  );
  const dismissTaxonomyChangeImpact = useSetupSessionStore(
    (state) => state.dismissTaxonomyChangeImpact,
  );

  const isSovSelected =
    isSovGoal(generalConfig.goalType) ||
    GOALS_GOAL_EDITABLE_ROWS.some(
      (row) => goalsRowState[row.id]?.goalMetric === "sov",
    );
  const showAggressiveness =
    optimizerType === "rule-based" || optimizerType === "custom";
  const selectedGoalOption = GOAL_TYPE_OPTIONS.find(
    (option) => option.value === generalConfig.goalType,
  );

  const level1Options = getLevelOptions(generalConfig.budgetType);
  const level2Options = getLevel2Options(
    generalConfig.budgetType,
    generalConfig.level1,
  );
  const taxonomyChanged = hasTaxonomyChanged(taxonomyBaseline, generalConfig);
  const showTaxonomyChangeImpact =
    generalConfig.showTaxonomyChangeImpact && taxonomyChanged;

  // SOV cannot use Ally AI — switch away if it was selected (FR-004).
  useEffect(() => {
    if (isSovSelected && optimizerType === "ally-ai") {
      setOptimizerType("rule-based");
    }
  }, [isSovSelected, optimizerType, setOptimizerType]);

  const showGoalChangeImpact =
    generalConfig.showGoalChangeImpact && generalConfig.goalType;
  const showGoalGuidance = isSovSelected || showGoalChangeImpact;

  const handleGoalTypeChange = (goalType: GoalType) => {
    const previous = generalConfig.goalType;
    setGoalType(goalType);
    recordGeneralGoalTypeChange(previous, goalType);

    if (isSovGoal(goalType) && optimizerType === "ally-ai") {
      recordGeneralOptimizerTypeChange(optimizerType, "rule-based");
      setOptimizerType("rule-based");
    }
  };

  const handleOptimizerChange = (value: OptimizerType) => {
    if (isSovSelected && value === "ally-ai") {
      return;
    }

    if (value === optimizerType) {
      return;
    }

    recordGeneralOptimizerTypeChange(optimizerType, value);
    setOptimizerType(value);
  };

  const handleBudgetTypeChange = (budgetType: BudgetDefinitionType) => {
    if (budgetType === generalConfig.budgetType) {
      return;
    }

    const defaults = getDefaultLevelsForBudgetType(budgetType);
    updateGeneralConfig({
      budgetType,
      level1: defaults.level1,
      level2: defaults.level2,
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-8">
      {/* Budget granularity */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-5">
          <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900">
                How do you want to plan your budget?{" "}
                <span className="text-slate-900">*</span>
              </h2>
              <p className="text-sm text-slate-500">Budget granularity</p>
            </div>

            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Budget granularity"
            >
              {BUDGET_GRANULARITIES.map((option) => {
                const isSelected = generalConfig.granularity === option;

                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      if (option === generalConfig.granularity) return;
                      recordGeneralGranularityChange(
                        generalConfig.granularity,
                        option,
                      );
                      updateGeneralConfig({ granularity: option });
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      isSelected
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    )}
                  >
                    <RadioIndicator selected={isSelected} compact />
                    <span
                      className={cn(
                        "text-sm",
                        isSelected
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-700",
                      )}
                    >
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

      {/* Budget definition */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">
              How do you want to define your budget?
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Note: You can change how your budget is spread out anytime you need.
              Just remember, when you make changes, your new budget setup will
              start the next day.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_TYPE_OPTIONS.map((option) => {
              const isSelected = generalConfig.budgetType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleBudgetTypeChange(option.value)}
                  className={cn(
                    "flex gap-3 rounded-lg border p-4 text-left transition-colors",
                    isSelected
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <RadioIndicator selected={isSelected} />
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {option.title}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-md bg-slate-100 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SetupInlineSelect
                label="Level 1"
                value={generalConfig.level1}
                options={level1Options}
                placeholder="Select level 1"
                onValueChange={(value) =>
                  updateGeneralConfig({ level1: value })
                }
                triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
              />

              <SetupInlineSelect
                label="Level 2"
                value={generalConfig.level2}
                options={level2Options}
                placeholder="Select level 2"
                onValueChange={(value) =>
                  updateGeneralConfig({ level2: value })
                }
                triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
              />
            </div>
          </div>

          {showTaxonomyChangeImpact ? (
            <ImpactBanner
              title="Budget organization change"
              onDismiss={dismissTaxonomyChangeImpact}
            >
              Changing how you define your budget reorganizes Scope and how
              budget is planned. Values under the old structure will not line up
              one-to-one. You will confirm previous vs new organization on
              Summary. The new setup starts the next day.
            </ImpactBanner>
          ) : null}
        </CardContent>
      </Card>

      {/* Goal type (FR-001) */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              What is your optimization goal?
            </h2>
            <p className="text-sm text-slate-500">
              Optional portfolio-wide goal before budgets, constraints, and
              seasonality.
            </p>
          </div>

          <div className="space-y-2">
            <SetupInlineSelect
              label="Goal type"
              value={generalConfig.goalType}
              options={GOAL_TYPE_SELECT_OPTIONS}
              placeholder="Select a goal type"
              onValueChange={(value) =>
                handleGoalTypeChange(value as GoalType)
              }
              onClear={() => {
                recordGeneralGoalTypeChange(generalConfig.goalType, null);
                setGoalType(null);
              }}
              triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
            />
            {selectedGoalOption ? (
              <p className="text-sm leading-relaxed text-slate-500">
                {selectedGoalOption.description}
              </p>
            ) : null}
          </div>

          {showGoalGuidance ? (
            <ImpactBanner
              title={
                isSovSelected && showGoalChangeImpact
                  ? undefined
                  : isSovSelected
                    ? "SOV is not supported with Ally AI"
                    : "Goal change impact"
              }
              onDismiss={
                showGoalChangeImpact ? dismissGoalChangeImpact : undefined
              }
            >
              {isSovSelected && showGoalChangeImpact ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="font-medium text-amber-900">
                      SOV is not supported with Ally AI
                    </p>
                    <p>
                      Share of Voice goals work with rule-based optimization
                      only. {ALLY_AI_SOV_DISABLED_MESSAGE}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-amber-900">
                      Goal change impact
                    </p>
                    <p>
                      {getGoalChangeImpactMessage(
                        optimizerType,
                        generalConfig.goalType!,
                      )}
                    </p>
                  </div>
                </div>
              ) : isSovSelected ? (
                <p>
                  Share of Voice goals work with rule-based optimization only.{" "}
                  {ALLY_AI_SOV_DISABLED_MESSAGE}
                </p>
              ) : (
                getGoalChangeImpactMessage(
                  optimizerType,
                  generalConfig.goalType!,
                )
              )}
            </ImpactBanner>
          ) : null}

        </CardContent>
      </Card>

      {/* Optimizer selection (FR-002, FR-003, FR-004) */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              How do you want to optimize?{" "}
              <span className="text-slate-900">*</span>
            </h2>
            <p className="text-sm text-slate-500">
              Applies across all brands in the portfolio, unless you choose
              Custom to set Ally AI or rule-based per brand on the Goals step.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPTIMIZER_OPTIONS.map((option) => {
              const isSelected = optimizerType === option.value;
              const isAllyAiOption = option.value === "ally-ai";
              const isDisabled = isAllyAiOption && isSovSelected;
              const showAsSelected = isSelected && !isDisabled;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleOptimizerChange(option.value)}
                  className={cn(
                    "flex gap-3 rounded-lg border p-4 text-left transition-colors",
                    isDisabled &&
                      "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60",
                    showAsSelected
                      ? "border-brand-600 bg-brand-50"
                      : !isDisabled &&
                          "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                  title={
                    isDisabled ? ALLY_AI_SOV_DISABLED_MESSAGE : undefined
                  }
                  aria-disabled={isDisabled}
                >
                  <RadioIndicator selected={showAsSelected} />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isDisabled ? "text-slate-500" : "text-slate-900",
                        )}
                      >
                        {option.label}
                      </p>
                      {option.recommended && !isDisabled && (
                        <Badge className="border border-brand-200/60 bg-gradient-to-r from-brand-100 to-cyan-100 text-brand-700 hover:from-brand-100 hover:to-cyan-100">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {isDisabled
                        ? ALLY_AI_SOV_DISABLED_MESSAGE
                        : option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {optimizerType === "rule-based" && (
            <ImpactBanner title="Rule-based flow — no budgets">
              {RULE_BASED_OPTIMIZER_NOTICE}
            </ImpactBanner>
          )}

          {showAggressiveness ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Aggressiveness
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AGGRESSIVENESS_OPTIONS.map((option) => {
                  const isSelected =
                    generalConfig.aggressiveness === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.description}
                      onClick={() => {
                        const next = isSelected ? null : option.value;
                        recordGeneralAggressivenessChange(
                          generalConfig.aggressiveness,
                          next,
                        );
                        setAggressiveness(next);
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                        isSelected
                          ? "border-brand-600 bg-brand-50"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      )}
                    >
                      <RadioIndicator selected={isSelected} compact />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-snug text-slate-900 sm:text-sm">
                          {option.label}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-tight text-slate-500">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
