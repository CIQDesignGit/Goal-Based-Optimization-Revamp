/**
 * Deterministic “AI” Performance Overview from instance fields only.
 * Missing metrics are omitted — never invented.
 */

import {
  formatUsd,
  formatUsdExact,
  sumActualMtd,
  sumPlannedMtd,
  type PacingInstance,
} from "@/lib/home/pacing-instance";
import {
  formatPacingPercent,
  getPacingBandStatus,
  pacingStatusLabel,
  ratioToPercent,
} from "@/lib/home/pacing-status";

export type ExecutiveSummaryResult = {
  /** Numbered insight bullets for the Performance Overview card (max 3). */
  bullets: string[];
  /** Numbered AI recommended actions (from instance recommendations). */
  recommendations: string[];
  disclaimer: string;
  generatedAt: string;
  generatedAtDate: Date;
  /** True when we used a short fallback (e.g. simulated LLM down). */
  isFallback: boolean;
};

const DISCLAIMER = "AI-generated — verify in your instance";
const MAX_BULLETS = 3;

/** Build summary copy strictly from instance data. */
export function buildExecutiveSummary(
  instance: PacingInstance,
  options?: { forceFallback?: boolean; generatedAt?: Date },
): ExecutiveSummaryResult {
  const generatedAtDate = options?.generatedAt ?? new Date();
  const generatedAt = formatGeneratedAt(generatedAtDate);

  if (options?.forceFallback) {
    return {
      bullets: [
        "Summary temporarily unavailable. Showing a short status from cached instance metrics only.",
      ],
      recommendations: [],
      disclaimer: DISCLAIMER,
      generatedAt,
      generatedAtDate,
      isFallback: true,
    };
  }

  const bullets: string[] = [];
  const plannedMtd = sumPlannedMtd(instance.rows);
  const actualMtd = sumActualMtd(instance.rows);
  const pacingPct = ratioToPercent(actualMtd, plannedMtd);

  if (pacingPct !== null) {
    const status = getPacingBandStatus(pacingPct);
    bullets.push(
      `Account pacing MTD is ${formatPacingPercent(pacingPct)} (${pacingStatusLabel(status)}) — actual spend ${formatUsd(actualMtd)} vs planned MTD ${formatUsd(plannedMtd)}.`,
    );
  }

  // Top under-pacer among leaf rows (omit if none).
  const leaf = instance.rows.filter((r) => !r.isRollup);
  let worst: {
    label: string;
    pct: number;
    actual: number;
    planned: number;
  } | null = null;
  for (const row of leaf) {
    const pct = ratioToPercent(row.actualMtd, row.plannedMtd);
    if (pct === null) continue;
    if (!worst || pct < worst.pct) {
      worst = {
        label: `${row.level1} ${row.level2}`,
        pct,
        actual: row.actualMtd,
        planned: row.plannedMtd,
      };
    }
  }
  if (worst && worst.pct < 97) {
    bullets.push(
      `Largest under-pacing pocket: ${worst.label} at ${formatPacingPercent(worst.pct)} (${formatUsd(worst.actual)} / ${formatUsd(worst.planned)}).`,
    );
  }

  if (instance.plannedMonthlyBudget > 0) {
    const util = ratioToPercent(
      instance.projectedMonthEndSpend,
      instance.plannedMonthlyBudget,
    );
    if (util !== null) {
      const overUnder =
        instance.projectedMonthEndSpend - instance.plannedMonthlyBudget;
      const utilStatus = getPacingBandStatus(util);
      bullets.push(
        `Projected month-end utilisation is ${formatPacingPercent(util)} (${pacingStatusLabel(utilStatus)}) on a ${formatUsd(instance.plannedMonthlyBudget)} monthly plan (${overUnder >= 0 ? "+" : ""}${formatUsd(overUnder)} vs plan).`,
      );
    }
  }

  // Prefer driver / override as a later bullet only if we still have room.
  if (
    bullets.length < MAX_BULLETS &&
    instance.manualOverrideSpend > 0 &&
    instance.recommendedSpend > 0
  ) {
    bullets.push(
      `Manual overrides are contributing to spend pressure: ${formatUsdExact(instance.manualOverrideSpend)} manual vs ${formatUsdExact(instance.recommendedSpend)} Ally-recommended on sampled override days.`,
    );
  }

  if (
    bullets.length < MAX_BULLETS &&
    instance.projectedGoalValue !== null &&
    instance.plannedGoalValue !== null
  ) {
    bullets.push(
      `Projected ${instance.projectedGoalMetric} is ${instance.projectedGoalValue.toFixed(1)} vs planned ${instance.plannedGoalValue.toFixed(1)}.`,
    );
  }

  // Conflicting signal
  if (
    bullets.length < MAX_BULLETS &&
    pacingPct !== null &&
    getPacingBandStatus(pacingPct) === "on-plan" &&
    instance.projectedGoalValue !== null &&
    instance.plannedGoalValue !== null &&
    instance.projectedGoalValue < instance.plannedGoalValue
  ) {
    bullets.push(
      `Spend is On Plan, but projected ${instance.projectedGoalMetric} (${instance.projectedGoalValue.toFixed(1)}) is below the planned ${instance.plannedGoalValue.toFixed(1)} — efficiency and pacing are pulling in different directions.`,
    );
  }

  const recommendations = buildRecommendations(instance);
  const trimmed = bullets.slice(0, MAX_BULLETS);

  if (trimmed.length === 0) {
    return {
      bullets: [
        "Not enough instance metrics are available to summarize pacing for this selection.",
      ],
      recommendations: [],
      disclaimer: DISCLAIMER,
      generatedAt,
      generatedAtDate,
      isFallback: true,
    };
  }

  return {
    bullets: trimmed,
    recommendations,
    disclaimer: DISCLAIMER,
    generatedAt,
    generatedAtDate,
    isFallback: false,
  };
}

export function formatRelativeAgo(from: Date, now = new Date()): string {
  const mins = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatGeneratedAt(date: Date): string {
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${time} today`;
}

function buildRecommendations(instance: PacingInstance): string[] {
  if (instance.recommendations.length > 0) {
    return instance.recommendations.map((r) => r.summaryLine);
  }

  const constraint = instance.constraints[0];
  if (constraint) {
    return [
      `Relax ${constraint.level1} ${constraint.constraintType} from ${constraint.constraintPercent}% → match ~${constraint.spendSharePercent}% spend share.`,
    ];
  }

  return [];
}
