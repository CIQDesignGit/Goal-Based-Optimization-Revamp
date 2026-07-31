"use client";

import {
  conflictLabel,
  failureLabel,
  highDeviationLabel,
} from "@/lib/gbo-explainability/alert-signals";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertSignalTagsProps = {
  alert: Pick<
    AlertSummary,
    "conflictCount" | "highDeviationCount" | "failureCount"
  >;
  className?: string;
};

type SignalTone = "failure" | "conflict" | "deviation";

const SIGNAL_TONE_STYLES: Record<
  SignalTone,
  {
    container: string;
    count: string;
    label: string;
  }
> = {
  failure: {
    container: "bg-error-50 ring-1 ring-error-100/80",
    count: "bg-error-200 text-error-800",
    label: "text-error-700",
  },
  conflict: {
    container: "bg-amber-50 ring-1 ring-amber-100/80",
    count: "bg-amber-200 text-amber-900",
    label: "text-amber-800",
  },
  deviation: {
    container: "bg-violet-50 ring-1 ring-violet-100/80",
    count: "bg-violet-200 text-violet-900",
    label: "text-violet-800",
  },
};

type SignalTagProps = {
  tone: SignalTone;
  count: number;
  label: string;
  title: string;
};

/** Compact signal chip — label and count pill. */
function SignalTag({ tone, count, label, title }: SignalTagProps) {
  const styles = SIGNAL_TONE_STYLES[tone];

  return (
    <span
      title={title}
      aria-label={`${count} ${label}`}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5",
        styles.container,
      )}
    >
      <span
        className={cn("text-xs leading-none font-medium", styles.label)}
        aria-hidden
      >
        {label}
      </span>
      <span
        className={cn(
          "inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tabular-nums",
          styles.count,
        )}
        aria-hidden
      >
        {count}
      </span>
    </span>
  );
}

/** Secondary signal chips — failures, conflicts, and high-deviation changes. */
export function AlertSignalTags({ alert, className }: AlertSignalTagsProps) {
  if (
    alert.failureCount === 0 &&
    alert.conflictCount === 0 &&
    alert.highDeviationCount === 0
  ) {
    return null;
  }

  return (
    <div className={cn("flex shrink-0 flex-wrap items-center gap-1.5", className)}>
      {alert.failureCount > 0 ? (
        <SignalTag
          tone="failure"
          count={alert.failureCount}
          label={failureLabel(alert.failureCount)}
          title="One or more actions in this group did not complete successfully"
        />
      ) : null}
      {alert.conflictCount > 0 ? (
        <SignalTag
          tone="conflict"
          count={alert.conflictCount}
          label={conflictLabel(alert.conflictCount)}
          title="A later action overrode an earlier change on the same entity"
        />
      ) : null}
      {alert.highDeviationCount > 0 ? (
        <SignalTag
          tone="deviation"
          count={alert.highDeviationCount}
          label={highDeviationLabel(alert.highDeviationCount)}
          title="Field values changed by more than 12.5% from their prior value"
        />
      ) : null}
    </div>
  );
}
