"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Funnel, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import {
  ATTRIBUTION_OPTIONS,
  BRAND_OPTIONS,
  buildDashboardFilterChips,
  buildDefaultDashboardFilters,
  countActiveDashboardFilters,
  formatFilterDateRange,
  RETAILER_OPTIONS,
  type AttributionWindow,
  type DashboardFilters,
} from "@/lib/home/dashboard-filters";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";
import { cn } from "@/lib/utils";

/**
 * Explainability-style Filters control: funnel button opens a popover.
 * Sit this on the right of the toolbar row (tabs live above).
 */
export function DashboardFiltersBar() {
  const filters = usePacingDashboardStore((s) => s.filters);
  const setFilters = usePacingDashboardStore((s) => s.setFilters);
  const resetFilters = usePacingDashboardStore((s) => s.resetFilters);

  const activeCount = countActiveDashboardFilters(filters);
  const chips = buildDashboardFilterChips(filters);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5 px-4 md:px-5">
      {chips.length > 0 ? (
        <div className="mr-auto flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <AppliedFilterChip
              key={chip.id}
              categoryLabel={chip.categoryLabel}
              valueLabel={chip.valueLabel}
              onRemove={() => removeChip(chip.id, setFilters)}
            />
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium",
              explainabilityActionable.clearLink,
            )}
          >
            Clear all
          </button>
        </div>
      ) : null}

      <DashboardFiltersPopover
        filters={filters}
        activeCount={activeCount}
        onChange={setFilters}
        onReset={resetFilters}
      />
    </div>
  );
}

function removeChip(
  id: string,
  setFilters: (patch: Partial<DashboardFilters>) => void,
) {
  const defaults = buildDefaultDashboardFilters();
  if (id === "retailer") setFilters({ retailer: defaults.retailer });
  if (id === "brand") setFilters({ brandId: defaults.brandId });
  if (id === "date") {
    setFilters({ dateFrom: defaults.dateFrom, dateTo: defaults.dateTo });
  }
  if (id === "attribution") {
    setFilters({ attributionWindow: defaults.attributionWindow });
  }
}

function DashboardFiltersPopover({
  filters,
  activeCount,
  onChange,
  onReset,
}: {
  filters: DashboardFilters;
  activeCount: number;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Draft = edits inside the popover before Apply (same idea as Explainability).
  const [draft, setDraft] = useState<DashboardFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const patchDraft = (patch: Partial<DashboardFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={
              activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"
            }
            className={cn(
              "relative size-9 shadow-none",
              explainabilityActionable.slateFocus,
            )}
          />
        }
      >
        <Funnel className="size-4" />
        {activeCount > 0 ? (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-semibold leading-none tabular-nums",
              explainabilityActionable.countBadge,
            )}
          >
            {activeCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl p-0 shadow-lg ring-1 ring-slate-200"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Applies to Executive Summary and Pacing
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <FieldSelect
            label="Retailer"
            value={draft.retailer}
            options={RETAILER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(value) => patchDraft({ retailer: value })}
          />
          <FieldSelect
            label="Brand"
            value={draft.brandId}
            options={BRAND_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(value) => patchDraft({ brandId: value })}
          />
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-600">
              Date range
            </span>
            <div
              className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-700"
              aria-label={`Date range ${formatFilterDateRange(draft)}`}
            >
              <CalendarDays className="size-4 shrink-0 text-slate-500" />
              <span className="truncate">{formatFilterDateRange(draft)}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Prototype uses a fixed 14-day window (Jul 15–28, 2026).
            </p>
          </div>
          <FieldSelect
            label="Attribution"
            value={draft.attributionWindow}
            options={ATTRIBUTION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(value) =>
              patchDraft({ attributionWindow: value as AttributionWindow })
            }
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onReset();
              setDraft(buildDefaultDashboardFilters());
              setOpen(false);
            }}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium",
              explainabilityActionable.clearLink,
            )}
          >
            Reset
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shadow-none"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className={cn(explainabilityActionable.primaryButton, "shadow-none")}
              onClick={apply}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-800 outline-none focus-visible:border-slate-400 focus-visible:ring-3 focus-visible:ring-slate-200/70"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AppliedFilterChip({
  categoryLabel,
  valueLabel,
  onRemove,
}: {
  categoryLabel: string;
  valueLabel: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-slate-200/90 bg-white text-xs shadow-xs transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-sm"
    >
      <span className="flex shrink-0 items-center px-2.5 py-1.5 font-normal text-slate-500">
        {categoryLabel}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
        <span className="truncate font-medium text-slate-800">{valueLabel}</span>
        <span
          className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          aria-hidden
        >
          <X className="size-2.5" />
        </span>
      </span>
      <span className="sr-only">
        Remove {categoryLabel} {valueLabel}
      </span>
    </button>
  );
}
