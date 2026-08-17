/**
 * Metrics for the Projected spend & utilisation Executive Summary widget.
 * Numbers come from the shared pacing instance (same source as other widgets).
 */

import {
  formatUsd,
  sumActualMtd,
  sumPlannedMtd,
  type PacingInstance,
} from "@/lib/home/pacing-instance";
import {
  formatPacingPercent,
  getPacingBandStatus,
  pacingStatusLabel,
  ratioToPercent,
  type PacingBandStatus,
} from "@/lib/home/pacing-status";

/** Target utilisation (100% of plan) — always on the scale. */
export const UTILISATION_TARGET_PCT = 100;

export type SpendUtilisationLeg = {
  /** Short label (e.g. "Current MTD"). */
  periodLabel: string;
  spend: number;
  spendLabel: string;
  utilisationPct: number | null;
  utilisationLabel: string;
  status: PacingBandStatus | null;
  statusLabel: string;
  varianceCopy: string;
  plannedBudget: number;
  plannedBudgetLabel: string;
  hasPlan: boolean;
};

export type SpendUtilisationComparison = {
  current: SpendUtilisationLeg;
  projected: SpendUtilisationLeg;
};

/** Build current (MTD) and projected month-end spend / utilisation together. */
export function buildSpendUtilisationComparison(
  instance: PacingInstance,
): SpendUtilisationComparison {
  return {
    current: finalizeLeg({
      periodLabel: "Current MTD",
      spend: sumActualMtd(instance.rows),
      planned: sumPlannedMtd(instance.rows),
      plannedPhrase: "MTD plan",
    }),
    projected: finalizeLeg({
      periodLabel: "Projected month-end",
      spend: instance.projectedMonthEndSpend,
      planned: instance.plannedMonthlyBudget,
      plannedPhrase: "budget",
    }),
  };
}

function finalizeLeg({
  periodLabel,
  spend,
  planned,
  plannedPhrase,
}: {
  periodLabel: string;
  spend: number;
  planned: number;
  plannedPhrase: string;
}): SpendUtilisationLeg {
  const hasPlan = planned > 0;
  const utilisationPct = hasPlan ? ratioToPercent(spend, planned) : null;
  const status =
    utilisationPct === null ? null : getPacingBandStatus(utilisationPct);
  const delta = spend - planned;
  const deltaPct =
    hasPlan && utilisationPct !== null ? utilisationPct - 100 : null;

  return {
    periodLabel,
    spend,
    spendLabel: formatUsd(spend),
    utilisationPct,
    utilisationLabel:
      utilisationPct === null ? "—" : formatPacingPercent(utilisationPct),
    status,
    statusLabel: status ? pacingStatusLabel(status) : "No plan set",
    varianceCopy: hasPlan
      ? buildVarianceCopy(delta, deltaPct, planned, plannedPhrase)
      : "No plan set — utilisation cannot be calculated.",
    plannedBudget: planned,
    plannedBudgetLabel: hasPlan ? formatUsd(planned) : "—",
    hasPlan,
  };
}

/** Plain-language over/under line — color is never the only signal. */
function buildVarianceCopy(
  delta: number,
  deltaPct: number | null,
  planned: number,
  plannedPhrase: string,
): string {
  const absDelta = formatUsd(Math.abs(delta));
  const pctPart =
    deltaPct === null ? "" : ` (${Math.abs(deltaPct).toFixed(0)}%)`;
  const direction = delta >= 0 ? "over" : "under";
  const sign = delta >= 0 ? "+" : "−";
  return `${sign}${absDelta}${pctPart} ${direction} the ${formatUsd(planned)} ${plannedPhrase}`;
}

/**
 * Bar domain: 0 → max(target 100%, projected, current).
 * Right edge of the track is always that max — no padding past it.
 */
export function utilisationBarScale(
  currentPct: number | null,
  projectedPct: number | null,
): { min: number; max: number } {
  const max = Math.max(
    UTILISATION_TARGET_PCT,
    projectedPct ?? 0,
    currentPct ?? 0,
  );

  return { min: 0, max: max > 0 ? max : UTILISATION_TARGET_PCT };
}

/** Map a utilisation % onto the track (0–100% of bar width). */
export function utilisationPositionOnScale(
  utilisationPct: number | null,
  scaleMin: number,
  scaleMax: number,
): number {
  if (utilisationPct === null || scaleMax <= scaleMin) return 0;
  const t = ((utilisationPct - scaleMin) / (scaleMax - scaleMin)) * 100;
  return Math.min(100, Math.max(0, t));
}

/** One-line chart read-out; wrap figures in ** for bold rendering. */
export function buildUtilisationChartSummary(
  current: SpendUtilisationLeg,
  projected: SpendUtilisationLeg,
): string {
  if (!projected.hasPlan) {
    return "No monthly plan set — projected utilisation cannot be calculated.";
  }

  const delta = projected.spend - projected.plannedBudget;
  const deltaPct =
    projected.utilisationPct !== null ? projected.utilisationPct - 100 : null;
  const absDelta = formatUsd(Math.abs(delta));
  const direction = delta >= 0 ? "over" : "under";
  const sign = delta >= 0 ? "+" : "−";
  const deltaPctPart =
    deltaPct === null ? "" : ` (**${Math.abs(deltaPct).toFixed(0)}%**)`;

  const projectedPart = `Projected month-end **${projected.spendLabel}** (**${projected.utilisationLabel}**) is **${sign}${absDelta}**${deltaPctPart} ${direction} the **${projected.plannedBudgetLabel}** budget`;

  if (!current.hasPlan) {
    return `${projectedPart}.`;
  }
  return `${projectedPart}; current MTD is **${current.spendLabel}** (**${current.utilisationLabel}**).`;
}
