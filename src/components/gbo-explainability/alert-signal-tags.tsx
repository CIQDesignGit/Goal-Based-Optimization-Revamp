"use client";

import {
  conflictLabel,
  failureLabel,
  highDeviationLabel,
} from "@/lib/gbo-explainability/alert-signals";
import { alertSectionId } from "@/lib/gbo-explainability/explainability-typography";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertSignalTagsProps = {
  alert: Pick<
    AlertSummary,
    "id" | "conflictCount" | "highDeviationCount" | "failureCount" | "role"
  >;
  className?: string;
  /** When set, tags scroll to the matching expanded detail section. */
  onSignalNavigate?: (targetSectionId: string) => void;
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
    container: "bg-sky-50 ring-1 ring-sky-100/80",
    count: "bg-sky-200 text-sky-900",
    label: "text-sky-800",
  },
};

type SignalTagProps = {
  tone: SignalTone;
  count: number;
  label: string;
  title: string;
  targetSectionId: string;
  onNavigate?: (targetSectionId: string) => void;
};

/** Compact signal chip — label and count pill. */
function SignalTag({
  tone,
  count,
  label,
  title,
  targetSectionId,
  onNavigate,
}: SignalTagProps) {
  const styles = SIGNAL_TONE_STYLES[tone];
  const className = cn(
    "inline-flex h-6 items-center gap-1.5 rounded-full pl-2.5 pr-1.5",
    styles.container,
    onNavigate &&
      "cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
  );

  const content = (
    <>
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
    </>
  );

  if (onNavigate) {
    return (
      <button
        type="button"
        title={`${title} — jump to details`}
        aria-label={`${count} ${label}. Jump to details.`}
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          onNavigate(targetSectionId);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <span title={title} aria-label={`${count} ${label}`} className={className}>
      {content}
    </span>
  );
}

function failureTargetId(alert: AlertSignalTagsProps["alert"]): string {
  return alert.role === "human"
    ? alertSectionId(alert.id, "manual")
    : alertSectionId(alert.id, "summary");
}

/** Secondary signal chips — failures, conflicts, and high-deviation changes. */
export function AlertSignalTags({
  alert,
  className,
  onSignalNavigate,
}: AlertSignalTagsProps) {
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
          targetSectionId={failureTargetId(alert)}
          onNavigate={onSignalNavigate}
        />
      ) : null}
      {alert.conflictCount > 0 ? (
        <SignalTag
          tone="conflict"
          count={alert.conflictCount}
          label={conflictLabel(alert.conflictCount)}
          title="A later action overrode an earlier change on the same entity"
          targetSectionId={alertSectionId(alert.id, "overrides")}
          onNavigate={onSignalNavigate}
        />
      ) : null}
      {alert.highDeviationCount > 0 ? (
        <SignalTag
          tone="deviation"
          count={alert.highDeviationCount}
          label={highDeviationLabel(alert.highDeviationCount)}
          title="Field values changed by more than 12.5% from their prior value"
          targetSectionId={alertSectionId(alert.id, "deviations")}
          onNavigate={onSignalNavigate}
        />
      ) : null}
    </div>
  );
}
