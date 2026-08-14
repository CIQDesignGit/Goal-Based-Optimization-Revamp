"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PERIOD_DATE_PRESETS,
  type PeriodDatePresetId,
} from "@/lib/home/period-date-presets";
import { cn } from "@/lib/utils";

type PeriodDatePresetPickerProps = {
  value: PeriodDatePresetId;
  onChange: (id: PeriodDatePresetId) => void;
  /** Popover alignment relative to the trigger (default end). */
  align?: "start" | "center" | "end";
};

/**
 * Compact date-period dropdown (Current Month / Quarter / Half Year / Year).
 */
export function PeriodDatePresetPicker({
  value,
  onChange,
  align = "end",
}: PeriodDatePresetPickerProps) {
  const [open, setOpen] = useState(false);
  const label =
    PERIOD_DATE_PRESETS.find((p) => p.id === value)?.label ??
    PERIOD_DATE_PRESETS[0].label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none"
          />
        }
      >
        <CalendarDays className="size-3.5 shrink-0 text-slate-500" />
        {label}
        <ChevronDown className="size-3.5 text-slate-400" />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto min-w-68 gap-0 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md ring-0"
      >
        <ul className="flex flex-col" role="listbox" aria-label="Date period">
          {PERIOD_DATE_PRESETS.map((preset) => {
            const selected = preset.id === value;
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full rounded-md px-3 py-2 text-left text-sm text-slate-800 transition-colors",
                    selected
                      ? "bg-slate-100 font-medium"
                      : "hover:bg-slate-50",
                  )}
                  onClick={() => {
                    onChange(preset.id);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
