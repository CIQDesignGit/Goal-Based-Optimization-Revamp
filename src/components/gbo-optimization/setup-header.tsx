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
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
          <Cloud className="size-4 shrink-0 text-slate-500" />
          <span>Optimization</span>
          <span className="text-slate-400">&gt;</span>
          <button
            type="button"
            className="flex items-center gap-1 font-medium text-slate-900 underline decoration-dashed underline-offset-4"
          >
            Setup for Amazon Retail
            <ChevronDown className="size-4" />
          </button>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <SetupStepper currentStep={currentStep} />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            className="text-slate-600"
            render={<Link href="/" />}
          >
            Exit Setup
          </Button>
          <Button
            onClick={onNext}
            disabled={isLastStep}
            className={cn(
              "gap-1.5",
              !isLastStep && "bg-info-600 text-white hover:bg-info-700",
            )}
          >
            Next: {stepConfig.nextLabel}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center border-t border-slate-100 px-6 py-3 lg:hidden">
        <SetupStepper currentStep={currentStep} />
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
