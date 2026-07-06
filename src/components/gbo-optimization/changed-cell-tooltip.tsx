"use client";

import type { ReactElement, ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CellVisualState = "historic" | "edited" | "adjusted";

type ChangedCellTooltipProps = {
  children: ReactElement;
  visual: CellVisualState;
  from: string;
  to: string;
};

/** Stable render target so table inputs are not remounted when tooltip state toggles. */
const TOOLTIP_CELL_TRIGGER = <span className="block w-full min-w-0" />;

function formatDiffValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

function buildTooltipContent({
  visual,
  from,
  to,
}: Omit<ChangedCellTooltipProps, "children">): ReactNode | null {
  if (visual === "historic") {
    return null;
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

/** Hover diff for edited or auto-adjusted cells only (FR-013). */
export function ChangedCellTooltip({
  children,
  visual,
  from,
  to,
}: ChangedCellTooltipProps) {
  const content = buildTooltipContent({ visual, from, to });

  return (
    <TooltipProvider delay={500}>
      <Tooltip disabled={!content}>
        <TooltipTrigger render={TOOLTIP_CELL_TRIGGER}>{children}</TooltipTrigger>
        {content ? (
          <TooltipContent className="max-w-xs text-left leading-snug">
            {content}
          </TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  );
}
