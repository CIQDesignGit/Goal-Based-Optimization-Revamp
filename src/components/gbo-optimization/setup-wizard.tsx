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
        className="min-h-0 flex-1 overflow-auto px-6 pb-8"
      >
        <StepComponent />
      </div>

      {toastMessage ? (
        <SetupToast className="absolute bottom-6 left-6 z-40" />
      ) : null}

      {isLaunching ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-6 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* Branded header strip */}
            <div className="relative overflow-hidden border-b border-slate-100 bg-linear-to-br from-brand-50 via-white to-sky-50 px-6 py-6">
              <div
                className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-brand-200/25 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-col items-center gap-4 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-brand-100 bg-white shadow-sm">
                  <Loader
                    variant="circular"
                    size="lg"
                    className="border-brand-500"
                  />
                </span>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-slate-900">
                    Launching your setup
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                    We’re saving your changes and turning on optimization across
                    the portfolio. Hang tight for a few seconds.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-brand-100">
                  <div className="loader-progress-bar h-full rounded-full bg-brand-500" />
                </div>
                <p className="text-center text-xs font-medium text-brand-700">
                  {LAUNCH_PROGRESS_STEPS[launchStepIndex]}
                </p>
              </div>

              {/* Checklist of what is happening */}
              <ul className="space-y-2.5">
                {LAUNCH_PROGRESS_STEPS.map((label, index) => {
                  const isDone = index < launchStepIndex;
                  const isCurrent = index === launchStepIndex;

                  return (
                    <li
                      key={label}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        isDone &&
                          "border-success-100 bg-success-50/70 text-success-700",
                        isCurrent &&
                          "border-brand-100 bg-brand-50/80 text-brand-800",
                        !isDone &&
                          !isCurrent &&
                          "border-slate-100 bg-slate-50 text-slate-400",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          isDone && "bg-success-500 text-white",
                          isCurrent && "bg-brand-600 text-white",
                          !isDone &&
                            !isCurrent &&
                            "bg-slate-200 text-slate-500",
                        )}
                      >
                        {isDone ? "✓" : index + 1}
                      </span>
                      <span className="font-medium">{label}</span>
                      {isCurrent ? (
                        <Loader
                          variant="circular"
                          size="sm"
                          className="ml-auto border-brand-500"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
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
