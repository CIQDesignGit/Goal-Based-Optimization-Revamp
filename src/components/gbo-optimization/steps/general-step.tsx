"use client";

import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { ImpactBanner } from "@/components/gbo-optimization/impact-banner";
import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AGGRESSIVENESS_OPTIONS,
  BUDGET_GRANULARITIES,
  getGoalChangeImpactMessage,
  GOAL_TYPE_OPTIONS,
  isSovGoal,
  LEVEL_1_OPTIONS,
  LEVEL_2_OPTIONS,
  OPTIMIZER_OPTIONS,
  RULE_BASED_OPTIMIZER_NOTICE,
  type GoalType,
  type OptimizerType,
} from "@/lib/gbo-optimization/setup-data";
import {
  useSetupSessionStore,
  type BudgetDefinitionType,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const SETUP_SELECT_TRIGGER_CLASS =
  "w-full border-slate-200 bg-white text-slate-700 shadow-none";

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

export function GeneralStep() {
  const { optimizerType, setOptimizerType } = useSetupContext();
  const generalConfig = useSetupSessionStore((state) => state.generalConfig);
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

  const isSovSelected = isSovGoal(generalConfig.goalType);

  const handleGoalTypeChange = (goalType: GoalType) => {
    setGoalType(goalType);

    if (isSovGoal(goalType) && optimizerType === "ally-ai") {
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

    // FR-003 — only prompt when switching away from Ally AI; OK keeps Rule-based.
    if (value === "rule-based" && optimizerType === "ally-ai") {
      const keepRuleBased = window.confirm(
        "Ally AI is recommended — it handles spend and constraints automatically.\n\nClick OK to continue with Rule-based.\nClick Cancel to switch to Ally AI instead.",
      );

      if (!keepRuleBased) {
        setOptimizerType("ally-ai");
        return;
      }
    }

    setOptimizerType(value);
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
              className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1"
              role="tablist"
              aria-label="Budget granularity"
            >
              {BUDGET_GRANULARITIES.map((option) => {
                const isSelected = generalConfig.granularity === option;

                return (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() =>
                      updateGeneralConfig({ granularity: option })
                    }
                    className={cn(
                      "rounded-md px-2 py-2.5 text-center text-sm transition-colors",
                      isSelected
                        ? "border border-brand-600 bg-white font-semibold text-brand-600"
                        : "border border-transparent bg-transparent font-normal text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {option}
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
                  onClick={() =>
                    updateGeneralConfig({ budgetType: option.value })
                  }
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
                options={LEVEL_1_OPTIONS}
                placeholder="Select portfolio"
                onValueChange={(value) =>
                  updateGeneralConfig({ level1: value })
                }
                triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
              />

              <SetupInlineSelect
                label="Level 2"
                value={generalConfig.level2}
                options={LEVEL_2_OPTIONS}
                placeholder="Select category"
                onValueChange={(value) =>
                  updateGeneralConfig({ level2: value })
                }
                triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal type + aggressiveness (FR-001) */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              What is your optimization goal?{" "}
              <span className="text-slate-900">*</span>
            </h2>
            <p className="text-sm text-slate-500">
              Portfolio-wide goal and aggressiveness before budgets, constraints,
              and seasonality.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {GOAL_TYPE_OPTIONS.map((option) => {
              const isSelected = generalConfig.goalType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.description}
                  onClick={() => handleGoalTypeChange(option.value)}
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

          {isSovSelected && (
            <ImpactBanner title="SOV is not supported with Ally AI">
              Share of Voice goals work with rule-based optimization only. Ally AI
              is disabled for this portfolio.
            </ImpactBanner>
          )}

          {generalConfig.showGoalChangeImpact && generalConfig.goalType && (
            <ImpactBanner
              title="Goal change impact"
              onDismiss={dismissGoalChangeImpact}
            >
              {getGoalChangeImpactMessage(
                optimizerType,
                generalConfig.goalType,
              )}
            </ImpactBanner>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Aggressiveness <span className="text-slate-900">*</span>
            </h3>
            <div
              className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
              role="tablist"
              aria-label="Aggressiveness level"
            >
              {AGGRESSIVENESS_OPTIONS.map((option) => {
                const isSelected =
                  generalConfig.aggressiveness === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    title={option.description}
                    onClick={() => setAggressiveness(option.value)}
                    className={cn(
                      "rounded-md px-2 py-2 text-center text-sm transition-colors",
                      isSelected
                        ? "border border-brand-600 bg-white font-semibold text-brand-600"
                        : "border border-transparent bg-transparent font-normal text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
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
              Applies across all brands in the portfolio. You can also override
              Ally AI or rule-based per brand on the Goals step.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIMIZER_OPTIONS.map((option) => {
              const isSelected = optimizerType === option.value;
              const isDisabled =
                option.value === "ally-ai" && isSovSelected;

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
                    !isDisabled && isSelected
                      ? "border-brand-600 bg-brand-50"
                      : !isDisabled &&
                          "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                  title={
                    isDisabled
                      ? "SOV is not supported with Ally AI"
                      : undefined
                  }
                >
                  <RadioIndicator selected={isSelected && !isDisabled} />
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
                      {option.description}
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
        </CardContent>
      </Card>
    </div>
  );
}
