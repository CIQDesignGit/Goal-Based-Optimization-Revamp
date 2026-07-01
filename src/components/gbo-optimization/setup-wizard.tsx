"use client";

import { useState } from "react";

import { SetupHeader } from "@/components/gbo-optimization/setup-header";
import { ConstraintsStep } from "@/components/gbo-optimization/steps/constraints-step";
import { GeneralStep } from "@/components/gbo-optimization/steps/general-step";
import { GoalsBudgetsStep } from "@/components/gbo-optimization/steps/goals-budgets-step";
import { OptimizerStep } from "@/components/gbo-optimization/steps/optimizer-step";
import {
  SETUP_STEPS,
  type SetupStepKey,
} from "@/lib/gbo-optimization/setup-data";

const STEP_COMPONENTS: Record<SetupStepKey, React.ComponentType> = {
  general: GeneralStep,
  "goals-budgets": GoalsBudgetsStep,
  constraints: ConstraintsStep,
  optimizer: OptimizerStep,
};

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState<SetupStepKey>("general");
  const StepComponent = STEP_COMPONENTS[currentStep];

  const currentIndex = SETUP_STEPS.findIndex((step) => step.key === currentStep);

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(SETUP_STEPS[currentIndex - 1].key);
    }
  };

  const handleNext = () => {
    if (currentIndex < SETUP_STEPS.length - 1) {
      setCurrentStep(SETUP_STEPS[currentIndex + 1].key);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-slate-100">
      <SetupHeader
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
      />
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <StepComponent />
      </div>
    </div>
  );
}
