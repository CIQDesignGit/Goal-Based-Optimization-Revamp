"use client";

import { format, isValid, parse } from "date-fns";

import { DatePicker } from "@/components/ui/date-picker";

const DISPLAY_FORMAT = "MMM dd, yyyy";
/** Seasonality planning window: full 2026 plus Jan 2027 for New Year's. */
const SEASONALITY_CALENDAR_START = new Date(2026, 0, 1);
const SEASONALITY_CALENDAR_END = new Date(2027, 0, 1);

export function parseSeasonalityDisplayDate(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = parse(trimmed, DISPLAY_FORMAT, new Date());
  if (isValid(parsed)) {
    return parsed;
  }

  const fallback = new Date(trimmed);
  return isValid(fallback) ? fallback : undefined;
}

export function formatSeasonalityDisplayDate(date: Date): string {
  return format(date, DISPLAY_FORMAT);
}

type SeasonalityDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  /** Earliest selectable date — used for end-date fields. */
  minDate?: Date;
  /** Month to open the calendar to when value is missing or earlier than this. */
  openToMonth?: Date;
};

export function SeasonalityDateInput({
  value,
  onChange,
  placeholder = "Jul 01, 2026",
  className,
  "aria-label": ariaLabel,
  minDate,
  openToMonth,
}: SeasonalityDateInputProps) {
  const selected = parseSeasonalityDisplayDate(value);

  return (
    <DatePicker
      value={selected}
      openToMonth={openToMonth}
      onChange={(date) => {
        if (date) {
          onChange(formatSeasonalityDisplayDate(date));
        }
      }}
      placeholder={placeholder}
      dateFormat={DISPLAY_FORMAT}
      aria-label={ariaLabel}
      className={className}
      calendarProps={{
        startMonth: SEASONALITY_CALENDAR_START,
        endMonth: SEASONALITY_CALENDAR_END,
        disabled: minDate ? { before: minDate } : undefined,
      }}
    />
  );
}

/** Keep end date on or after start when the user moves start forward. */
export function syncSeasonalityEndDateWithStart(
  startDate: string,
  endDate: string,
): string | undefined {
  const start = parseSeasonalityDisplayDate(startDate);
  const end = parseSeasonalityDisplayDate(endDate);

  if (start && end && end < start) {
    return startDate;
  }

  return undefined;
}
