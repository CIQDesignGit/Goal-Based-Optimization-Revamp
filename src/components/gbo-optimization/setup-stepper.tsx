"use client";

import { Check } from "lucide-react";
import { Fragment } from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import type { SetupStepKey } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

type SetupStepperProps = {
  currentStep: SetupStepKey;
  onStepSelect: (step: SetupStepKey) => void;
  className?: string;
};

type StepStatus = "completed" | "current" | "upcoming";

function getStepStatus(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "upcoming";
}

function StepIcon({
  status,
  stepNumber,
}: {
  status: StepStatus;
  stepNumber: number;
}) {
  if (status === "completed") {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100"
        aria-hidden
      >
        <Check className="size-3.5 stroke-[2.5] text-emerald-700" />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        aria-hidden
      >
        {stepNumber}
      </span>
    );
  }

  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-500"
      aria-hidden
    >
      {stepNumber}
    </span>
  );
}

function StepLabel({
  status,
  label,
  className,
}: {
  status: StepStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "hidden whitespace-nowrap text-sm font-medium lg:inline",
        status === "current" && "text-brand-600",
        status === "completed" && "text-slate-800",
        status === "upcoming" && "text-slate-600",
        className,
      )}
    >
      {label}
    </span>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <div
      className={cn(
        "mx-1 h-px min-w-2 max-w-[60px] flex-1 self-center sm:mx-2",
        isComplete ? "bg-emerald-400" : "bg-slate-200",
      )}
      aria-hidden
    />
  );
}

export function SetupStepper({
  currentStep,
  onStepSelect,
  className,
}: SetupStepperProps) {
  const { steps } = useSetupContext();
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <nav
      aria-label="Setup progress"
      className={cn("flex w-full min-w-0 items-center", className)}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index, currentIndex);
        const stepNumber = step.id;
        const isCurrent = status === "current";

        return (
          <Fragment key={step.key}>
            {index > 0 && (
              <StepConnector isComplete={index <= currentIndex} />
            )}

            <div className="relative shrink-0 pb-2.5">
              <button
                type="button"
                onClick={() => onStepSelect(step.key)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors",
                  "hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  isCurrent && "hover:bg-transparent",
                )}
              >
                <StepIcon status={status} stepNumber={stepNumber} />
                <StepLabel status={status} label={step.label} />
              </button>

              {isCurrent && (
                <span
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-brand-600"
                  aria-hidden
                />
              )}
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}
