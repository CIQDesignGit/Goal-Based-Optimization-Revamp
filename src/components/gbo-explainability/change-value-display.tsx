import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ChangeValueDisplayProps = {
  before: string | null;
  after: string | null;
  className?: string;
  size?: "sm" | "md";
};

/** Shared before → after value chips used across Manual, Overrides, and Deviations. */
export function ChangeValueDisplay({
  before,
  after,
  className,
  size = "sm",
}: ChangeValueDisplayProps) {
  const textSize = size === "sm" ? "text-xs sm:text-sm" : "text-sm";

  if (before && after && before !== after) {
    return (
      <span
        className={cn(
          "inline-flex min-w-0 flex-wrap items-center gap-1.5",
          textSize,
          className,
        )}
      >
        <span className="font-mono text-muted-foreground line-through decoration-slate-300">
          {before}
        </span>
        <ArrowRight className="size-3 shrink-0 text-slate-400" aria-hidden />
        <span className="rounded bg-brand-50 px-1 py-px font-mono font-medium text-brand-800">
          {after}
        </span>
      </span>
    );
  }

  if (after) {
    return (
      <span
        className={cn(
          "rounded bg-brand-50 px-1 py-px font-mono font-medium text-brand-800",
          textSize,
          className,
        )}
      >
        {after}
      </span>
    );
  }

  if (before) {
    return (
      <span
        className={cn(
          "font-mono text-muted-foreground line-through decoration-slate-300",
          textSize,
          className,
        )}
      >
        {before}
      </span>
    );
  }

  return null;
}
