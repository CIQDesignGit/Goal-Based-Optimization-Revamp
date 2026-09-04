"use client";

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getWeek,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parse,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATA_MIN_DAY = new Date(2026, 0, 1); // Jan 01, 2026
const DATA_MAX = new Date(2026, 7, 12, 23, 30, 0, 0); // Aug 12, 2026 11:30 PM
const TODAY = new Date(2026, 7, 14); // Aug 14, 2026 (underline in product)
const DATA_MAX_DAY = new Date(2026, 7, 12);

const DATE_PRESETS = [
  "Month to Date",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "Custom",
] as const;

const COMPARE_PRESETS = [
  "Previous Period",
  "Previous Month",
  "None",
] as const;

/** One dropdown of clock times every 30 minutes (12:00 AM … 11:30 PM). */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const label = `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
  const value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { label, value, hour24, minute };
});

type DatePreset = (typeof DATE_PRESETS)[number];
type ComparePreset = (typeof COMPARE_PRESETS)[number];

export type DateRangeValue = {
  from: Date;
  to: Date;
};

type BudgetPacingDateRangePickerProps = {
  range: DateRangeValue;
  onApply: (range: DateRangeValue) => void;
  triggerLabel: string;
  comparisonLabel?: string;
  /** When false, hide Compare to controls and orange compare range (default true). */
  showCompare?: boolean;
};

/** Keep the calendar day, force 12:00 AM. */
function atStartOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

/** Keep the calendar day, force 11:30 PM (last 30-min slot). */
function atEndOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    30,
    0,
    0,
  );
}

/** Copy hour/minute from `timeSource` onto `day`'s calendar date. */
function copyClockTime(day: Date, timeSource: Date): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    timeSource.getHours(),
    timeSource.getMinutes(),
    0,
    0,
  );
}

/** Apply a `HH:mm` time string onto a calendar date. */
function applyClockTime(date: Date, timeValue: string): Date {
  const [hh, mm] = timeValue.split(":").map(Number);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hh ?? 0,
    mm ?? 0,
    0,
    0,
  );
}

/** Nearest 30-minute slot for the select value (handles legacy :59 times). */
function nearestTimeOptionValue(date: Date): string {
  const total = date.getHours() * 60 + date.getMinutes();
  let snapped = Math.round(total / 30) * 30;
  // 11:45+ would round to 24:00 — clamp to last slot 11:30 PM
  if (snapped >= 24 * 60) snapped = 23 * 60 + 30;
  const hour24 = Math.floor(snapped / 60);
  const minute = snapped % 60;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function clampDate(date: Date): Date {
  const day = atStartOfDay(date);
  if (isBefore(day, DATA_MIN_DAY)) return copyClockTime(DATA_MIN_DAY, date);
  if (isAfter(day, DATA_MAX_DAY)) return copyClockTime(DATA_MAX_DAY, date);
  return date;
}

function previousPeriod(range: DateRangeValue): DateRangeValue {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  const toDay = clampDate(subDays(atStartOfDay(range.from), 1));
  const fromDay = clampDate(subDays(toDay, days - 1));
  return {
    from: copyClockTime(fromDay, range.from),
    to: copyClockTime(toDay, range.to),
  };
}

function monthToDate(): DateRangeValue {
  const to = DATA_MAX;
  const from = atStartOfDay(startOfMonth(to));
  return { from: clampDate(from), to };
}

function lastNDays(n: number): DateRangeValue {
  const to = DATA_MAX;
  const from = clampDate(atStartOfDay(subDays(atStartOfDay(to), n - 1)));
  return { from, to };
}

/** Date-only label for the text fields (time is picked separately). */
function formatShort(date: Date): string {
  return format(date, "MMM dd, yyyy");
}

function parseShort(value: string): Date | null {
  const parsed = parse(value.trim(), "MMM dd, yyyy", new Date(2026, 0, 1));
  return Number.isNaN(parsed.getTime()) ? null : clampDate(parsed);
}

/**
 * Budget Pacing date filter — dual calendar + compare sidebar (product reference).
 */
export function BudgetPacingDateRangePicker({
  range,
  onApply,
  triggerLabel,
  comparisonLabel,
  showCompare = true,
}: BudgetPacingDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const [compare, setCompare] = useState(() => previousPeriod(range));
  const [datePreset, setDatePreset] = useState<DatePreset>("Custom");
  const [comparePreset, setComparePreset] =
    useState<ComparePreset>("Previous Period");
  const [leftMonth, setLeftMonth] = useState(() =>
    startOfMonth(subMonths(range.to, 1)),
  );
  const [fromText, setFromText] = useState(formatShort(range.from));
  const [toText, setToText] = useState(formatShort(range.to));
  const [compareFromText, setCompareFromText] = useState(
    formatShort(previousPeriod(range).from),
  );
  const [compareToText, setCompareToText] = useState(
    formatShort(previousPeriod(range).to),
  );
  const [activeField, setActiveField] = useState<"from" | "to">("from");

  useEffect(() => {
    if (!open) return;
    setDraft(range);
    const prev = previousPeriod(range);
    setCompare(prev);
    setFromText(formatShort(range.from));
    setToText(formatShort(range.to));
    setCompareFromText(formatShort(prev.from));
    setCompareToText(formatShort(prev.to));
    setLeftMonth(startOfMonth(subMonths(range.to, 1)));
    setDatePreset("Custom");
    setComparePreset("Previous Period");
    setActiveField("from");
  }, [open, range]);

  const rightMonth = addMonths(leftMonth, 1);

  function applyDatePreset(preset: DatePreset) {
    setDatePreset(preset);
    let next = draft;
    if (preset === "Month to Date") next = monthToDate();
    if (preset === "Last 7 days") next = lastNDays(7);
    if (preset === "Last 14 days") next = lastNDays(14);
    if (preset === "Last 30 days") next = lastNDays(30);
    setDraft(next);
    setFromText(formatShort(next.from));
    setToText(formatShort(next.to));
    if (comparePreset === "Previous Period") {
      const prev = previousPeriod(next);
      setCompare(prev);
      setCompareFromText(formatShort(prev.from));
      setCompareToText(formatShort(prev.to));
    }
    setLeftMonth(startOfMonth(subMonths(next.to, 1)));
  }

  function applyComparePreset(preset: ComparePreset) {
    setComparePreset(preset);
    if (preset === "None") return;
    if (preset === "Previous Period") {
      const prev = previousPeriod(draft);
      setCompare(prev);
      setCompareFromText(formatShort(prev.from));
      setCompareToText(formatShort(prev.to));
    }
    if (preset === "Previous Month") {
      const from = clampDate(copyClockTime(subMonths(draft.from, 1), draft.from));
      const to = clampDate(copyClockTime(subMonths(draft.to, 1), draft.to));
      setCompare({ from, to });
      setCompareFromText(formatShort(from));
      setCompareToText(formatShort(to));
    }
  }

  function selectDay(day: Date) {
    if (isAfter(day, DATA_MAX_DAY) || isBefore(day, DATA_MIN_DAY)) return;
    if (activeField === "from" || isAfter(atStartOfDay(draft.from), day)) {
      // Keep existing start time when picking a new from-day (default 12:00 AM).
      const from = copyClockTime(day, draft.from);
      const to = isBefore(day, atStartOfDay(draft.to))
        ? draft.to
        : copyClockTime(day, draft.to);
      const next = { from, to };
      setDraft(next);
      setFromText(formatShort(next.from));
      setToText(formatShort(next.to));
      setActiveField("to");
      if (comparePreset === "Previous Period") {
        const prev = previousPeriod(next);
        setCompare(prev);
        setCompareFromText(formatShort(prev.from));
        setCompareToText(formatShort(prev.to));
      }
      return;
    }
    // Keep existing end time when picking a new to-day (default 11:30 PM).
    const next = { from: draft.from, to: copyClockTime(day, draft.to) };
    setDraft(next);
    setToText(formatShort(day));
    setDatePreset("Custom");
    if (comparePreset === "Previous Period") {
      const prev = previousPeriod(next);
      setCompare(prev);
      setCompareFromText(formatShort(prev.from));
      setCompareToText(formatShort(prev.to));
    }
  }

  function handleReset() {
    const defaults = {
      from: new Date(2026, 6, 15, 0, 0, 0, 0),
      to: new Date(2026, 6, 28, 23, 30, 0, 0),
    };
    setDraft(defaults);
    setFromText(formatShort(defaults.from));
    setToText(formatShort(defaults.to));
    const prev = previousPeriod(defaults);
    setCompare(prev);
    setCompareFromText(formatShort(prev.from));
    setCompareToText(formatShort(prev.to));
    setDatePreset("Custom");
    setComparePreset("Previous Period");
    setLeftMonth(startOfMonth(defaults.from));
  }

  function updateDraftTime(field: "from" | "to", nextDate: Date) {
    const next = { ...draft, [field]: nextDate };
    // Keep from ≤ to on the same timeline when times collide oddly.
    if (field === "from" && isAfter(next.from, next.to)) {
      next.to = next.from;
      setToText(formatShort(next.to));
    }
    if (field === "to" && isBefore(next.to, next.from)) {
      next.from = next.to;
      setFromText(formatShort(next.from));
    }
    setDraft(next);
    setDatePreset("Custom");
    if (comparePreset === "Previous Period") {
      const prev = previousPeriod(next);
      setCompare(prev);
      setCompareFromText(formatShort(prev.from));
      setCompareToText(formatShort(prev.to));
    }
  }

  function updateCompareTime(field: "from" | "to", nextDate: Date) {
    setCompare((c) => ({ ...c, [field]: nextDate }));
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        // Keep the date picker open while interacting with a portaled time menu.
        if (
          !next &&
          details.reason === "outside-press" &&
          details.event.target instanceof Element &&
          details.event.target.closest("[data-time-select-menu]")
        ) {
          details.cancel();
          return;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 border-slate-200 bg-white px-2.5 py-0 text-left text-slate-700 shadow-none",
              showCompare
                ? "flex-col items-start justify-center gap-px"
                : "items-center",
            )}
          />
        }
      >
        <span className="inline-flex items-center gap-1 text-2xs font-medium leading-none">
          <CalendarDays className="size-3 shrink-0 text-slate-500" />
          {triggerLabel}
          <ChevronDown className="size-3 text-slate-400" />
        </span>
        {showCompare && comparisonLabel ? (
          <span className="pl-4 text-2xs font-normal leading-none text-slate-600">
            {comparisonLabel}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(56rem,calc(100vw-1.5rem))] gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-lg ring-0"
      >
        <div className="flex flex-col lg:flex-row">
          {/* Dual calendars — nav chevrons flank the two month titles */}
          <div className="min-w-0 flex-1 px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
            <div className="mb-3 grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-x-2">
              <button
                type="button"
                aria-label="Previous month"
                className="flex size-7 items-center justify-center justify-self-start rounded text-slate-500 hover:bg-slate-100"
                onClick={() => setLeftMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-center text-sm font-semibold text-slate-900">
                {format(leftMonth, "MMMM yyyy")}
              </p>
              <p className="text-center text-sm font-semibold text-slate-900">
                {format(rightMonth, "MMMM yyyy")}
              </p>
              <button
                type="button"
                aria-label="Next month"
                className="flex size-7 items-center justify-center justify-self-end rounded text-slate-500 hover:bg-slate-100"
                onClick={() => setLeftMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <MonthGrid
                month={leftMonth}
                primary={draft}
                compare={
                  showCompare && comparePreset !== "None" ? compare : null
                }
                onSelectDay={selectDay}
                hideTitle
              />
              <MonthGrid
                month={rightMonth}
                primary={draft}
                compare={
                  showCompare && comparePreset !== "None" ? compare : null
                }
                onSelectDay={selectDay}
                hideTitle
              />
            </div>
          </div>

          {/* Sidebar — matches reference proportions */}
          <aside className="flex w-full shrink-0 flex-col gap-5 border-t border-slate-200 px-4 py-4 lg:w-[19rem] lg:border-l lg:border-t-0">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <span
                  className="size-2.5 shrink-0 rounded-sm bg-brand-500"
                  aria-hidden
                />
                Date range
              </p>
              <PresetSelect
                value={datePreset}
                options={DATE_PRESETS}
                onChange={(v) => applyDatePreset(v as DatePreset)}
              />
              <div className="flex items-start gap-1.5">
                {/* Start: date + its time stacked together */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <DateInput
                    value={fromText}
                    active={activeField === "from"}
                    tone="primary"
                    onFocus={() => setActiveField("from")}
                    onChange={setFromText}
                    onBlur={() => {
                      const parsed = parseShort(fromText);
                      if (!parsed) {
                        setFromText(formatShort(draft.from));
                        return;
                      }
                      const from = copyClockTime(parsed, draft.from);
                      const next = {
                        from,
                        to: isBefore(from, draft.to) ? draft.to : from,
                      };
                      setDraft(next);
                      setFromText(formatShort(next.from));
                      setToText(formatShort(next.to));
                      setDatePreset("Custom");
                    }}
                  />
                  <TimeSelect
                    value={draft.from}
                    tone="primary"
                    ariaLabel="Start time"
                    onChange={(next) => updateDraftTime("from", next)}
                  />
                </div>
                <span
                  className="mt-2 shrink-0 self-start text-slate-400"
                  aria-hidden
                >
                  –
                </span>
                {/* End: date + its time stacked together */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <DateInput
                    value={toText}
                    active={activeField === "to"}
                    tone="primary"
                    onFocus={() => setActiveField("to")}
                    onChange={setToText}
                    onBlur={() => {
                      const parsed = parseShort(toText);
                      if (!parsed) {
                        setToText(formatShort(draft.to));
                        return;
                      }
                      const to = copyClockTime(parsed, draft.to);
                      const next = {
                        from: isAfter(to, draft.from) ? draft.from : to,
                        to,
                      };
                      setDraft(next);
                      setFromText(formatShort(next.from));
                      setToText(formatShort(next.to));
                      setDatePreset("Custom");
                    }}
                  />
                  <TimeSelect
                    value={draft.to}
                    tone="primary"
                    ariaLabel="End time"
                    onChange={(next) => updateDraftTime("to", next)}
                  />
                </div>
              </div>
            </div>

            {showCompare ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span
                    className="size-2.5 shrink-0 rounded-sm bg-orange-500"
                    aria-hidden
                  />
                  Compare to
                </p>
                <PresetSelect
                  value={comparePreset}
                  options={COMPARE_PRESETS}
                  onChange={(v) => applyComparePreset(v as ComparePreset)}
                />
                {comparePreset !== "None" ? (
                  <div className="flex items-start gap-1.5">
                    {/* Compare start: date + time */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <DateInput
                        value={compareFromText}
                        tone="compare"
                        onChange={setCompareFromText}
                        onBlur={() => {
                          const parsed = parseShort(compareFromText);
                          if (!parsed) {
                            setCompareFromText(formatShort(compare.from));
                            return;
                          }
                          const from = copyClockTime(parsed, compare.from);
                          setCompare((c) => ({ ...c, from }));
                          setCompareFromText(formatShort(from));
                        }}
                      />
                      <TimeSelect
                        value={compare.from}
                        tone="compare"
                        ariaLabel="Compare start time"
                        onChange={(next) => updateCompareTime("from", next)}
                      />
                    </div>
                    <span
                      className="mt-2 shrink-0 self-start text-slate-400"
                      aria-hidden
                    >
                      –
                    </span>
                    {/* Compare end: date + time */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <DateInput
                        value={compareToText}
                        tone="compare"
                        onChange={setCompareToText}
                        onBlur={() => {
                          const parsed = parseShort(compareToText);
                          if (!parsed) {
                            setCompareToText(formatShort(compare.to));
                            return;
                          }
                          const to = copyClockTime(parsed, compare.to);
                          setCompare((c) => ({ ...c, to }));
                          setCompareToText(formatShort(to));
                        }}
                      />
                      <TimeSelect
                        value={compare.to}
                        tone="compare"
                        ariaLabel="Compare end time"
                        onChange={(next) => updateCompareTime("to", next)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-auto flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-slate-300 bg-white px-3 text-slate-600 shadow-none hover:bg-slate-50"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-md bg-slate-500 px-3 text-white hover:bg-slate-600"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </aside>
        </div>

        <footer className="flex items-start gap-2 border-t border-slate-200 bg-brand-50 px-4 py-2.5">
          <Info
            className="mt-0.5 size-3.5 shrink-0 text-brand-600"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-slate-600">
            Data available from{" "}
            <span className="font-semibold text-brand-600">
              Jan 01, 2026 - Aug 12, 2026
            </span>
            . Hence the date selection can be done only within this range.
          </p>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

function PresetSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-8 text-sm text-slate-800 outline-none focus-visible:border-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function DateInput({
  value,
  onChange,
  onBlur,
  onFocus,
  active,
  tone = "primary",
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  active?: boolean;
  tone?: "primary" | "compare";
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border bg-white px-2 text-xs text-slate-800 outline-none",
        active && tone === "primary"
          ? "border-brand-600 ring-1 ring-brand-600/25"
          : active && tone === "compare"
            ? "border-orange-600 ring-1 ring-orange-600/25"
            : "border-slate-200 focus-visible:border-slate-400",
      )}
      aria-label="Date"
    />
  );
}

/**
 * Themed time dropdown (30-min slots). Fixed height + internal scroll.
 * Portaled so it isn’t clipped by the date-range popover’s overflow.
 */
function TimeSelect({
  value,
  onChange,
  tone = "primary",
  ariaLabel,
}: {
  value: Date;
  onChange: (next: Date) => void;
  tone?: "primary" | "compare";
  ariaLabel: string;
}) {
  const [listOpen, setListOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = nearestTimeOptionValue(value);
  const selectedLabel =
    TIME_OPTIONS.find((opt) => opt.value === selected)?.label ?? selected;

  const borderClass =
    tone === "compare"
      ? "border-slate-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
      : "border-slate-200 focus-visible:border-brand-500 focus-visible:ring-brand-500/20";

  // Anchor the menu under the trigger (fixed coords for the portal).
  useLayoutEffect(() => {
    if (!listOpen || !triggerRef.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 112),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [listOpen]);

  // Close when clicking outside this control / its menu.
  useEffect(() => {
    if (!listOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setListOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [listOpen]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={listOpen}
        aria-controls={listOpen ? listId : undefined}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1 rounded-md border bg-white px-2 text-2xs text-slate-800 outline-none select-none focus-visible:ring-2",
          borderClass,
        )}
        onClick={() => setListOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-slate-400 transition-transform",
            listOpen && "rotate-180",
          )}
        />
      </button>

      {listOpen && menuPosition
        ? createPortal(
            <ul
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              data-time-select-menu=""
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
              }}
              className="z-[60] max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-md ring-1 ring-foreground/10"
            >
              {TIME_OPTIONS.map((opt) => {
                const isSelected = opt.value === selected;
                return (
                  <li key={opt.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-slate-800 outline-none select-none hover:bg-slate-100 focus:bg-slate-100",
                        isSelected && "bg-brand-50 font-medium text-brand-700",
                      )}
                      onClick={() => {
                        onChange(applyClockTime(value, opt.value));
                        setListOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected ? (
                        <Check className="size-3.5 shrink-0 text-brand-600" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

function MonthGrid({
  month,
  primary,
  compare,
  onSelectDay,
  hideTitle = false,
}: {
  month: Date;
  primary: DateRangeValue;
  compare: DateRangeValue | null;
  onSelectDay: (day: Date) => void;
  hideTitle?: boolean;
}) {
  const weeks = useMemo(() => buildWeeks(month), [month]);
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="min-w-0">
      {!hideTitle ? (
        <p className="mb-2 text-center text-sm font-semibold text-slate-900">
          {format(month, "MMMM yyyy")}
        </p>
      ) : null}

      {/* Header row */}
      <div className="mb-1 grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] text-center text-[11px]">
        <div className="border-r border-dashed border-slate-300 py-1 font-medium text-slate-400">
          W#
        </div>
        {weekdays.map((d, i) => (
          <div key={`${d}-${i}`} className="py-1 font-medium text-slate-500">
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        {weeks.map((week) => {
          const weekNum = getWeek(week[0]!, {
            weekStartsOn: 0,
            firstWeekContainsDate: 1,
          });
          return (
            <div
              key={week[0]!.toISOString()}
              className="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))]"
            >
              <div className="flex items-center justify-center border-r border-dashed border-slate-300 text-[11px] text-slate-400">
                {weekNum}
              </div>
              {week.map((day) => {
                const inMonth = isSameMonth(day, month);
                const outOfData =
                  isBefore(day, DATA_MIN_DAY) || isAfter(day, DATA_MAX_DAY);
                const disabled = !inMonth || outOfData;
                const isToday = isSameDay(day, TODAY);
                const role = inMonth
                  ? dayRole(day, primary, compare)
                  : null;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectDay(day)}
                    className={cn(
                      "relative flex h-8 items-center justify-center p-0 text-xs tabular-nums",
                      // Continuous range rail behind the day chip
                      (role === "primary-middle" ||
                        role === "primary-start" ||
                        role === "primary-end" ||
                        role === "primary-single") &&
                        "bg-brand-100",
                      (role === "compare-middle" ||
                        role === "compare-start" ||
                        role === "compare-end" ||
                        role === "compare-single") &&
                        "bg-orange-100",
                      role === "primary-start" && "rounded-l-md",
                      role === "primary-end" && "rounded-r-md",
                      role === "primary-single" && "rounded-md",
                      role === "compare-start" && "rounded-l-md",
                      role === "compare-end" && "rounded-r-md",
                      role === "compare-single" && "rounded-md",
                      disabled && "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-7 items-center justify-center rounded-md",
                        !inMonth && "text-slate-300",
                        inMonth && outOfData && "text-slate-300",
                        inMonth &&
                          !outOfData &&
                          !role &&
                          "text-slate-800 hover:bg-slate-100",
                        role === "primary-middle" && "text-slate-900",
                        role === "compare-middle" && "text-slate-900",
                        (role === "primary-start" ||
                          role === "primary-end" ||
                          role === "primary-single") &&
                          "bg-brand-500 font-semibold text-white",
                        (role === "compare-start" ||
                          role === "compare-end" ||
                          role === "compare-single") &&
                          "bg-orange-500 font-semibold text-white",
                      )}
                    >
                      {format(day, "d")}
                      {isToday && inMonth ? (
                        <span className="absolute bottom-0.5 left-1/2 h-px w-3.5 -translate-x-1/2 bg-slate-400" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildWeeks(month: Date): Date[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfMonth(month);
  const days = eachDayOfInterval({
    start,
    end: addDays(startOfWeek(end, { weekStartsOn: 0 }), 6),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

type DayRole =
  | "primary-start"
  | "primary-end"
  | "primary-middle"
  | "primary-single"
  | "compare-start"
  | "compare-end"
  | "compare-middle"
  | "compare-single"
  | null;

function dayRole(
  day: Date,
  primary: DateRangeValue,
  compare: DateRangeValue | null,
): DayRole {
  if (isSameDay(day, primary.from) && isSameDay(day, primary.to)) {
    return "primary-single";
  }
  if (isSameDay(day, primary.from)) return "primary-start";
  if (isSameDay(day, primary.to)) return "primary-end";
  if (
    isWithinInterval(day, { start: primary.from, end: primary.to }) &&
    !isSameDay(day, primary.from) &&
    !isSameDay(day, primary.to)
  ) {
    return "primary-middle";
  }

  if (!compare) return null;
  if (isSameDay(day, compare.from) && isSameDay(day, compare.to)) {
    return "compare-single";
  }
  if (isSameDay(day, compare.from)) return "compare-start";
  if (isSameDay(day, compare.to)) return "compare-end";
  if (
    isWithinInterval(day, { start: compare.from, end: compare.to }) &&
    !isSameDay(day, compare.from) &&
    !isSameDay(day, compare.to)
  ) {
    return "compare-middle";
  }
  return null;
}
