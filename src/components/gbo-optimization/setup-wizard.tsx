"use client";

import { useEffect, useState } from "react";

import { SetupHeader } from "@/components/gbo-optimization/setup-header";
import {
  SetupProvider,
  useSetupContext,
} from "@/components/gbo-optimization/setup-context";
import { ConstraintsStep } from "@/components/gbo-optimization/steps/constraints-step";
import { GeneralStep } from "@/components/gbo-optimization/steps/general-step";
import { GoalsBudgetsStep } from "@/components/gbo-optimization/steps/goals-budgets-step";
import { OptimizerStep } from "@/components/gbo-optimization/steps/optimizer-step";
import { SeasonalityStep } from "@/components/gbo-optimization/steps/seasonality-step";
import { SummaryStep } from "@/components/gbo-optimization/steps/summary-step";
import type { SetupStepKey } from "@/lib/gbo-optimization/setup-data";

const STEP_COMPONENTS: Record<SetupStepKey, React.ComponentType> = {
  general: GeneralStep,
  "goals-budgets": GoalsBudgetsStep,
  constraints: ConstraintsStep,
  seasonality: SeasonalityStep,
  optimizer: OptimizerStep,
  summary: SummaryStep,
};

/** When the flow changes, keep the user on a valid step. */
function resolveStepAfterFlowChange(
  currentStep: SetupStepKey,
  stepKeys: SetupStepKey[],
): SetupStepKey {
  if (stepKeys.includes(currentStep)) {
    return currentStep;
  }

  const canonicalOrder: SetupStepKey[] = [
    "general",
    "goals-budgets",
    "constraints",
    "seasonality",
    "optimizer",
    "summary",
  ];

  const currentIndex = canonicalOrder.indexOf(currentStep);

  for (let index = currentIndex; index < canonicalOrder.length; index++) {
    const key = canonicalOrder[index];
    if (stepKeys.includes(key)) {
      return key;
    }
  }

  for (let index = currentIndex - 1; index >= 0; index--) {
    const key = canonicalOrder[index];
    if (stepKeys.includes(key)) {
      return key;
    }
  }

  return stepKeys[0] ?? "general";
}

function SetupWizardContent() {
  const { optimizerType, steps } = useSetupContext();
  const [currentStep, setCurrentStep] = useState<SetupStepKey>("general");
  const StepComponent = STEP_COMPONENTS[currentStep];

  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const stepKeys = steps.map((step) => step.key);

  useEffect(() => {
    const resolved = resolveStepAfterFlowChange(currentStep, stepKeys);
    if (resolved !== currentStep) {
      setCurrentStep(resolved);
    }
  }, [optimizerType, stepKeys, currentStep]);

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handleComplete = () => {
    // FR-025 — loader while changes apply will hook in here later.
    window.alert("Save & Launch — changes would commit after approval.");
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-100">
      <SetupHeader
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={handleComplete}
        onStepSelect={setCurrentStep}
      />
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <StepComponent />
      </div>
    </div>
  );
}

export function SetupWizard() {
  return (
    <SetupProvider>
      <SetupWizardContent />
    </SetupProvider>
  );
}
