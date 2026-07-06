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
};

/** Stable render target so table inputs are not remounted when tooltip state toggles. */
const TOOLTIP_CELL_TRIGGER = (
  <span className="block w-full min-w-0 overflow-visible" />
);

export function formatCellDiffValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

function normalizeDiffToken(value: string): string {
  return value.replace(/[$,]/g, "").trim();
}

function cellValuesDiffer(from: string, to: string): boolean {
  const normalizedFrom = normalizeDiffToken(from);
  const normalizedTo = normalizeDiffToken(to);

  if (!normalizedFrom && !normalizedTo) {
    return false;
  }

  return normalizedFrom !== normalizedTo;
}

function formatDiffValue(value: string): string {
  return formatCellDiffValue(value);
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
  const showTooltip = Boolean(content) && cellValuesDiffer(from, to);

  return (
    <Tooltip disabled={!showTooltip}>
      <TooltipTrigger render={TOOLTIP_CELL_TRIGGER}>{children}</TooltipTrigger>
      {showTooltip ? (
        <TooltipContent className="max-w-xs text-left leading-snug">
          {content}
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}
