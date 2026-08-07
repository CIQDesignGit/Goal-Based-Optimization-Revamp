import type {
  AlertConflictDetail,
  AlertDeviationDetail,
  ConflictDetail,
  LogEntry,
  ValueDiff,
} from "./types";

/** Values changing more than this fraction vs. original count as high deviation. */
export const HIGH_DEVIATION_THRESHOLD = 0.125;

const OVERRIDE_ACTORS = ["Rule Based", "Ally AI", "Manual"] as const;

const SYNTHETIC_MANUAL_NAMES = [
  "Marcus Webb",
  "Emily Carter",
  "Priyal Jain",
  "Jordan Lee",
] as const;

function isManualActor(actorType: string): boolean {
  return actorType.toLowerCase().includes("manual");
}

function conflictActorFields(
  actorType: string,
  entry: LogEntry,
  index: number,
): { actorType: string; actorName?: string } {
  if (isManualActor(actorType)) {
    const name =
      entry.actor.kind === "human"
        ? entry.actor.label
        : SYNTHETIC_MANUAL_NAMES[index % SYNTHETIC_MANUAL_NAMES.length];
    return { actorType: "Manual", actorName: name };
  }

  return { actorType };
}

function winnerActorForSyntheticConflict(
  entry: LogEntry,
  index: number,
): { actorType: string; actorName?: string } {
  const candidates = ["Ally AI", "Manual", "Rule Based"] as const;
  const winner = candidates[(index + 1) % candidates.length];

  if (winner === "Manual") {
    return conflictActorFields("Manual", entry, index + 1);
  }

  if (winner === "Ally AI" && entry.actor.kind === "ally-ai") {
    return { actorType: entry.actor.label };
  }

  if (winner === "Rule Based" && entry.actor.kind === "rule-based") {
    return { actorType: entry.actor.label };
  }

  return { actorType: winner };
}

export function parseNumeric(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function percentChangeFromDiff(diff: ValueDiff): number | null {
  const before = parseNumeric(diff.before);
  const after = parseNumeric(diff.after);
  if (before === null || after === null || before === 0) return null;
  return Math.abs((after - before) / before);
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

export function conflictLabel(_count: number): string {
  return "Conflicts";
}

export function highDeviationLabel(count: number): string {
  return count === 1 ? "High deviation" : "High deviations";
}

export function failureLabel(count: number): string {
  return count === 1 ? "Failed action" : "Failed actions";
}

export function formatConflictTag(count: number): string {
  return `${count} ${conflictLabel(count)}`;
}

export function formatHighDeviationTag(count: number): string {
  return `${count} ${highDeviationLabel(count)}`;
}

export function formatFailureTag(count: number): string {
  return `${count} ${failureLabel(count)}`;
}

function syntheticConflictDetail(
  entry: LogEntry,
  index: number,
): ConflictDetail {
  const overriddenActor = OVERRIDE_ACTORS[index % OVERRIDE_ACTORS.length];
  const timestamp = new Date(entry.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const childSources =
    entry.children?.filter((child) => (child.diffs?.length ?? 0) > 0) ?? [];
  const child = childSources[index % Math.max(childSources.length, 1)];
  const allDiffs = diffsFromEntry(entry);
  const diff = child?.diffs?.[0] ?? allDiffs[index] ?? allDiffs[0];
  const field = diff?.field ?? "Setting";
  const before = diff?.before ?? null;
  const after = diff?.after ?? null;
  const changeLine =
    before && after ? `${before} → ${after}` : (entry.claim ?? entry.entityName);
  const previousActor = conflictActorFields(overriddenActor, entry, index);
  const currentActor = winnerActorForSyntheticConflict(entry, index);

  return {
    entityName: child?.entityName ?? entry.entityName,
    field,
    overriddenActor,
    timeSinceOverride: "earlier today",
    otherChange: {
      ...previousActor,
      before,
      after,
      change: changeLine,
      timestamp,
      summary: entry.reason,
    },
    inEffectNow: {
      ...currentActor,
      before,
      after,
      change: changeLine,
      timestamp,
      summary: `Superseded the ${overriddenActor} action on ${entry.entityName}.`,
    },
  };
}

/** Flatten explicit or synthetic conflict records for an entry. */
export function extractConflictDetailsFromEntry(
  entry: LogEntry,
): AlertConflictDetail[] {
  if (entry.conflictDetails?.length) {
    return entry.conflictDetails.map((detail, index) => ({
      id: `${entry.id}-conflict-${index}`,
      ...detail,
    }));
  }

  const count = entry.conflictCount ?? 0;
  return Array.from({ length: count }, (_, index) => ({
    id: `${entry.id}-conflict-${index}`,
    ...syntheticConflictDetail(entry, index),
  }));
}

type DeviationCandidate = {
  entry: LogEntry;
  childId?: string;
  diff: ValueDiff;
};

function deviationCandidatesFromEntry(entry: LogEntry): DeviationCandidate[] {
  const own =
    entry.diffs?.map((diff) => ({ entry, diff })) ??
    ([] as DeviationCandidate[]);
  const fromChildren =
    entry.children?.flatMap((child) =>
      (child.diffs ?? []).map((diff) => ({
        entry,
        childId: child.id,
        diff,
      })),
    ) ?? [];

  return [...own, ...fromChildren];
}

/** Collect high-deviation field changes with entity context. */
export function extractDeviationDetailsFromEntry(
  entry: LogEntry,
): AlertDeviationDetail[] {
  const results: AlertDeviationDetail[] = [];

  for (const { entry: sourceEntry, childId, diff } of deviationCandidatesFromEntry(
    entry,
  )) {
    if (!isHighDeviationDiff(diff)) continue;

    const pct = percentChangeFromDiff(diff);
    if (pct === null) continue;

    const child = childId
      ? sourceEntry.children?.find((item) => item.id === childId)
      : undefined;

    results.push({
      id: `${sourceEntry.id}-${childId ?? "root"}-${diff.field}`,
      entityName: child?.entityName ?? sourceEntry.entityName,
      field: diff.field,
      before: diff.before ?? "—",
      after: diff.after ?? "—",
      percentChange: pct,
    });
  }

  return results;
}

export function extractAlertConflictDetails(
  entries: LogEntry[],
): AlertConflictDetail[] {
  return entries.flatMap(extractConflictDetailsFromEntry);
}

export function extractAlertDeviationDetails(
  entries: LogEntry[],
): AlertDeviationDetail[] {
  return entries.flatMap(extractDeviationDetailsFromEntry);
}
