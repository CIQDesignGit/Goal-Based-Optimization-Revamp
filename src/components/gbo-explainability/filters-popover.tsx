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
import {
  buildAlertsFilterDefinitions,
  buildCoreFilterDefinitions,
  CORE_FILTER_SECTION_LABEL,
  countActiveCoreFilters,
  coreDraftValueForKey,
  patchCoreDraftForKey,
  pickCoreFilterDraft,
  type CoreFilterDefinition,
  type CoreFilterDraft,
  type CoreFilterKey,
} from "@/lib/gbo-explainability/core-filter-definitions";
import { defaultDateRange } from "@/lib/gbo-explainability/filter-entries";
import type { FilterState, PageView } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type FiltersPopoverProps = {
  view: PageView;
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
};

function isCoreFilterApplied(
  draft: CoreFilterDraft,
  key: CoreFilterKey,
): boolean {
  switch (key) {
    case "dateRange":
      return draft.dateFrom !== "" && draft.dateTo !== "";
    case "optimizerType":
      return draft.strategy !== "all";
    case "actionType":
      return draft.actionType !== "all";
    case "setupStep":
      return draft.setupStep !== "all";
    case "user":
      return draft.user !== "all";
    default:
      return false;
  }
}

function DateRangePanel({
  draft,
  onChange,
}: {
  draft: CoreFilterDraft;
  onChange: (next: CoreFilterDraft) => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1.5">
        <label
          htmlFor="filter-date-from"
          className="text-xs font-medium text-slate-600"
        >
          From
        </label>
        <Input
          id="filter-date-from"
          type="date"
          value={draft.dateFrom}
          onChange={(event) =>
            onChange({ ...draft, dateFrom: event.target.value })
          }
          className="h-8 border-slate-200 text-sm shadow-none"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="filter-date-to"
          className="text-xs font-medium text-slate-600"
        >
          To
        </label>
        <Input
          id="filter-date-to"
          type="date"
          value={draft.dateTo}
          min={draft.dateFrom || undefined}
          onChange={(event) =>
            onChange({ ...draft, dateTo: event.target.value })
          }
          className="h-8 border-slate-200 text-sm shadow-none"
        />
      </div>
      <button
        type="button"
        onClick={() => onChange({ ...draft, dateFrom: "", dateTo: "" })}
        className="text-xs font-medium text-brand-500 hover:underline"
      >
        Clear date range
      </button>
    </div>
  );
}

function OptionsPanel({
  definition,
  draft,
  onSelect,
}: {
  definition: CoreFilterDefinition;
  draft: CoreFilterDraft;
  onSelect: (value: string) => void;
}) {
  const selected = coreDraftValueForKey(draft, definition.key);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "mb-1 flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
          selected === "all"
            ? "bg-brand-50 font-medium text-brand-500"
            : "text-slate-700",
        )}
      >
        Any
      </button>
      {definition.options?.map((option) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
              isSelected
                ? "bg-brand-50 font-medium text-brand-500"
                : "text-slate-700",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FiltersPopover({
  view,
  filters,
  onChange,
}: FiltersPopoverProps) {
  const definitions = useMemo(
    () =>
      view === "alerts"
        ? buildAlertsFilterDefinitions()
        : buildCoreFilterDefinitions(),
    [view],
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<CoreFilterKey | null>(null);
  const [draft, setDraft] = useState<CoreFilterDraft>(() =>
    pickCoreFilterDraft(filters),
  );

  useEffect(() => {
    if (open) {
      setDraft(pickCoreFilterDraft(filters));
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

  const activeCount = countActiveCoreFilters(
    filters,
    view,
    view === "alerts" ? defaultDateRange() : undefined,
  );

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleCancel = () => {
    setDraft(pickCoreFilterDraft(filters));
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
          <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-2xs font-semibold text-brand-600">
            {activeCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(42rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl p-0 shadow-lg ring-1 ring-slate-200"
      >
        <div className="flex min-h-[22rem]">
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
                {CORE_FILTER_SECTION_LABEL}
              </p>
              <ul className="space-y-0.5">
                {filteredDefinitions.map((definition) => {
                  const isActive = activeKey === definition.key;
                  const isApplied = isCoreFilterApplied(draft, definition.key);

                  return (
                    <li key={definition.key}>
                      <button
                        type="button"
                        onClick={() => setActiveKey(definition.key)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-brand-500 text-white"
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

          <div className="flex min-w-0 flex-1 flex-col bg-white">
            {activeDefinition ? (
              <>
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {activeDefinition.label}
                  </p>
                </div>
                {activeDefinition.key === "dateRange" ? (
                  <DateRangePanel
                    draft={draft}
                    onChange={setDraft}
                  />
                ) : (
                  <OptionsPanel
                    definition={activeDefinition}
                    draft={draft}
                    onSelect={(value) =>
                      setDraft((current) =>
                        patchCoreDraftForKey(
                          current,
                          activeDefinition.key,
                          value,
                        ),
                      )
                    }
                  />
                )}
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
            className="bg-brand-500 text-white hover:bg-brand-600"
            onClick={handleApply}
          >
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
