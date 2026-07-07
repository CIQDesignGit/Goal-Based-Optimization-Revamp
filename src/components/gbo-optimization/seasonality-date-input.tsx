"use client";

import { format, isValid, parse } from "date-fns";

import { DatePicker } from "@/components/ui/date-picker";

const DISPLAY_FORMAT = "MMM dd, yyyy";
const BUDGET_YEAR_START = new Date(2026, 0, 1);
const BUDGET_YEAR_END = new Date(2027, 0, 31);

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
};

export function SeasonalityDateInput({
  value,
  onChange,
  placeholder = "Jul 01, 2026",
  className,
  "aria-label": ariaLabel,
}: SeasonalityDateInputProps) {
  const selected = parseSeasonalityDisplayDate(value);

  return (
    <DatePicker
      value={selected}
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
        startMonth: BUDGET_YEAR_START,
        endMonth: BUDGET_YEAR_END,
      }}
    />
  );
}
