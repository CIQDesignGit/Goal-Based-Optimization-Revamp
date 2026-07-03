"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getSetupSteps,
  isSovGoal,
  type OptimizerType,
  type SetupStepConfig,
} from "@/lib/gbo-optimization/setup-data";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";

type SetupContextValue = {
  optimizerType: OptimizerType;
  setOptimizerType: (value: OptimizerType) => void;
  constraintsStepValid: boolean;
  setConstraintsStepValid: (value: boolean) => void;
  steps: SetupStepConfig[];
};

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [optimizerType, setOptimizerTypeState] =
    useState<OptimizerType>("ally-ai");
  const [constraintsStepValid, setConstraintsStepValidState] = useState(true);
  const goalType = useSetupSessionStore((state) => state.generalConfig.goalType);

  const steps = useMemo(
    () => getSetupSteps(optimizerType),
    [optimizerType],
  );

  const setOptimizerType = useCallback(
    (value: OptimizerType) => {
      if (value === "ally-ai" && isSovGoal(goalType)) {
        return;
      }

      setOptimizerTypeState(value);
    },
    [goalType],
  );

  const setConstraintsStepValid = useCallback((value: boolean) => {
    setConstraintsStepValidState(value);
  }, []);

  return (
    <SetupContext.Provider
      value={{
        optimizerType,
        setOptimizerType,
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
