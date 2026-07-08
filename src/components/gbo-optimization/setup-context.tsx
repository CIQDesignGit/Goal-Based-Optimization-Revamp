"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getSetupSteps,
  GOALS_GOAL_EDITABLE_ROWS,
  isSovGoal,
  type OptimizerType,
  type SetupStepConfig,
} from "@/lib/gbo-optimization/setup-data";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";

type SetupContextValue = {
  optimizerType: OptimizerType;
  setOptimizerType: (value: OptimizerType) => void;
  includeSeasonality: boolean;
  setIncludeSeasonality: (value: boolean) => void;
  includeConstraints: boolean;
  setIncludeConstraints: (value: boolean) => void;
  constraintsStepValid: boolean;
  setConstraintsStepValid: (value: boolean) => void;
  steps: SetupStepConfig[];
};

const SetupContext = createContext<SetupContextValue | null>(null);

type AllyFlowToggles = {
  seasonality: boolean;
  constraints: boolean;
};

function isAllyStyleFlow(optimizer: OptimizerType): boolean {
  return optimizer === "ally-ai" || optimizer === "custom";
}

export function SetupProvider({ children }: { children: ReactNode }) {
  const [optimizerType, setOptimizerTypeState] =
    useState<OptimizerType>("ally-ai");
  const [includeSeasonality, setIncludeSeasonalityState] = useState(false);
  const [includeConstraints, setIncludeConstraintsState] = useState(false);
  const [constraintsStepValid, setConstraintsStepValidState] = useState(true);
  const allyFlowTogglesRef = useRef<AllyFlowToggles>({
    seasonality: false,
    constraints: false,
  });
  const goalType = useSetupSessionStore((state) => state.generalConfig.goalType);
  const goalsRowState = useSetupSessionStore((state) => state.goalsRowState);

  const hasSovGoal = useMemo(
    () =>
      isSovGoal(goalType) ||
      GOALS_GOAL_EDITABLE_ROWS.some(
        (row) => goalsRowState[row.id]?.goalMetric === "sov",
      ),
    [goalType, goalsRowState],
  );

  const steps = useMemo(
    () =>
      getSetupSteps(optimizerType, {
        includeSeasonality,
        includeConstraints,
      }),
    [optimizerType, includeSeasonality, includeConstraints],
  );

  const setOptimizerType = useCallback(
    (value: OptimizerType) => {
      if (value === "ally-ai" && hasSovGoal) {
        return;
      }

      setOptimizerTypeState((currentOptimizer) => {
        if (currentOptimizer === value) {
          return currentOptimizer;
        }

        if (isAllyStyleFlow(currentOptimizer) && value === "rule-based") {
          allyFlowTogglesRef.current = {
            seasonality: includeSeasonality,
            constraints: includeConstraints,
          };
          setIncludeSeasonalityState(false);
        } else if (
          currentOptimizer === "rule-based" &&
          isAllyStyleFlow(value)
        ) {
          setIncludeSeasonalityState(allyFlowTogglesRef.current.seasonality);
          setIncludeConstraintsState(allyFlowTogglesRef.current.constraints);
        }

        return value;
      });
    },
    [hasSovGoal, includeSeasonality, includeConstraints],
  );

  // SOV goals cannot use Ally AI at the portfolio level (FR-004).
  useEffect(() => {
    if (hasSovGoal && optimizerType === "ally-ai") {
      setOptimizerType("rule-based");
    }
  }, [hasSovGoal, optimizerType, setOptimizerType]);

  const setConstraintsStepValid = useCallback((value: boolean) => {
    setConstraintsStepValidState(value);
  }, []);

  const setIncludeSeasonality = useCallback(
    (value: boolean) => {
      if (optimizerType === "rule-based") {
        return;
      }

      setIncludeSeasonalityState(value);
    },
    [optimizerType],
  );

  const setIncludeConstraints = useCallback((value: boolean) => {
    setIncludeConstraintsState(value);
  }, []);

  return (
    <SetupContext.Provider
      value={{
        optimizerType,
        setOptimizerType,
        includeSeasonality,
        setIncludeSeasonality,
        includeConstraints,
        setIncludeConstraints,
        constraintsStepValid,
        setConstraintsStepValid,
        steps,
      }}
    >
      {children}
    </SetupContext.Provider>
  );
}

export function useSetupContext() {
  const context = useContext(SetupContext);

  if (!context) {
    throw new Error("useSetupContext must be used within a SetupProvider");
  }

  return context;
}
