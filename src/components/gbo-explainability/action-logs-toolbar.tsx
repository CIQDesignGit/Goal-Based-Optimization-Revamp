"use client";

import { Search, X } from "lucide-react";

import { ExportPopover } from "@/components/gbo-explainability/export-popover";
import { FiltersPopover } from "@/components/gbo-explainability/filters-popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type {
  AccountOptimizerConfig,
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
  config: AccountOptimizerConfig;
  filteredCount: number;
  onExport: () => void;
  onDownloadToday: () => void;
  todayAllyCount: number;
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
  config,
  filteredCount,
  onExport,
  onDownloadToday,
  todayAllyCount,
  alertCount,
}: ActionLogsToolbarProps) {
  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Explainability views"
        className="flex gap-1 border-b border-border"
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

      {view === "action-log" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[18rem] shrink-0 sm:w-[18rem]">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search campaign, keyword, or ID"
                className="h-8 pl-8 text-sm placeholder:whitespace-nowrap"
                aria-label="Search by entity"
              />
            </div>
            <FiltersPopover
              filters={filters}
              config={config}
              onChange={onFiltersChange}
            />
          </div>

          <ExportPopover
            filteredCount={filteredCount}
            todayAllyCount={todayAllyCount}
            onExportFiltered={onExport}
            onExportTodayAlly={onDownloadToday}
          />
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onRemoveChip(chip.id)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              {chip.label}
              <X className="size-3" aria-hidden />
              <span className="sr-only">Remove {chip.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
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
        "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand-500 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {badge !== undefined ? (
        <Badge
          variant={active ? "default" : "secondary"}
          className="min-w-5 px-1.5"
          aria-label={`${badge} alert${badge === 1 ? "" : "s"}`}
        >
          {badge}
        </Badge>
      ) : null}
    </button>
  );
}
