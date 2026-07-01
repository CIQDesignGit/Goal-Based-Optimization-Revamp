"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Cloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SETUP_STEPS,
  type SetupStepKey,
} from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

import { SetupStepper } from "./setup-stepper";

type SetupHeaderProps = {
  currentStep: SetupStepKey;
  onBack: () => void;
  onNext: () => void;
};

export function SetupHeader({
  currentStep,
  onBack,
  onNext,
}: SetupHeaderProps) {
  const currentIndex = SETUP_STEPS.findIndex((step) => step.key === currentStep);
  const stepConfig = SETUP_STEPS[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === SETUP_STEPS.length - 1;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 text-sm text-slate-600">
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

        <SetupStepper currentStep={currentStep} />

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <Button
            variant="link"
            className="hidden h-auto shrink-0 px-0 text-brand-600 hover:text-brand-700 sm:inline-flex"
            render={<Link href="/" />}
          >
            Exit Setup
          </Button>
          <Button
            onClick={onNext}
            disabled={isLastStep}
            className={cn(
              "shrink-0 gap-1.5",
              !isLastStep && "bg-brand-600 text-white hover:bg-brand-700",
            )}
          >
            <span className="hidden sm:inline">Next: {stepConfig.nextLabel}</span>
            <span className="sm:hidden">{stepConfig.nextLabel}</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {!isFirstStep && (
        <div className="border-t border-slate-100 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-slate-600"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
