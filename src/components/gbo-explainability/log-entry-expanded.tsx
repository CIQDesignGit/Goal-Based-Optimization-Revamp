"use client";

import { ActionDetailPanel } from "@/components/gbo-explainability/action-detail-panel";
import type { ActionLogRow, LogEntry } from "@/lib/gbo-explainability/types";

type LogEntryExpandedProps = {
  entry: LogEntry;
  row?: ActionLogRow;
  isRetrying: boolean;
  onRetry: () => void;
};

/** Inline expansion — same simple fields as the side panel. */
export function LogEntryExpanded({
  entry,
  row,
  isRetrying,
  onRetry,
}: LogEntryExpandedProps) {
  return (
    <div className="border-t border-border bg-slate-50/40 px-3 py-4 sm:px-4">
      <ActionDetailPanel
        row={row}
        entry={row ? undefined : entry}
        isRetrying={isRetrying}
        onRetry={onRetry}
      />
    </div>
  );
}
