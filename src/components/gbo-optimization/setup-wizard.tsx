"use client";

import { Rocket } from "lucide-react";
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
import type { SetupStepKey } from "@/lib/gbo-optimization/setup-data";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const LAUNCH_APPLY_MS = 4000;

const LAUNCH_PROGRESS_STEPS = [
  "Saving setup changes",
  "Validating portfolio rules",
  "Launching optimization",
] as const;

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
  const [launchStepIndex, setLaunchStepIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const launchStepTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const showSetupToast = useSetupSessionStore((state) => state.showSetupToast);
  const discardOptimizerDrafts = useSetupSessionStore(
    (state) => state.discardOptimizerDrafts,
  );
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
      if (launchStepTimerRef.current) {
        clearInterval(launchStepTimerRef.current);
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
    setLaunchStepIndex(0);

    if (launchStepTimerRef.current) {
      clearInterval(launchStepTimerRef.current);
    }

    // Cycle through progress steps while saving (prototype timing).
    launchStepTimerRef.current = setInterval(() => {
      setLaunchStepIndex((current) =>
        Math.min(current + 1, LAUNCH_PROGRESS_STEPS.length - 1),
      );
    }, Math.floor(LAUNCH_APPLY_MS / LAUNCH_PROGRESS_STEPS.length));

    launchTimerRef.current = setTimeout(() => {
      if (launchStepTimerRef.current) {
        clearInterval(launchStepTimerRef.current);
        launchStepTimerRef.current = null;
      }
      setIsLaunching(false);
      setLaunchStepIndex(0);
      // Inactive mode drafts are only discarded after the setup is committed.
      discardOptimizerDrafts();
      showSetupToast("Setup saved and launched successfully.", {
        variant: "success",
      });
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
        data-setup-scroll-region
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-6 pb-8",
          // Wide tables: one step scrollport so sticky top + left don’t fight page scroll.
          currentStep === "goals-budgets" ||
            currentStep === "constraints" ||
            currentStep === "optimizer"
            ? "overflow-hidden"
            : "overflow-auto",
        )}
      >
        <StepComponent />
      </div>

      {toastMessage ? (
        <SetupToast className="absolute bottom-6 left-6 z-40" />
      ) : null}

      {isLaunching ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 px-6 supports-backdrop-filter:backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {/*
            Alignment: icon + copy share one row; progress spans the full
            content width so it doesn't hang under the text column alone.
          */}
          <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-5 text-slate-900 ring-1 ring-foreground/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <Rocket className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-base font-medium">Launching your setup</p>
                <p className="text-sm text-muted-foreground">
                  {LAUNCH_PROGRESS_STEPS[launchStepIndex]}…
                </p>
              </div>
            </div>

            <div
              className="h-1 overflow-hidden rounded-full bg-slate-100"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
                style={{
                  width: `${((launchStepIndex + 1) / LAUNCH_PROGRESS_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
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
