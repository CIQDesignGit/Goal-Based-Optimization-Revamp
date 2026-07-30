"use client";

import { AlertCircle, ArrowLeftRight, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatConflictTag,
  formatFailureTag,
  formatHighDeviationTag,
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
        <Badge
          variant="outline"
          className="gap-1 border-error-200 bg-error-50 font-normal text-error-800"
          title="One or more actions in this group did not complete successfully"
        >
          <AlertCircle className="size-3 shrink-0" aria-hidden />
          {formatFailureTag(alert.failureCount)}
        </Badge>
      ) : null}
      {alert.conflictCount > 0 ? (
        <Badge
          variant="outline"
          className="gap-1 border-amber-200 bg-amber-50 font-normal text-amber-800"
          title="A later action overrode an earlier change on the same entity"
        >
          <ArrowLeftRight className="size-3 shrink-0" aria-hidden />
          {formatConflictTag(alert.conflictCount)}
        </Badge>
      ) : null}
      {alert.highDeviationCount > 0 ? (
        <Badge
          variant="outline"
          className="gap-1 border-violet-200 bg-violet-50 font-normal text-violet-800"
          title="Field values changed by more than 12.5% from their prior value"
        >
          <TrendingUp className="size-3 shrink-0" aria-hidden />
          {formatHighDeviationTag(alert.highDeviationCount)}
        </Badge>
      ) : null}
    </div>
  );
}
