"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Binary,
  Check,
  ChevronDown,
  Ban,
  WandSparkles,
  Zap,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { OptimizerColumnMode } from "@/lib/gbo-optimization/optimizer-policy";
import { cn } from "@/lib/utils";

/** Mode column value: same as Budget/Bid when they match; Custom when they differ. */
export type AggregatedOptimizerMode = OptimizerColumnMode | "custom";

export const OPTIMIZER_COLUMN_MODE_OPTIONS: {
  value: OptimizerColumnMode;
  label: string;
  description: string;
}[] = [
  {
    value: "ally",
    label: "Ally",
    description:
      "Leverage AI/ML algorithms to continuously optimize bids and budgets using historical data for best possible results.",
  },
  {
    value: "rule-based",
    label: "Rule Based",
    description:
      "Apply custom rules for this item. Skips budget entry and seasonality — path is Goals → Optimizer → Summary (Constraints only if floor/ceiling is on). The portfolio wizard does not rebuild.",
  },
  {
    value: "none",
    label: "None",
    description: "No automated optimization will be triggered",
  },
];

const AGGREGATE_MODE_LABELS: Record<AggregatedOptimizerMode, string> = {
  ally: "Ally",
  "rule-based": "Rule Based",
  none: "None",
  custom: "Custom",
};

/**
 * Mode column is an aggregate of Budget + Bid (not selectable).
 * - Both the same → that mode
 * - Different (e.g. Ally + Rule Based) → Custom
 */
export function getAggregateOptimizerMode(
  budget: OptimizerColumnMode,
  bid: OptimizerColumnMode,
): AggregatedOptimizerMode {
  if (budget === bid) {
    return budget;
  }

  return "custom";
}

function ModeOptionIcon({
  mode,
  className,
}: {
  mode: AggregatedOptimizerMode;
  className?: string;
}) {
  if (mode === "ally") {
    return (
      <Image
        src="/icons/ally.png"
        alt=""
        width={20}
        height={20}
        className={cn("size-5 shrink-0", className)}
        aria-hidden
      />
    );
  }

  if (mode === "rule-based") {
    return (
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md bg-info-50 text-info-600",
          className,
        )}
        aria-hidden
      >
        <Binary className="size-3.5" />
      </span>
    );
  }

  if (mode === "custom") {
    return (
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center text-slate-500",
          className,
        )}
        aria-hidden
      >
        <WandSparkles className="size-3.5" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500",
        className,
      )}
      aria-hidden
    >
      <Ban className="size-3.5" />
    </span>
  );
}

type OptimizerModeChipProps = {
  /** Null = empty / unset (Custom portfolio default until the user picks). */
  mode: AggregatedOptimizerMode | null;
  /** When true, shows chevron and opens the Ally / Rule Based / None menu. */
  selectable?: boolean;
  /** Bid column: show boost mark after the chip label (before chevron). */
  showBoost?: boolean;
  onChange?: (mode: OptimizerColumnMode) => void;
  allowedModes?: OptimizerColumnMode[];
  className?: string;
};

/**
 * Compact mode chip.
 * - selectable=false → read-only (Mode column aggregate; may be Custom)
 * - selectable=true → chevron + dropdown (Budget / Bid columns)
 * Changed cells are highlighted on the table <td>, not on this chip.
 */
export function OptimizerModeChip({
  mode,
  selectable = false,
  showBoost = false,
  onChange,
  allowedModes = OPTIMIZER_COLUMN_MODE_OPTIONS.map((option) => option.value),
  className,
}: OptimizerModeChipProps) {
  const [open, setOpen] = useState(false);
  const isEmpty = mode === null;
  const label = isEmpty ? "Select" : AGGREGATE_MODE_LABELS[mode];

  const chipInner = (
    <>
      {!isEmpty ? (
        <ModeOptionIcon mode={mode} className="size-4" />
      ) : null}
      <span className={cn(isEmpty && "font-medium text-slate-400")}>{label}</span>
      {showBoost && mode === "ally" ? (
        <span
          className="ml-0.5 inline-flex h-3.5 shrink-0 items-center gap-1.5 border-l border-slate-200 pl-1.5"
          title="Boost"
          aria-label="Boost"
        >
          <Zap className="size-3.5 text-orange-300" />
        </span>
      ) : null}
      {selectable ? (
        <ChevronDown
          className="size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
      ) : null}
    </>
  );

  const chipClassName = cn(
    "inline-flex h-7 items-center gap-1.5 rounded-md px-2",
    "text-xs font-semibold shadow-none",
    // Mode (read-only aggregate) has no border; Budget/Bid keep the bordered pill.
    selectable
      ? "cursor-pointer border border-slate-200 bg-white text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      : "border-0 bg-transparent text-slate-900",
    className,
  );

  if (!selectable) {
    if (isEmpty) {
      return null;
    }
    return (
      <span className={chipClassName} title="Aggregate of Budget and Bid modes">
        {chipInner}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={chipClassName}
        aria-label={
          isEmpty
            ? "Select optimization mode"
            : `Change optimization mode, currently ${label}`
        }
      >
        {chipInner}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="!gap-0 w-80 p-1 shadow-lg"
      >
        <ul
          className="flex flex-col gap-0"
          role="listbox"
          aria-label="Optimization mode"
        >
          {OPTIMIZER_COLUMN_MODE_OPTIONS.filter((item) =>
            allowedModes.includes(item.value),
          ).map((item) => {
            const isSelected = item.value === mode;
            return (
              <li key={item.value} className="m-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                    "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
                    isSelected && "bg-slate-50",
                  )}
                >
                  <ModeOptionIcon mode={item.value} className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </span>
                      {item.value === "ally" ? (
                        <Badge className="border border-brand-200/60 bg-gradient-to-r from-brand-100 to-cyan-100 px-1.5 py-0 text-[10px] font-medium text-brand-700 hover:from-brand-100 hover:to-cyan-100">
                          Recommended
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  {isSelected ? (
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brand-600"
                      aria-hidden
                    />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
