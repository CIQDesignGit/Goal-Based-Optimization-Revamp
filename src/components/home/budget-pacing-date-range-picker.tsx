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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATA_MIN = new Date(2026, 0, 1); // Jan 01, 2026
const DATA_MAX = new Date(2026, 7, 12); // Aug 12, 2026
const TODAY = new Date(2026, 7, 14); // Aug 14, 2026 (underline in product)

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

function clampDate(date: Date): Date {
  if (isBefore(date, DATA_MIN)) return DATA_MIN;
  if (isAfter(date, DATA_MAX)) return DATA_MAX;
  return date;
}

function previousPeriod(range: DateRangeValue): DateRangeValue {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  const to = clampDate(subDays(range.from, 1));
  const from = clampDate(subDays(to, days - 1));
  return { from, to };
}

function monthToDate(): DateRangeValue {
  const to = DATA_MAX;
  const from = startOfMonth(to);
  return { from: clampDate(from), to };
}

function lastNDays(n: number): DateRangeValue {
  const to = DATA_MAX;
  const from = clampDate(subDays(to, n - 1));
  return { from, to };
}

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
      const from = clampDate(subMonths(draft.from, 1));
      const to = clampDate(subMonths(draft.to, 1));
      setCompare({ from, to });
      setCompareFromText(formatShort(from));
      setCompareToText(formatShort(to));
    }
  }

  function selectDay(day: Date) {
    if (isAfter(day, DATA_MAX) || isBefore(day, DATA_MIN)) return;
    if (activeField === "from" || isAfter(draft.from, day)) {
      const next = { from: day, to: isBefore(day, draft.to) ? draft.to : day };
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
    const next = { from: draft.from, to: day };
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
    const defaults = { from: new Date(2026, 6, 15), to: new Date(2026, 6, 28) };
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

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <span className="pl-4 text-2xs font-normal leading-none text-slate-400">
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
          <aside className="flex w-full shrink-0 flex-col gap-5 border-t border-slate-200 px-4 py-4 lg:w-[17.5rem] lg:border-l lg:border-t-0">
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
              <div className="flex items-center gap-1.5">
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
                    const next = {
                      from: parsed,
                      to: isBefore(parsed, draft.to) ? draft.to : parsed,
                    };
                    setDraft(next);
                    setFromText(formatShort(next.from));
                    setToText(formatShort(next.to));
                    setDatePreset("Custom");
                  }}
                />
                <span className="shrink-0 text-slate-400">–</span>
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
                    const next = {
                      from: isAfter(parsed, draft.from) ? draft.from : parsed,
                      to: parsed,
                    };
                    setDraft(next);
                    setFromText(formatShort(next.from));
                    setToText(formatShort(next.to));
                    setDatePreset("Custom");
                  }}
                />
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
                  <div className="flex items-center gap-1.5">
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
                        setCompare((c) => ({ ...c, from: parsed }));
                        setCompareFromText(formatShort(parsed));
                      }}
                    />
                    <span className="shrink-0 text-slate-400">–</span>
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
                        setCompare((c) => ({ ...c, to: parsed }));
                        setCompareToText(formatShort(parsed));
                      }}
                    />
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
                  isBefore(day, DATA_MIN) || isAfter(day, DATA_MAX);
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
