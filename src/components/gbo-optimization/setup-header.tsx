"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Cloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import {
  areAllGoalsBudgetsGoalsSelected,
  hasTaxonomyChanged,
  isGeneralConfigComplete,
  useSetupSessionStore,
} from "@/lib/gbo-optimization/setup-session-store";
import type { SetupStepKey } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

import { SetupStepper } from "./setup-stepper";

type SetupHeaderProps = {
  currentStep: SetupStepKey;
  isLaunching?: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  onStepSelect: (step: SetupStepKey) => void;
};

export function SetupHeader({
  currentStep,
  isLaunching = false,
  onBack,
  onNext,
  onComplete,
  onStepSelect,
}: SetupHeaderProps) {
  const { steps, constraintsStepValid } = useSetupContext();
  const changeLedger = useSetupSessionStore((state) => state.changeLedger);
  const summaryReviewed = useSetupSessionStore((state) => state.summaryReviewed);
  const generalConfig = useSetupSessionStore((state) => state.generalConfig);
  const taxonomyBaseline = useSetupSessionStore(
    (state) => state.taxonomyBaseline,
  );
  const goalsRowState = useSetupSessionStore((state) => state.goalsRowState);
  const scopeEditModeByGroup = useSetupSessionStore(
    (state) => state.scopeEditModeByGroup,
  );
  const triggerMissingGoalsFeedback = useSetupSessionStore(
    (state) => state.triggerMissingGoalsFeedback,
  );
  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const stepConfig = steps[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isSummaryStep = currentStep === "summary";
  const hasSessionChanges =
    changeLedger.length > 0 ||
    hasTaxonomyChanged(taxonomyBaseline, generalConfig);
  const goalsBudgetsStepValid = areAllGoalsBudgetsGoalsSelected(
    goalsRowState,
    scopeEditModeByGroup,
    generalConfig.level1,
    generalConfig.level2,
  );
  const isGoalsBudgetsBlocked =
    currentStep === "goals-budgets" && !goalsBudgetsStepValid;
  const isNextDisabled =
    (currentStep === "general" && !isGeneralConfigComplete(generalConfig)) ||
    (currentStep === "constraints" && !constraintsStepValid);
  const isSaveDisabled =
    isSummaryStep && hasSessionChanges && !summaryReviewed;
  const isPrimaryDisabled =
    isNextDisabled || isSaveDisabled || isLaunching;

  const handlePrimaryAction = () => {
    if (isLaunching) {
      return;
    }

    if (isSaveDisabled) {
      return;
    }

    if (isGoalsBudgetsBlocked) {
      triggerMissingGoalsFeedback();
      return;
    }

    if (isNextDisabled) {
      return;
    }

    if (isSummaryStep) {
      onComplete();
      return;
    }

    onNext();
  };

  return (
    <div className="z-30 shrink-0 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex min-h-9 items-center">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
          <Cloud className="size-4 shrink-0 text-slate-500" />
          <span className="shrink-0">Optimization</span>
          <span className="shrink-0 text-slate-400">&gt;</span>
          <button
            type="button"
            className="flex min-w-0 items-center gap-1 truncate font-medium text-brand-600 underline decoration-dashed underline-offset-4"
          >
            <span className="truncate">Setup for Amazon Retail</span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex w-28 shrink-0 items-center sm:w-32">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isLaunching}
              className="gap-1.5 text-slate-600"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex min-w-0 flex-1 justify-center">
          <SetupStepper
            currentStep={currentStep}
            onStepSelect={isLaunching ? () => {} : onStepSelect}
            className={cn(
              "w-full max-w-4xl",
              isLaunching && "pointer-events-none opacity-60",
            )}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <Button
            variant="link"
            className="hidden h-auto shrink-0 px-0 text-brand-600 hover:text-brand-700 sm:inline-flex"
            render={<Link href="/" />}
          >
            Exit Setup
          </Button>
          <Button
            onClick={handlePrimaryAction}
            disabled={isPrimaryDisabled}
            aria-busy={isLaunching}
            className={cn(
              "shrink-0 gap-1.5 bg-brand-600 text-white hover:bg-brand-700",
              isPrimaryDisabled && "cursor-not-allowed opacity-50",
            )}
          >
            {isSummaryStep ? (
              isLaunching ? (
                <>
                  <Loader variant="circular" size="sm" className="border-white" />
                  <span>Applying…</span>
                </>
              ) : (
                <>
                  <span>Save & Launch</span>
                  <ArrowRight className="size-4" />
                </>
              )
            ) : (
              <>
                <span className="hidden sm:inline">
                  Next: {stepConfig.nextLabel}
                </span>
                <span className="sm:hidden">{stepConfig.nextLabel}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
