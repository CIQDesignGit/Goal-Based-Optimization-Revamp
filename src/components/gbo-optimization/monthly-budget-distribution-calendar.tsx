"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
  type ComponentProps,
} from "react";
import { type DayButton } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type BudgetDistributionTier,
  BUDGET_DISTRIBUTION_TIER_STYLES,
  budgetMonthIndexToDate,
  buildDailyBudgetDistribution,
  formatCompactDailyBudget,
  formatDailyBudgetForCell,
  getBudgetDistributionRange,
  getBudgetDistributionTier,
  getDailyBudgetAmountMap,
} from "@/lib/gbo-optimization/monthly-budget-distribution";
import { cn } from "@/lib/utils";

type MonthlyBudgetDistributionCalendarProps = {
  monthIndex: number;
  monthlyBudget: number;
  monthLabel: string;
  className?: string;
};

const BUDGET_YEAR_START = new Date(2026, 0, 1);
const BUDGET_YEAR_END = new Date(2026, 11, 31);

const DISTRIBUTION_CALENDAR_CLASS_NAMES = {
  months: "w-full",
  month:
    "grid w-full grid-cols-[1.75rem_1fr_1.75rem] grid-rows-[auto_1fr] gap-y-1",
  button_previous:
    "col-start-1 row-start-1 size-7 shrink-0 justify-self-start p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  button_next:
    "col-start-3 row-start-1 size-7 shrink-0 justify-self-end p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  month_caption:
    "col-start-2 row-start-1 flex h-7 items-center justify-center px-0",
  caption_label: "text-sm font-medium text-slate-700",
  month_grid: "col-span-3 row-start-2 w-full",
  weekdays: "mb-0.5 flex w-full",
  weekday:
    "flex-1 basis-0 text-center text-[11px] font-medium text-slate-500 select-none",
  weeks: "w-full",
  week: "mt-0.5 flex w-full",
  day: "flex-1 basis-0 p-0 aspect-auto",
  day_button: "size-full",
  today: "bg-transparent",
  outside: "opacity-100",
} as const;

function DistributionLegend({
  range,
}: {
  range: ReturnType<typeof getBudgetDistributionRange>;
}) {
  const items: Array<{
    tier: BudgetDistributionTier;
    label: string;
    example: string;
  }> = [
    {
      tier: "low",
      label: "Less",
      example: range.max > 0 ? formatDailyBudgetForCell(range.min) : "$570",
    },
    {
      tier: "medium",
      label: "Medium",
      example:
        range.max > 0
          ? formatDailyBudgetForCell(Math.round((range.min + range.max) / 2))
          : "$733",
    },
    {
      tier: "high",
      label: "More",
      example: range.max > 0 ? formatDailyBudgetForCell(range.max) : "$896",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch justify-between gap-1.5">
        {items.map(({ tier, label, example }) => (
          <div
            key={tier}
            className="flex flex-1 flex-col items-center gap-1 text-center"
          >
            <span
              className={cn(
                "flex h-8 w-full flex-col items-center justify-center rounded px-0.5",
                BUDGET_DISTRIBUTION_TIER_STYLES[tier].cell,
              )}
              aria-hidden
            >
              <span className="text-[10px] font-medium leading-none text-slate-800">
                12
              </span>
              <span
                className={cn(
                  "text-[9px] font-semibold leading-tight",
                  BUDGET_DISTRIBUTION_TIER_STYLES[tier].budget,
                )}
              >
                {example}
              </span>
            </span>
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionDayButton({
  amountByDate,
  range,
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton> & {
  amountByDate: Map<string, number>;
  range: ReturnType<typeof getBudgetDistributionRange>;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const dateKey = day.isoDate;
  const amount = amountByDate.get(dateKey);
  const isInMonth = !modifiers.outside;
  const hasAmount = amount != null && amount > 0 && isInMonth;
  const tier = hasAmount ? getBudgetDistributionTier(amount, range) : null;
  const tierStyles = tier ? BUDGET_DISTRIBUTION_TIER_STYLES[tier] : null;

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const ariaLabel = hasAmount
    ? `${format(day.date, "MMMM d")}, ${formatDailyBudgetForCell(amount)} daily budget`
    : format(day.date, "MMMM d");

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      {...props}
      className={cn(
        "relative flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-px rounded px-1 py-2 text-center leading-none transition-colors",
        tierStyles?.cell,
        !tier &&
          isInMonth &&
          "bg-transparent hover:bg-slate-50",
        !tier && !isInMonth && "bg-transparent",
        modifiers.today && "ring-1 ring-brand-500 ring-offset-1",
        modifiers.disabled && "opacity-40",
        className,
      )}
    >
      <span
        className={cn(
          "text-[11px] font-medium leading-none",
          isInMonth ? "text-slate-800" : "text-slate-300",
        )}
      >
        {day.date.getDate()}
      </span>
      {hasAmount && amount != null ? (
        <span
          className={cn(
            "text-[9px] font-semibold leading-tight",
            tierStyles?.budget,
          )}
        >
          {formatDailyBudgetForCell(amount)}
        </span>
      ) : isInMonth ? (
        <span className="text-[9px] leading-tight text-slate-300">—</span>
      ) : null}
    </button>
  );
}

export function MonthlyBudgetDistributionCalendar({
  monthIndex,
  monthlyBudget,
  monthLabel,
  className,
}: MonthlyBudgetDistributionCalendarProps) {
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() =>
    budgetMonthIndexToDate(monthIndex),
  );

  useEffect(() => {
    setDisplayMonth(budgetMonthIndexToDate(monthIndex));
  }, [monthIndex]);

  const dailyEntries = useMemo(
    () =>
      buildDailyBudgetDistribution(
        monthlyBudget,
        displayMonth.getFullYear(),
        displayMonth.getMonth(),
      ),
    [monthlyBudget, displayMonth],
  );

  const amountByDate = useMemo(
    () => getDailyBudgetAmountMap(dailyEntries),
    [dailyEntries],
  );

  const range = useMemo(
    () => getBudgetDistributionRange(dailyEntries),
    [dailyEntries],
  );

  const DayButtonComponent = useCallback(
    (props: ComponentProps<typeof DayButton>) => (
      <DistributionDayButton
        {...props}
        amountByDate={amountByDate}
        range={range}
      />
    ),
    [amountByDate, range],
  );

  const monthTotal = dailyEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-600 underline-offset-4 hover:underline",
          className,
        )}
      >
        <CalendarDays className="size-3.5" aria-hidden />
        View Monthly Distribution
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[21rem] max-w-none p-0">
        <PopoverHeader className="gap-1 border-b border-slate-100 px-3 py-2.5">
          <PopoverTitle className="text-sm font-semibold text-slate-900">
            Daily budget distribution
          </PopoverTitle>
          <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-500">
            <span>{monthLabel}</span>
            {monthlyBudget > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-slate-700">
                  {formatCompactDailyBudget(monthTotal)} total
                </span>
                {range.max > range.min && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {formatDailyBudgetForCell(range.min)}–
                      {formatDailyBudgetForCell(range.max)}/day
                    </span>
                  </>
                )}
              </>
            )}
            {monthlyBudget <= 0 && (
              <span className="text-amber-700">
                Set a monthly budget to see daily amounts.
              </span>
            )}
          </div>
        </PopoverHeader>

        <div className="px-2 py-2">
          <Calendar
            className="w-full p-0 [--cell-size:2.5rem]"
            mode="single"
            navLayout="around"
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            defaultMonth={displayMonth}
            showOutsideDays
            fixedWeeks
            startMonth={BUDGET_YEAR_START}
            endMonth={BUDGET_YEAR_END}
            classNames={DISTRIBUTION_CALENDAR_CLASS_NAMES}
            components={{
              DayButton: DayButtonComponent,
            }}
          />
        </div>

        <div className="border-t border-slate-100 px-3 py-2">
          <DistributionLegend range={range} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
