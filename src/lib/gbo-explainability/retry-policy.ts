import type { LogEntry } from "./types";

export type RetryDecision =
  | { ok: true }
  | { ok: false; reason: string };

/** Whether Retry should be enabled (pre-validation + cooldown + permission). */
export function canAttemptRetry(
  entry: LogEntry,
  opts: { hasEditAccess: boolean; now?: Date } = { hasEditAccess: true },
): RetryDecision {
  if (!opts.hasEditAccess) {
    return { ok: false, reason: "You need edit access to retry." };
  }
  if (entry.status !== "failure" && entry.status !== "partial") {
    return { ok: false, reason: "Only failed or partial actions can be retried." };
  }
  if (entry.canRetry === false) {
    return {
      ok: false,
      reason: entry.retryBlockedReason ?? "Retry is not available for this entry.",
    };
  }
  if (entry.retryCooldownUntil) {
    const now = opts.now ?? new Date();
    if (now < new Date(entry.retryCooldownUntil)) {
      return {
        ok: false,
        reason: `Retry available after cooldown (${new Date(entry.retryCooldownUntil).toLocaleTimeString()}).`,
      };
    }
  }
  if ((entry.retryAttempt ?? 0) >= 5) {
    return { ok: false, reason: "Retry limit reached (5 attempts)." };
  }
  // Deterministic business-rule failures should not re-fire
  if (
    entry.failure?.category === "business-rule" &&
    entry.failure.code === "BID_BELOW_MIN"
  ) {
    return {
      ok: false,
      reason: entry.failure.message,
    };
  }
  return { ok: true };
}

/** Simulate a retry outcome and build the new immutable log entry. */
export function buildRetryResult(
  original: LogEntry,
  actorLabel: string,
  actorEmail: string,
): { updatedOriginal: LogEntry; newEntry: LogEntry } {
  const failedCount =
    original.batch?.failed ?? (original.status === "failure" ? 1 : 0);
  const retried = Math.max(failedCount, 1);
  const stillFailed = Math.min(1, retried); // demo: leave 1 failure if batch
  const applied = retried - stillFailed;

  const updatedOriginal: LogEntry = {
    ...original,
    status: stillFailed > 0 ? "partial" : "success",
    retryAttempt: (original.retryAttempt ?? 0) + 1,
    retryOutcomeLabel:
      stillFailed > 0
        ? `${retried} retried — ${applied} applied, ${stillFailed} failed`
        : `${retried} retried — all applied`,
    canRetry: stillFailed > 0,
    batch: original.batch
      ? {
          ...original.batch,
          succeeded: original.batch.succeeded + applied,
          failed: stillFailed,
        }
      : undefined,
  };

  const newEntry: LogEntry = {
    id: `retry-${original.id}-${Date.now()}`,
    tab: original.tab,
    timestamp: new Date().toISOString(),
    actor: {
      kind: "human",
      label: actorLabel,
      email: actorEmail,
    },
    status: stillFailed > 0 ? "partial" : "success",
    actionType: original.actionType,
    automationType: original.automationType,
    claim:
      stillFailed > 0
        ? `Retry of failed actions — ${applied} of ${retried} applied`
        : `Retry succeeded — ${retried} action(s) applied`,
    reason: `Manual retry of ${original.id}`,
    impact: stillFailed > 0 ? "Impact pending" : original.impact,
    summarySource: "human",
    entityName: original.entityName,
    entityId: original.entityId,
    scopeLevel: original.scopeLevel,
    retryOfId: original.id,
    retryAttempt: updatedOriginal.retryAttempt,
    batch: original.batch
      ? {
          total: retried,
          succeeded: applied,
          failed: stillFailed,
        }
      : undefined,
  };

  return { updatedOriginal, newEntry };
}
