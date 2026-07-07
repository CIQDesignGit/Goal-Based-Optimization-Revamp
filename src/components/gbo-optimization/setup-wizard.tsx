"use client";

import { useEffect, useRef, useState } from "react";

import { SetupHeader } from "@/components/gbo-optimization/setup-header";
import { SetupToast } from "@/components/gbo-optimization/setup-toast";
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
import { Loader } from "@/components/ui/loader";
import type { SetupStepKey } from "@/lib/gbo-optimization/setup-data";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";

const LAUNCH_APPLY_MS = 2500;

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
    "seasonality",
    "constraints",
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
  const [isLaunching, setIsLaunching] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSetupToast = useSetupSessionStore((state) => state.showSetupToast);
  const toastMessage = useSetupSessionStore((state) => state.toastMessage);
  const StepComponent = STEP_COMPONENTS[currentStep];

  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const stepKeys = steps.map((step) => step.key);

  useEffect(() => {
    const resolved = resolveStepAfterFlowChange(currentStep, stepKeys);
    if (resolved !== currentStep) {
      setCurrentStep(resolved);
    }
  }, [optimizerType, stepKeys, currentStep]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resetScroll = () => {
      container.scrollTop = 0;
      container.scrollLeft = 0;
    };

    resetScroll();
    requestAnimationFrame(resetScroll);
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current) {
        clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

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
    if (isLaunching) {
      return;
    }

    setIsLaunching(true);

    launchTimerRef.current = setTimeout(() => {
      setIsLaunching(false);
      showSetupToast("Changes saved and launched successfully.");
      launchTimerRef.current = null;
    }, LAUNCH_APPLY_MS);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-slate-100">
      <SetupHeader
        currentStep={currentStep}
        isLaunching={isLaunching}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={handleComplete}
        onStepSelect={setCurrentStep}
      />
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-6 pb-8"
      >
        <StepComponent />
      </div>

      {toastMessage ? (
        <SetupToast className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2" />
      ) : null}

      {isLaunching ? (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/85 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader variant="circular" size="lg" />
          <p className="text-sm font-semibold text-slate-900">
            Applying changes…
          </p>
          <p className="max-w-sm text-center text-sm text-slate-500">
            Your setup is being saved and launched. This may take a moment
            (FR-025).
          </p>
        </div>
      ) : null}
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
