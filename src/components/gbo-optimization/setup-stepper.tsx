"use client";

import { Check } from "lucide-react";
import { Fragment } from "react";

import {
  SETUP_STEPS,
  type SetupStepKey,
} from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

type SetupStepperProps = {
  currentStep: SetupStepKey;
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
        "mx-3 h-px w-10 shrink-0 self-center sm:w-16",
        isComplete ? "bg-emerald-400" : "bg-slate-200",
      )}
      aria-hidden
    />
  );
}

export function SetupStepper({ currentStep, className }: SetupStepperProps) {
  const currentIndex = SETUP_STEPS.findIndex((step) => step.key === currentStep);

  return (
    <nav
      aria-label="Setup progress"
      className={cn("flex shrink-0 items-center", className)}
    >
      {SETUP_STEPS.map((step, index) => {
        const status = getStepStatus(index, currentIndex);
        const stepNumber = step.id;

        return (
          <Fragment key={step.key}>
            {index > 0 && (
              <StepConnector isComplete={index <= currentIndex} />
            )}

            <div className="relative flex shrink-0 items-center gap-2 pb-2.5">
              <div
                className="flex items-center gap-2"
                aria-current={status === "current" ? "step" : undefined}
              >
                <StepIcon status={status} stepNumber={stepNumber} />
                <StepLabel status={status} label={step.label} />
              </div>

              {status === "current" && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-600"
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
