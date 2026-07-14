"use client";

import { Layers, Search } from "lucide-react";

import { cn } from "@/lib/utils";

type RuleBasedStrategyStackProps = {
  /** Rule names for this cell — first is shown on the front card. */
  rules: readonly string[];
  /** Opens the Rule Based strategy side panel. */
  onOpen?: () => void;
  className?: string;
};

/**
 * Stacked rule chips under the Rule Based mode chip.
 * L-shaped tree line connects from the mode chip down into the stack.
 * Click the front card to open the strategy side panel.
 */
export function RuleBasedStrategyStack({
  rules,
  onOpen,
  className,
}: RuleBasedStrategyStackProps) {
  if (rules.length === 0) {
    return null;
  }

  const topLabel = rules[0];
  // Show up to 2 peeking layers behind the front card (product pattern).
  const peekCount = Math.min(rules.length - 1, 2);

  return (
    <div
      className={cn("relative mt-0.5 min-w-0 pl-3", className)}
      aria-label={`${rules.length} rule${rules.length === 1 ? "" : "s"}: ${rules.join(", ")}`}
    >
      {/* L-shaped connector: down from mode chip, then right into the stack */}
      <span
        className="pointer-events-none absolute top-0 left-[7px] h-[18px] w-px bg-slate-300"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-[18px] left-[7px] h-px w-2.5 bg-slate-300"
        aria-hidden
      />

      {/* Front card sits after the elbow; peeks stick out below for the stack look */}
      <div
        className={cn(
          "relative pt-[14px]",
          peekCount > 0 ? "pb-1.5" : "pb-0",
        )}
      >
        {peekCount >= 2 ? (
          <div
            className="absolute top-[18px] right-1.5 left-1.5 h-7 rounded-md border border-slate-200 bg-slate-50"
            aria-hidden
          />
        ) : null}
        {peekCount >= 1 ? (
          <div
            className="absolute top-[16px] right-0.5 left-0.5 h-7 rounded-md border border-slate-200 bg-white"
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          title={rules.join(" · ")}
          aria-label={`Open rules for ${topLabel}`}
          className={cn(
            "relative inline-flex h-7 max-w-full min-w-0 items-center gap-1.5",
            "rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600",
            "shadow-none transition-colors",
            "hover:border-blue-300 hover:bg-blue-50/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
            onOpen ? "cursor-pointer" : "cursor-default",
          )}
        >
          <Layers className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <Search className="size-3 shrink-0 text-slate-400" aria-hidden />
          <span className="min-w-0 truncate font-normal">{topLabel}</span>
        </button>
      </div>
    </div>
  );
}
