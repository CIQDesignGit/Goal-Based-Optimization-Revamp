"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ListFilter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buildDefaultFilters } from "@/lib/gbo-explainability/filter-entries";
import {
  buildRetailerFilterDefinitions,
  RETAILER_FILTER_SECTION_LABEL,
  type RetailerFilterKey,
} from "@/lib/gbo-explainability/retailer-filter-definitions";
import type {
  AccountOptimizerConfig,
  FilterState,
} from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type FiltersPopoverProps = {
  filters: FilterState;
  config: AccountOptimizerConfig;
  onChange: (patch: Partial<FilterState>) => void;
};

type DraftRetailerFilters = Pick<
  FilterState,
  | "entityType"
  | "campaignType"
  | "matchType"
  | "source"
  | "actionStatus"
  | "actionType"
  | "objective"
  | "strategy"
>;

function pickDraftFilters(filters: FilterState): DraftRetailerFilters {
  return {
    entityType: filters.entityType,
    campaignType: filters.campaignType,
    matchType: filters.matchType,
    source: filters.source,
    actionStatus: filters.actionStatus,
    actionType: filters.actionType,
    objective: filters.objective,
    strategy: filters.strategy,
  };
}

function draftValueForKey(
  draft: DraftRetailerFilters,
  key: RetailerFilterKey,
): string {
  switch (key) {
    case "status":
      return draft.actionStatus;
    case "action":
      return draft.actionType;
    default:
      return draft[key];
  }
}

function patchDraftForKey(
  draft: DraftRetailerFilters,
  key: RetailerFilterKey,
  value: string,
): DraftRetailerFilters {
  switch (key) {
    case "status":
      return {
        ...draft,
        actionStatus: value as FilterState["actionStatus"],
      };
    case "action":
      return {
        ...draft,
        actionType: value as FilterState["actionType"],
      };
    default:
      return { ...draft, [key]: value };
  }
}

function countActiveRetailerFilters(filters: FilterState): number {
  const defaults = buildDefaultFilters();
  return [
    filters.entityType,
    filters.campaignType,
    filters.matchType,
    filters.source,
    filters.objective,
    filters.strategy,
    filters.actionStatus,
    filters.actionType,
  ].filter((value, index) => {
    const defaultValues = [
      defaults.entityType,
      defaults.campaignType,
      defaults.matchType,
      defaults.source,
      defaults.objective,
      defaults.strategy,
      defaults.actionStatus,
      defaults.actionType,
    ];
    return value !== defaultValues[index];
  }).length;
}

export function FiltersPopover({
  filters,
  config,
  onChange,
}: FiltersPopoverProps) {
  const definitions = useMemo(
    () => buildRetailerFilterDefinitions(config),
    [config],
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<RetailerFilterKey | null>(null);
  const [draft, setDraft] = useState<DraftRetailerFilters>(() =>
    pickDraftFilters(filters),
  );

  useEffect(() => {
    if (open) {
      setDraft(pickDraftFilters(filters));
      setQuery("");
      setActiveKey(null);
    }
  }, [open, filters]);

  const filteredDefinitions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return definitions;
    return definitions.filter((definition) =>
      definition.label.toLowerCase().includes(q),
    );
  }, [definitions, query]);

  const activeDefinition =
    filteredDefinitions.find((definition) => definition.key === activeKey) ??
    definitions.find((definition) => definition.key === activeKey) ??
    null;

  const activeCount = countActiveRetailerFilters(filters);

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleCancel = () => {
    setDraft(pickDraftFilters(filters));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 shadow-none" />
        }
      >
        <ListFilter className="size-3.5" />
        Filters
        {activeCount > 0 ? (
          <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-2xs font-semibold text-brand-700">
            {activeCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(42rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl p-0 shadow-lg ring-1 ring-slate-200"
      >
        <div className="flex min-h-[22rem]">
          {/* Left — filter categories */}
          <div className="flex w-[15.5rem] shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for any filter"
                  className="h-8 border-slate-200 pr-8 text-sm shadow-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <p className="px-2 py-1.5 text-xs font-semibold text-slate-800">
                {RETAILER_FILTER_SECTION_LABEL}
              </p>
              <ul className="space-y-0.5">
                {filteredDefinitions.map((definition) => {
                  const isActive = activeKey === definition.key;
                  const selectedValue = draftValueForKey(draft, definition.key);
                  const isApplied = selectedValue !== "all";

                  return (
                    <li key={definition.key}>
                      <button
                        type="button"
                        onClick={() => setActiveKey(definition.key)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-brand-600 text-white"
                            : "text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        <span className="truncate">{definition.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {isApplied && !isActive ? (
                            <span className="size-1.5 rounded-full bg-brand-500" />
                          ) : null}
                          <ChevronRight
                            className={cn(
                              "size-3.5",
                              isActive ? "text-white/90" : "text-slate-400",
                            )}
                            aria-hidden
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right — options for selected filter */}
          <div className="flex min-w-0 flex-1 flex-col bg-white">
            {activeDefinition ? (
              <>
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {activeDefinition.label}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) =>
                        patchDraftForKey(current, activeDefinition.key, "all"),
                      )
                    }
                    className={cn(
                      "mb-1 flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                      draftValueForKey(draft, activeDefinition.key) === "all"
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-slate-700",
                    )}
                  >
                    Any
                  </button>
                  {activeDefinition.options.map((option) => {
                    const selected =
                      draftValueForKey(draft, activeDefinition.key) ===
                      option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setDraft((current) =>
                            patchDraftForKey(
                              current,
                              activeDefinition.key,
                              option.value,
                            ),
                          )
                        }
                        className={cn(
                          "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                          selected
                            ? "bg-brand-50 font-medium text-brand-700"
                            : "text-slate-700",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
                Select a filter to view options
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="shadow-none"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-brand-600 text-white hover:bg-brand-700"
            onClick={handleApply}
          >
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
