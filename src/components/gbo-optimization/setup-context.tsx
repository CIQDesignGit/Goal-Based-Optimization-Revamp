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
  steps: SetupStepConfig[];
};

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [optimizerType, setOptimizerTypeState] =
    useState<OptimizerType>("ally-ai");

  const steps = useMemo(
    () => getSetupSteps(optimizerType),
    [optimizerType],
  );

  const setOptimizerType = useCallback((value: OptimizerType) => {
    setOptimizerTypeState(value);
  }, []);

  return (
    <SetupContext.Provider
      value={{ optimizerType, setOptimizerType, steps }}
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
