import type { LogActionDetail, LogEntry, ValueDiff } from "./types";

/** Values changing more than this fraction vs. original count as high deviation. */
export const HIGH_DEVIATION_THRESHOLD = 0.125;

function parseNumeric(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function isHighDeviationDiff(diff: ValueDiff): boolean {
  const before = parseNumeric(diff.before);
  const after = parseNumeric(diff.after);
  if (before === null || after === null || before === 0) return false;
  return (
    Math.abs((after - before) / before) >= HIGH_DEVIATION_THRESHOLD
  );
}

function diffsFromEntry(entry: LogEntry): ValueDiff[] {
  const own = entry.diffs ?? [];
  const fromChildren =
    entry.children?.flatMap((child) => child.diffs ?? []) ?? [];
  return [...own, ...fromChildren];
}

/** Count field changes that exceeded the high-deviation threshold. */
export function countHighDeviationsInEntry(entry: LogEntry): number {
  return diffsFromEntry(entry).filter(isHighDeviationDiff).length;
}

/** Explicit conflicts recorded on the entry (e.g. overridden by another actor). */
export function countConflictsInEntry(entry: LogEntry): number {
  return entry.conflictCount ?? 0;
}

export function countSignalsInEntries(entries: LogEntry[]): {
  conflictCount: number;
  highDeviationCount: number;
} {
  let conflictCount = 0;
  let highDeviationCount = 0;

  for (const entry of entries) {
    conflictCount += countConflictsInEntry(entry);
    highDeviationCount += countHighDeviationsInEntry(entry);
  }

  return { conflictCount, highDeviationCount };
}

export type AlertSignalCounts = {
  conflictCount: number;
  highDeviationCount: number;
};

export function formatConflictTag(count: number): string {
  return `${count} conflict${count === 1 ? "" : "s"}`;
}

export function formatHighDeviationTag(count: number): string {
  return `${count} high deviation${count === 1 ? "" : "s"}`;
}
