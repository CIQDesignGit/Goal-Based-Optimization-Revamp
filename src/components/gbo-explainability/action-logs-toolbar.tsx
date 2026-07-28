"use client";

import { Download, Search, X } from "lucide-react";

import { FiltersPopover } from "@/components/gbo-explainability/filters-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AccountOptimizerConfig,
  ActionStatus,
  ActionTab,
  ActiveFilterChip,
  DemoPageState,
  FilterState,
} from "@/lib/gbo-explainability/types";
import { DEMO_STATE_OPTIONS } from "@/lib/gbo-explainability/mock-data";
import { cn } from "@/lib/utils";

type ActionLogsToolbarProps = {
  tab: ActionTab;
  availableTabs: ActionTab[];
  onTabChange: (tab: ActionTab) => void;
  filters: FilterState;
  onFiltersChange: (patch: Partial<FilterState>) => void;
  chips: ActiveFilterChip[];
  onRemoveChip: (chipId: string) => void;
  onClearAll: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  config: AccountOptimizerConfig;
  onExport: () => void;
  onDownloadToday: () => void;
  todayAllyCount: number;
  demoState: DemoPageState;
  onDemoStateChange: (state: DemoPageState) => void;
};

export function ActionLogsToolbar({
  tab,
  availableTabs,
  onTabChange,
  filters,
  onFiltersChange,
  chips,
  onRemoveChip,
  onClearAll,
  search,
  onSearchChange,
  config,
  onExport,
  onDownloadToday,
  todayAllyCount,
  demoState,
  onDemoStateChange,
}: ActionLogsToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Action log views"
        className="flex gap-1 border-b border-border"
      >
        {availableTabs.includes("automation") ? (
          <TabButton
            active={tab === "automation"}
            onClick={() => onTabChange("automation")}
          >
            Automations
          </TabButton>
        ) : null}
        {availableTabs.includes("setup") ? (
          <TabButton
            active={tab === "setup"}
            onClick={() => onTabChange("setup")}
          >
            Setup
          </TabButton>
        ) : null}
      </div>

      {/* Common filters + search + actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            From
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
              className="h-8 w-auto"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            To
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
              className="h-8 w-auto"
            />
          </label>
          <select
            aria-label="Action status"
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            value={filters.actionStatus}
            onChange={(e) =>
              onFiltersChange({
                actionStatus: e.target.value as ActionStatus | "all",
              })
            }
          >
            <option value="all">Any status</option>
            <option value="success">Success</option>
            <option value="failure">Failure / partial</option>
          </select>
          <FiltersPopover
            tab={tab}
            filters={filters}
            config={config}
            onChange={onFiltersChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search campaign, keyword, or ID"
              className="h-8 pl-8"
              aria-label="Search by entity"
            />
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={todayAllyCount === 0}
            title={
              todayAllyCount === 0
                ? "No Ally AI actions today"
                : "Download today's Ally AI changes"
            }
            onClick={onDownloadToday}
          >
            <Download className="size-3.5" />
            Today&apos;s Ally AI
          </Button>
        </div>
      </div>

      {/* Active chips */}
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

      {/* Demo state switcher for empty/unsupported UX */}
      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
        <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
          Demo state
        </span>
        <select
          className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          value={demoState}
          onChange={(e) =>
            onDemoStateChange(e.target.value as DemoPageState)
          }
        >
          {DEMO_STATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand-500 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
