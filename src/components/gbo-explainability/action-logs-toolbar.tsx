"use client";

import { Search, X } from "lucide-react";

import { FiltersPopover } from "@/components/gbo-explainability/filters-popover";
import { Input } from "@/components/ui/input";
import type {
  ActiveFilterChip,
  FilterState,
  PageView,
} from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ActionLogsToolbarProps = {
  view: PageView;
  onViewChange: (view: PageView) => void;
  filters: FilterState;
  onFiltersChange: (patch: Partial<FilterState>) => void;
  chips: ActiveFilterChip[];
  onRemoveChip: (chipId: string) => void;
  onClearAll: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  alertCount: number;
};

export function ActionLogsToolbar({
  view,
  onViewChange,
  filters,
  onFiltersChange,
  chips,
  onRemoveChip,
  onClearAll,
  search,
  onSearchChange,
  alertCount,
}: ActionLogsToolbarProps) {
  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Explainability views"
        className="flex gap-6 border-b border-slate-200"
      >
        <TabButton
          active={view === "alerts"}
          onClick={() => onViewChange("alerts")}
          badge={alertCount > 0 ? alertCount : undefined}
        >
          Alerts
        </TabButton>
        <TabButton
          active={view === "action-log"}
          onClick={() => onViewChange("action-log")}
        >
          Action Log
        </TabButton>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full min-w-[18rem] shrink-0 sm:w-[18rem]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              view === "alerts"
                ? "Search alerts"
                : "Search by name or ID"
            }
            className="border-slate-200/80 bg-white pl-9 text-sm shadow-xs placeholder:text-slate-400"
            aria-label={
              view === "alerts" ? "Search alerts" : "Search by entity"
            }
          />
        </div>
        <FiltersPopover
          view={view}
          filters={filters}
          onChange={onFiltersChange}
        />

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="mx-0.5 h-9 w-px shrink-0 bg-slate-200"
              aria-hidden
            />
            {chips.map((chip) => (
              <AppliedFilterChip
                key={chip.id}
                chip={chip}
                onRemove={() => onRemoveChip(chip.id)}
              />
            ))}
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AppliedFilterChip({
  chip,
  onRemove,
}: {
  chip: ActiveFilterChip;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-slate-200/90 bg-white text-xs shadow-xs transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-sm"
    >
      <span className="flex shrink-0 items-center border-r border-slate-100 bg-slate-50/90 px-2.5 py-1.5 font-normal text-slate-500">
        {chip.categoryLabel}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
        <span className="truncate font-medium text-slate-800">
          {chip.valueLabel}
        </span>
        <span
          className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          aria-hidden
        >
          <X className="size-2.5" />
        </span>
      </span>
      <span className="sr-only">Remove {chip.label}</span>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 pt-0.5 text-sm transition-colors",
        active
          ? "border-brand-500 font-semibold text-slate-900"
          : "border-transparent font-medium text-slate-500 hover:border-slate-200 hover:text-slate-700",
      )}
    >
      {children}
      {badge !== undefined ? (
        <span
          className={cn(
            "text-xs font-medium tabular-nums",
            active ? "text-slate-500" : "text-slate-400",
          )}
          aria-label={`${badge} alert${badge === 1 ? "" : "s"}`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
