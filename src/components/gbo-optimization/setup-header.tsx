"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Cloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import type { SetupStepKey } from "@/lib/gbo-optimization/setup-data";

import { SetupStepper } from "./setup-stepper";

type SetupHeaderProps = {
  currentStep: SetupStepKey;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
};

export function SetupHeader({
  currentStep,
  onBack,
  onNext,
  onComplete,
}: SetupHeaderProps) {
  const { steps } = useSetupContext();
  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const stepConfig = steps[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isSummaryStep = currentStep === "summary";

  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="relative flex min-h-9 items-center justify-center">
        <div className="absolute left-0 flex min-w-0 items-center gap-2 text-sm text-slate-600">
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

        <SetupStepper currentStep={currentStep} className="w-full max-w-3xl" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-slate-600"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
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
            onClick={isSummaryStep ? onComplete : onNext}
            className="shrink-0 gap-1.5 bg-brand-600 text-white hover:bg-brand-700"
          >
            {isSummaryStep ? (
              <>
                <span>Save & Launch</span>
                <ArrowRight className="size-4" />
              </>
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
