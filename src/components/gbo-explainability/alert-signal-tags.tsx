"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, AlertCircle, GitCompare } from "lucide-react";

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
    icon: LucideIcon;
    iconClass: string;
  }
> = {
  failure: {
    icon: AlertCircle,
    iconClass: "text-error-600",
  },
  conflict: {
    icon: GitCompare,
    iconClass: "text-amber-600",
  },
  deviation: {
    icon: Activity,
    iconClass: "text-sky-600",
  },
};

const SIGNAL_COUNT = "text-[10px] font-semibold leading-none tabular-nums text-slate-700";

type SignalTagProps = {
  tone: SignalTone;
  count: number;
  label: string;
  title: string;
  targetSectionId: string;
  onNavigate?: (targetSectionId: string) => void;
};

/** Compact signal chip — slate shell, colored icon + count badge. */
function SignalTag({
  tone,
  count,
  label,
  title,
  targetSectionId,
  onNavigate,
}: SignalTagProps) {
  const styles = SIGNAL_TONE_STYLES[tone];
  const Icon = styles.icon;

  const className = cn(
    "inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-1.5 py-1",
    onNavigate &&
      "cursor-pointer transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
  );

  const content = (
    <>
      <Icon
        className={cn("size-3 shrink-0", styles.iconClass)}
        aria-hidden
      />
      <span
        className="text-xs leading-none text-slate-600"
        aria-hidden
      >
        {label}
      </span>
      <span className={cn("inline-flex shrink-0 font-semibold", SIGNAL_COUNT)} aria-hidden>
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
