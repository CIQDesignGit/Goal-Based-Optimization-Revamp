"use client";

import type { DayPartingDiff } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type DayPartingDiffViewProps = {
  diff: DayPartingDiff;
};

function ScheduleStrip({
  title,
  hours,
  label,
}: {
  title: string;
  hours: number[];
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex gap-px overflow-hidden rounded-md ring-1 ring-border">
        {hours.map((mult, hour) => (
          <div
            key={hour}
            title={`${hour}:00 — ${mult === 0 ? "off" : `${mult}×`}`}
            className={cn(
              "h-6 flex-1",
              mult === 0 && "bg-slate-100",
              mult > 0 && mult < 1.2 && "bg-brand-200",
              mult >= 1.2 && mult < 1.4 && "bg-brand-400",
              mult >= 1.4 && "bg-brand-600",
            )}
          />
        ))}
      </div>
      <div className="flex justify-between text-2xs text-muted-foreground">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>12a</span>
      </div>
    </div>
  );
}

/** Full before/after schedule — not a scalar value diff. */
export function DayPartingDiffView({ diff }: DayPartingDiffViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {diff.before ? (
        <ScheduleStrip
          title="Before"
          hours={diff.before.hours}
          label={diff.before.label}
        />
      ) : (
        <p className="text-xs text-muted-foreground">No prior schedule</p>
      )}
      {diff.after ? (
        <ScheduleStrip
          title="After"
          hours={diff.after.hours}
          label={diff.after.label}
        />
      ) : (
        <p className="text-xs text-muted-foreground">Schedule removed</p>
      )}
    </div>
  );
}
