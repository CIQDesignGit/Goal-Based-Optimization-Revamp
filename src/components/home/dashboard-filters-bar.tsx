"use client";

import { useState } from "react";
import { ChevronRight, Download, Info, PlusCircle, X } from "lucide-react";

import { PeriodDatePresetPicker } from "@/components/home/period-date-preset-picker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DATA_SOURCE_OPTIONS,
  type DataSourceId,
} from "@/lib/home/dashboard-filters";
import { downloadPacingReportPdf } from "@/lib/home/download-pacing-pdf";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";
import { cn } from "@/lib/utils";

/**
 * Filter bar:
 * - Analytics (first tab): Add filter (left) + Personal Mode (right)
 * - Executive Summary (second tab): period date (left) + Download PDF (right)
 */
export function DashboardFiltersBar() {
  const tab = usePacingDashboardStore((s) => s.tab);
  const personalMode = usePacingDashboardStore((s) => s.personalMode);
  const setPersonalMode = usePacingDashboardStore((s) => s.setPersonalMode);
  const dataSources = usePacingDashboardStore((s) => s.dataSources);
  const addDataSource = usePacingDashboardStore((s) => s.addDataSource);
  const removeDataSource = usePacingDashboardStore((s) => s.removeDataSource);
  const clearDataSources = usePacingDashboardStore((s) => s.clearDataSources);
  const periodDatePreset = usePacingDashboardStore((s) => s.periodDatePreset);
  const setPeriodDatePreset = usePacingDashboardStore(
    (s) => s.setPeriodDatePreset,
  );

  const chips = DATA_SOURCE_OPTIONS.filter((opt) =>
    dataSources.includes(opt.id),
  );

  // Analytics tab: Add filter + Personal Mode
  if (tab === "executive-summary") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <DashboardFiltersPopover
            selectedIds={dataSources}
            onSelect={(id) => addDataSource(id)}
          />

          {chips.length > 0 ? (
            <>
              {chips.map((chip) => (
                <AppliedFilterChip
                  key={chip.id}
                  abbr={chip.abbr}
                  label={chip.label}
                  onRemove={() => removeDataSource(chip.id)}
                />
              ))}
              <button
                type="button"
                onClick={clearDataSources}
                className="rounded-md px-2 py-1.5 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                Clear all
              </button>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              checked={personalMode}
              onCheckedChange={setPersonalMode}
              aria-label="Personal Mode"
              className="data-checked:bg-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Personal Mode
            </span>
            <Tooltip>
              <TooltipTrigger
                className="inline-flex text-slate-400 transition-colors hover:text-slate-600"
                aria-label="About Personal Mode"
              >
                <Info className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="end"
                className="max-w-[260px] flex-col items-start gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-800 shadow-md [&>div:last-child]:hidden"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Personal Mode
                </p>
                <p className="text-xs font-normal leading-relaxed text-slate-600">
                  Show insights and recommendations tailored to your role and
                  saved preferences
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  // Executive Summary tab: period date + Download PDF
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <PeriodDatePresetPicker
          value={periodDatePreset}
          onChange={setPeriodDatePreset}
          align="start"
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadPacingReportPdf}
          className="h-8 gap-1.5 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-50"
        >
          <Download className="size-3.5 text-slate-500" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

function DashboardFiltersPopover({
  selectedIds,
  onSelect,
}: {
  selectedIds: DataSourceId[];
  onSelect: (id: DataSourceId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Add filter"
            aria-expanded={open}
            className={cn(
              "h-8 gap-1.5 rounded-full px-3 text-sm font-medium shadow-none",
              open
                ? "border-brand-500 bg-brand-500 text-white hover:border-brand-600 hover:bg-brand-600 hover:text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          />
        }
      >
        <PlusCircle
          className={cn("size-4", open ? "text-white" : "text-slate-500")}
        />
        Add filter
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(20rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-lg border-0 p-0 shadow-xl ring-0"
      >
        <div className="flex items-center justify-between bg-slate-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Filters</h3>
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="rounded p-0.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="bg-white px-4 py-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Filter by Data Source
          </p>
          <ul className="flex flex-col">
            {DATA_SOURCE_OPTIONS.map((opt) => {
              const selected = selectedIds.includes(opt.id);
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled={selected}
                    onClick={() => {
                      onSelect(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md py-2.5 text-left transition-colors",
                      selected
                        ? "cursor-default opacity-50"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-2xs font-semibold text-slate-600">
                      {opt.abbr}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-slate-700">
                      {opt.label}
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-slate-400"
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AppliedFilterChip({
  abbr,
  label,
  onRemove,
}: {
  abbr: string;
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-xs shadow-xs transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-sm"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
        {abbr}
      </span>
      <span className="truncate font-medium text-slate-800">{label}</span>
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        aria-hidden
      >
        <X className="size-2.5" />
      </span>
      <span className="sr-only">Remove {label}</span>
    </button>
  );
}
