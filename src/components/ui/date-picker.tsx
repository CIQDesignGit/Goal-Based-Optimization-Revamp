"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_PICKER_CALENDAR_CLASSNAME = cn(
  "w-full p-0 [--cell-size:2.25rem] [--cell-radius:var(--radius-md)]",
);

const DATE_PICKER_CALENDAR_CLASS_NAMES = {
  months: "w-full",
  month:
    "grid w-full grid-cols-[var(--cell-size)_1fr_var(--cell-size)] grid-rows-[auto_1fr] gap-y-2",
  button_previous:
    "col-start-1 row-start-1 size-8 shrink-0 justify-self-start rounded-md p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  button_next:
    "col-start-3 row-start-1 size-8 shrink-0 justify-self-end rounded-md p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  month_caption:
    "col-start-2 row-start-1 flex h-8 items-center justify-center px-0",
  caption_label: "text-sm font-semibold text-slate-900",
  month_grid: "col-span-3 row-start-2 w-full",
  weekdays: "flex w-full",
  weekday:
    "flex-1 basis-0 text-center text-[11px] font-medium text-slate-500 select-none",
  weeks: "w-full",
  week: "mt-0.5 flex w-full",
  day: "flex-1 basis-0 aspect-auto p-0",
} satisfies React.ComponentProps<typeof Calendar>["classNames"];

function resolveCalendarOpenMonth(
  value: Date | undefined,
  openToMonth: Date | undefined,
): Date {
  if (value && openToMonth) {
    return value < openToMonth ? openToMonth : value;
  }

  return value ?? openToMonth ?? new Date();
}

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  dateFormat?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Month to show when opening — used when value is missing or earlier than this. */
  openToMonth?: Date;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect" | "onMonthChange"
  >;
};

/** shadcn date picker — Popover + Button + Calendar composition. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
  openToMonth,
  calendarProps,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(
    resolveCalendarOpenMonth(value, openToMonth),
  );

  React.useEffect(() => {
    if (open) {
      setMonth(resolveCalendarOpenMonth(value, openToMonth));
    }
  }, [open, value, openToMonth]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            aria-label={ariaLabel}
            data-empty={!value}
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 px-2.5 text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" className="text-slate-400" />
        {value ? (
          format(value, dateFormat)
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <div className="px-3 py-2.5">
          <Calendar
            mode="single"
            selected={value}
            month={month}
            onMonthChange={setMonth}
            defaultMonth={value}
            captionLayout="label"
            navLayout="around"
            showOutsideDays
            fixedWeeks
            className={DATE_PICKER_CALENDAR_CLASSNAME}
            classNames={DATE_PICKER_CALENDAR_CLASS_NAMES}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            {...calendarProps}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
