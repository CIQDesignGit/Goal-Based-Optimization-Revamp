import { SEASONALITY_REFERENCE_DATE } from "@/lib/gbo-optimization/setup-data";

export const MID_MONTH_SEASONALITY_WARNING_TITLE = "Mid-month seasonality";

function parseDisplayDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Event start falls in the prototype's current month (e.g. July 2026). */
export function isSeasonalityInCurrentMonth(
  startDate: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): boolean {
  const date = parseDisplayDate(startDate);
  if (!date) {
    return false;
  }

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

/** Event starts after the first day of its month — budget redistributes across fewer days. */
export function isMidMonthSeasonalityStart(startDate: string): boolean {
  const date = parseDisplayDate(startDate);
  if (!date) {
    return false;
  }

  return date.getDate() !== 1;
}

/**
 * User is adding seasonality after the month has already begun (prototype "today").
 * Applies when the event starts in the current reference month on or after today.
 */
export function isAddingSeasonalityMidMonth(
  startDate: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): boolean {
  const date = parseDisplayDate(startDate);
  if (!date) {
    return false;
  }

  const sameMonth =
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth();

  if (!sameMonth) {
    return false;
  }

  return referenceDate.getDate() > 1;
}

export function shouldWarnMidMonthSeasonalityTiming(
  startDate: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): boolean {
  if (!isSeasonalityInCurrentMonth(startDate, referenceDate)) {
    return false;
  }

  return (
    isMidMonthSeasonalityStart(startDate) ||
    isAddingSeasonalityMidMonth(startDate, referenceDate)
  );
}

export function getMidMonthSeasonalityInlineHint(
  startDate: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): string {
  if (isMidMonthSeasonalityStart(startDate)) {
    return "Mid-month start — remaining budget redistributes across fewer days.";
  }

  if (isAddingSeasonalityMidMonth(startDate, referenceDate)) {
    return "Adding mid-month — remaining budget redistributes across fewer days.";
  }

  return "Mid-month timing — remaining budget redistributes across fewer days.";
}

export function getMidMonthSeasonalityWarningBody(
  startDate: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): string {
  const recommendation =
    "For even distribution across the month, add seasonality settings at the start of the month.";

  if (isMidMonthSeasonalityStart(startDate)) {
    const date = parseDisplayDate(startDate);
    const monthYear =
      date?.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }) ?? "this month";

    return `This event starts mid-month (${monthYear}). Remaining budget will be redistributed across fewer days. ${recommendation}`;
  }

  if (isAddingSeasonalityMidMonth(startDate, referenceDate)) {
    return `You're adding seasonality partway through the month. Remaining budget will be redistributed across fewer days. ${recommendation}`;
  }

  return `Remaining budget will be redistributed across fewer days. ${recommendation}`;
}
