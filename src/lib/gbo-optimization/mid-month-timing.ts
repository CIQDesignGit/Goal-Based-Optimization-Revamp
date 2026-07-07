import { isValid, parse } from "date-fns";

import { SEASONALITY_REFERENCE_DATE } from "@/lib/gbo-optimization/setup-data";

export const MID_MONTH_SEASONALITY_WARNING_TITLE = "Mid-month seasonality";

const DISPLAY_FORMAT = "MMM dd, yyyy";

function parseDisplayDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parse(trimmed, DISPLAY_FORMAT, new Date());
  if (isValid(parsed)) {
    return parsed;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/** Start date falls in a month after the prototype's current month. */
export function isFutureMonth(
  dateStr: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): boolean {
  const date = parseDisplayDate(dateStr);
  if (!date) {
    return false;
  }

  return monthIndex(date) > monthIndex(referenceDate);
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
  endDate?: string,
  referenceDate: Date = SEASONALITY_REFERENCE_DATE,
): boolean {
  if (isFutureMonth(startDate, referenceDate)) {
    return false;
  }

  if (
    endDate?.trim() &&
    isFutureMonth(endDate, referenceDate) &&
    !isSeasonalityInCurrentMonth(startDate, referenceDate)
  ) {
    return false;
  }

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
  const nudge =
    " For even distribution, add seasonality before the start of the month.";

  if (isMidMonthSeasonalityStart(startDate)) {
    return `Mid-month start — remaining budget redistributes across fewer days.${nudge}`;
  }

  if (isAddingSeasonalityMidMonth(startDate, referenceDate)) {
    return `Adding mid-month — remaining budget redistributes across fewer days.${nudge}`;
  }

  return `Mid-month timing — remaining budget redistributes across fewer days.${nudge}`;
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
