/** 97–102% band helpers for pacing / utilisation colour and status labels. */

export type PacingBandStatus = "on-plan" | "behind" | "ahead";

export const PACING_BAND_MIN = 97;
export const PACING_BAND_MAX = 102;

/** Classify a pacing % into On Plan / Behind / Ahead. */
export function getPacingBandStatus(pacingPercent: number): PacingBandStatus {
  if (pacingPercent >= PACING_BAND_MIN && pacingPercent <= PACING_BAND_MAX) {
    return "on-plan";
  }
  if (pacingPercent < PACING_BAND_MIN) {
    return "behind";
  }
  return "ahead";
}

export function pacingStatusLabel(status: PacingBandStatus): string {
  if (status === "on-plan") return "On Plan";
  if (status === "behind") return "Behind";
  return "Ahead";
}

/** Tailwind text class for the band (green in band, red outside). */
export function pacingStatusTextClass(status: PacingBandStatus): string {
  return status === "on-plan" ? "text-success-700" : "text-error-600";
}

/** Soft background for badges / pill chips. */
export function pacingStatusBadgeClass(status: PacingBandStatus): string {
  return status === "on-plan"
    ? "bg-success-100 text-success-700"
    : "bg-error-100 text-error-700";
}

/** Safe ratio as percent; returns null when denominator is zero. */
export function ratioToPercent(
  numerator: number,
  denominator: number,
): number | null {
  if (denominator === 0) return null;
  return (numerator / denominator) * 100;
}

/** Round to one decimal for display consistency across widgets. */
export function formatPacingPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
