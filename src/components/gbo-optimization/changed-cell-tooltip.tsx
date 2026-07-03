"use client";

import type { ReactElement, ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CellVisualState = "historic" | "edited" | "adjusted";

type ChangedCellTooltipProps = {
  children: ReactElement;
  visual: CellVisualState;
  from: string;
  to: string;
  historicHint?: string;
};

function formatDiffValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

function buildTooltipContent({
  visual,
  from,
  to,
  historicHint,
}: Omit<ChangedCellTooltipProps, "children">): ReactNode {
  if (visual === "historic" && historicHint) {
    return historicHint;
  }

  if (visual === "adjusted") {
    return (
      <span>
        Auto-adjusted from{" "}
        <span className="font-medium">{formatDiffValue(from)}</span> to{" "}
        <span className="font-medium">{formatDiffValue(to)}</span>
      </span>
    );
  }

  if (visual === "edited") {
    return (
      <span>
        Changed from{" "}
        <span className="font-medium">{formatDiffValue(from)}</span> to{" "}
        <span className="font-medium">{formatDiffValue(to)}</span>
      </span>
    );
  }

  return null;
}

/** Hover diff for edited cells — preserves styling via persisted flags in the store. */
export function ChangedCellTooltip({
  children,
  visual,
  from,
  to,
  historicHint,
}: ChangedCellTooltipProps) {
  const content = buildTooltipContent({ visual, from, to, historicHint });

  if (!content) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="block w-full min-w-0">{children}</span>
        }
      />
      <TooltipContent className="max-w-xs text-left leading-snug">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
