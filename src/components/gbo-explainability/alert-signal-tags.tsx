"use client";

import { ArrowLeftRight, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatConflictTag,
  formatHighDeviationTag,
} from "@/lib/gbo-explainability/alert-signals";
import type { AlertSummary } from "@/lib/gbo-explainability/types";

type AlertSignalTagsProps = {
  alert: Pick<AlertSummary, "conflictCount" | "highDeviationCount">;
};

/** Secondary signal chips — conflicts and high-deviation changes on a daily alert card. */
export function AlertSignalTags({ alert }: AlertSignalTagsProps) {
  if (alert.conflictCount === 0 && alert.highDeviationCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
