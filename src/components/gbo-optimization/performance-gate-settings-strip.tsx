"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PerformanceGateSettingsStripProps = {
  minSpendFloor: number;
  onMinSpendFloorChange: (value: number) => void;
  className?: string;
};

function clampMinSpendFloor(value: number): number {
  if (!Number.isFinite(value)) {
    return 70;
  }

  return Math.min(99, Math.max(1, Math.round(value)));
}

function SectionDivider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn("w-px self-stretch bg-slate-200", className)}
    />
  );
}

export function PerformanceGateSettingsStrip({
  minSpendFloor,
  onMinSpendFloorChange,
  className,
}: PerformanceGateSettingsStripProps) {
  const [draftValue, setDraftValue] = useState(String(minSpendFloor));
  const remainingSpend = 100 - minSpendFloor;

  useEffect(() => {
    setDraftValue(String(minSpendFloor));
  }, [minSpendFloor]);

  const commitDraftValue = () => {
    const parsed = Number.parseInt(draftValue, 10);
    const next = clampMinSpendFloor(parsed);
    onMinSpendFloorChange(next);
    setDraftValue(String(next));
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div className="min-w-0 sm:max-w-xs">
            <h3 className="text-sm font-medium text-slate-800">
              Performance gate settings
            </h3>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Gate threshold = the Goal value already set per row – no extra input
              needed.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-xs font-medium text-slate-700">
              Min spend floor
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={commitDraftValue}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
                aria-label="Minimum spend floor percentage"
                className="h-8 w-14 border-slate-200 bg-white text-center text-sm font-semibold tabular-nums shadow-none"
              />
              <span className="text-sm text-slate-500">% / month</span>
            </div>
          </div>
        </div>

        <SectionDivider className="hidden lg:block" />
        <div
          role="separator"
          aria-orientation="horizontal"
          className="h-px bg-slate-200 lg:hidden"
        />

        <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700 lg:pt-0.5">
          Budget up to{" "}
          <span className="font-semibold text-brand-700 tabular-nums">
            {minSpendFloor}%
          </span>{" "}
          of monthly spend is always delivered. The remaining{" "}
          <span className="font-semibold text-amber-800 tabular-nums">
            {remainingSpend}%
          </span>{" "}
          is released only when the scope row&apos;s goal value is met.
        </p>
      </div>
    </div>
  );
}
