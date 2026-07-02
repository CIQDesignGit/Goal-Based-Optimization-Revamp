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
  type OptimizerType,
  type SetupStepConfig,
} from "@/lib/gbo-optimization/setup-data";

type SetupContextValue = {
  optimizerType: OptimizerType;
  setOptimizerType: (value: OptimizerType) => void;
  includeSeasonality: boolean;
  setIncludeSeasonality: (value: boolean) => void;
  includeConstraints: boolean;
  setIncludeConstraints: (value: boolean) => void;
  steps: SetupStepConfig[];
};

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [optimizerType, setOptimizerTypeState] =
    useState<OptimizerType>("ally-ai");
  const [includeSeasonality, setIncludeSeasonalityState] = useState(false);
  const [includeConstraints, setIncludeConstraintsState] = useState(false);

  const steps = useMemo(
    () =>
      getSetupSteps(optimizerType, {
        includeSeasonality,
        includeConstraints,
      }),
    [optimizerType, includeSeasonality, includeConstraints],
  );

  const setOptimizerType = useCallback((value: OptimizerType) => {
    setOptimizerTypeState(value);
  }, []);

  const setIncludeSeasonality = useCallback((value: boolean) => {
    setIncludeSeasonalityState(value);
  }, []);

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
