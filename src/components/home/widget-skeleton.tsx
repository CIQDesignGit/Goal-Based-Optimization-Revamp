"use client";

import { cn } from "@/lib/utils";

/** Lightweight pulse placeholder — each widget loads on its own timer. */
export function WidgetSkeleton({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-4",
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 rounded bg-slate-100",
            i === rows - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}
