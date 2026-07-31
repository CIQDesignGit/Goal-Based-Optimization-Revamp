"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Funnel, Search } from "lucide-react";

import { ActorMark } from "@/components/gbo-explainability/actor-mark";
import { ContributorAvatar } from "@/components/gbo-explainability/manual-contributors-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { explainabilityActionable, explainabilityInputClass } from "@/lib/gbo-explainability/actionable-styles";
import {
  buildActionLogFilterSections,
  buildAlertsFilterDefinitions,
  CORE_FILTER_SECTION_LABEL,
  countActiveCoreFilters,
  coreDraftValueForKey,
  flattenFilterSections,
  getWhoMadeChangeOptions,
  isAutomationActorFilter,
  isUserFilterActive,
  parseUserFilterValues,
  patchCoreDraftForKey,
  pickCoreFilterDraft,
  serializeUserFilterValues,
  type CoreFilterDefinition,
  type CoreFilterDraft,
  type CoreFilterKey,
  type FilterDefinitionSection,
} from "@/lib/gbo-explainability/core-filter-definitions";
import {
  dateRangePresets,
  dateRangesMatch,
  defaultDateRange,
} from "@/lib/gbo-explainability/filter-entries";
import { MOCK_ACCOUNT_CONFIG, MOCK_ACCOUNT_META } from "@/lib/gbo-explainability/mock-data";
import type {
  AccountOptimizerConfig,
  ActorKind,
  FilterState,
  PageView,
} from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type FiltersPopoverProps = {
  view: PageView;
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  accountConfig?: AccountOptimizerConfig;
  /** Earliest selectable date (account feature-onboarding). */
  minDate?: string;
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
    case "entityScope":
      return draft.entityScope.trim() !== "";
    case "budgetLevel":
      return draft.budgetLevel !== "all";
    case "actionStatus":
      return draft.actionStatus !== "all";
    case "changeStatus":
      return draft.changeStatus !== "all";
    case "actionType":
      return draft.actionType !== "all";
    case "setupStep":
      return draft.setupStep !== "all";
    case "user":
      return isUserFilterActive(draft.user);
    case "failureCategory":
      return draft.failureCategory !== "all";
    case "outOfBudgetOnly":
      return draft.outOfBudgetOnly;
    case "highDeviationOnly":
      return draft.highDeviationOnly;
    case "entityType":
      return draft.entityType !== "all";
    case "campaignType":
      return draft.campaignType !== "all";
    case "matchType":
      return draft.matchType !== "all";
    case "source":
      return draft.source !== "all";
    case "objective":
      return draft.objective !== "all";
    case "strategy":
      return draft.strategy !== "all";
    default:
      return false;
  }
}

function clampDateRange(
  draft: CoreFilterDraft,
  minDate?: string,
): CoreFilterDraft {
  if (!minDate) return draft;

  let { dateFrom, dateTo } = draft;
  if (dateFrom && dateFrom < minDate) dateFrom = minDate;
  if (dateTo && dateTo < minDate) dateTo = minDate;
  if (dateFrom && dateTo && dateFrom > dateTo) dateTo = dateFrom;

  return { ...draft, dateFrom, dateTo };
}

function DateRangePanel({
  draft,
  onChange,
  minDate,
}: {
  draft: CoreFilterDraft;
  onChange: (next: CoreFilterDraft) => void;
  minDate?: string;
}) {
  const currentRange = { dateFrom: draft.dateFrom, dateTo: draft.dateTo };
  const presets = dateRangePresets();

  const applyRange = (range: { dateFrom: string; dateTo: string }) => {
    onChange(clampDateRange({ ...draft, ...range }, minDate));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b border-slate-100 p-2">
        <p className="px-2 py-1 text-xs font-medium text-slate-500">
          Quick ranges
        </p>
        <ul className="space-y-0.5">
          {presets.map((preset) => {
            const isSelected = dateRangesMatch(currentRange, preset.range());

            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => applyRange(preset.range())}
                  className={cn(
                    "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                    isSelected
                      ? explainabilityActionable.optionSelected
                      : "text-slate-700",
                  )}
                >
                  {preset.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-4 p-4">
        {minDate ? (
          <p className="text-xs text-slate-500">
            Earliest date:{" "}
            {new Date(`${minDate}T12:00:00`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        ) : null}
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
            min={minDate}
            onChange={(event) =>
              onChange(
                clampDateRange(
                  { ...draft, dateFrom: event.target.value },
                  minDate,
                ),
              )
            }
            className="border-slate-200 text-sm shadow-none focus-visible:border-slate-400 focus-visible:ring-slate-200/70"
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
            min={draft.dateFrom || minDate || undefined}
            onChange={(event) =>
              onChange(
                clampDateRange(
                  { ...draft, dateTo: event.target.value },
                  minDate,
                ),
              )
            }
            className="border-slate-200 text-sm shadow-none focus-visible:border-slate-400 focus-visible:ring-slate-200/70"
          />
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...draft, dateFrom: "", dateTo: "" })}
          className={cn("text-xs font-medium", explainabilityActionable.textLink)}
        >
          Clear date range
        </button>
      </div>
    </div>
  );
}

function EntityScopePanel({
  draft,
  onChange,
}: {
  draft: CoreFilterDraft;
  onChange: (next: CoreFilterDraft) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <p className="text-xs text-slate-500">
        Filter by keyword, campaign, or SKU name or ID. Matches are
        case-insensitive.
      </p>
      <Input
        value={draft.entityScope}
        onChange={(event) =>
          onChange({ ...draft, entityScope: event.target.value })
        }
        placeholder="e.g. SP-Breakfast or camp-123"
        className="border-slate-200 text-sm shadow-none focus-visible:border-slate-400 focus-visible:ring-slate-200/70"
      />
      <button
        type="button"
        onClick={() => onChange({ ...draft, entityScope: "" })}
        className={cn(
          "self-start text-xs font-medium",
          explainabilityActionable.textLink,
        )}
      >
        Clear expression
      </button>
    </div>
  );
}

function FilterOptionAvatar({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  if (isAutomationActorFilter(value)) {
    const kind = value.slice("actor:".length) as ActorKind;
    return <ActorMark kind={kind} size="sm" />;
  }

  const name = label.replace(/\s*\(deactivated\)\s*$/i, "").trim();
  return <ContributorAvatar name={name} size="sm" />;
}

function FilterOptionCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-violet-500 bg-violet-500 text-white"
          : "border-slate-300 bg-white",
      )}
      aria-hidden
    >
      {checked ? <Check className="size-3 stroke-[2.5]" /> : null}
    </span>
  );
}

function MultiSelectUserOptionsPanel({
  draft,
  onChange,
}: {
  draft: CoreFilterDraft;
  onChange: (user: string) => void;
}) {
  const options = getWhoMadeChangeOptions();
  const allValues = options.map((option) => option.value);
  const selected = parseUserFilterValues(draft.user);
  const allSelected =
    allValues.length > 0 && allValues.every((value) => selected.includes(value));

  const toggleSelectAll = () => {
    onChange(allSelected ? "all" : serializeUserFilterValues(allValues));
  };

  const toggleValue = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(serializeUserFilterValues(next));
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      <button
        type="button"
        onClick={toggleSelectAll}
        aria-pressed={allSelected}
        className="mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
      >
        <FilterOptionCheckbox checked={allSelected} />
        <span className="font-medium text-violet-500">Select all</span>
      </button>

      {options.map((option) => {
        const isSelected = selected.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            aria-pressed={isSelected}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FilterOptionCheckbox checked={isSelected} />
            <FilterOptionAvatar value={option.value} label={option.label} />
            <span className="min-w-0 truncate">{option.label}</span>
          </button>
        );
      })}
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
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "mb-1 flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
          selected === "all" || selected === ""
            ? explainabilityActionable.optionSelected
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
                ? explainabilityActionable.optionSelected
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

function FilterNavSections({
  sections,
  filteredSections,
  activeKey,
  draft,
  onSelect,
}: {
  sections: FilterDefinitionSection[];
  filteredSections: FilterDefinitionSection[];
  activeKey: CoreFilterKey | null;
  draft: CoreFilterDraft;
  onSelect: (key: CoreFilterKey) => void;
}) {
  const visibleSections =
    filteredSections.length > 0 ? filteredSections : sections;

  return (
    <>
      {visibleSections.map((section) => (
        <div key={section.id} className="mb-2">
          <p className="px-2 py-1.5 text-xs font-semibold text-slate-800">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.definitions.map((definition) => {
              const isActive = activeKey === definition.key;
              const isApplied = isCoreFilterApplied(draft, definition.key);

              return (
                <li key={definition.key}>
                  <button
                    type="button"
                    onClick={() => onSelect(definition.key)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      isActive
                        ? explainabilityActionable.navActive
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <span className="truncate">{definition.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {isApplied && !isActive ? (
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            explainabilityActionable.filterDot,
                          )}
                        />
                      ) : null}
                      <ChevronRight
                        className={cn(
                          "size-3.5",
                          isActive
                            ? explainabilityActionable.chevronActive
                            : "text-slate-400",
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
      ))}
    </>
  );
}

export function FiltersPopover({
  view,
  filters,
  onChange,
  accountConfig = MOCK_ACCOUNT_CONFIG,
  minDate = MOCK_ACCOUNT_META.onboardingDate,
}: FiltersPopoverProps) {
  const sections = useMemo(
    () =>
      view === "action-log"
        ? buildActionLogFilterSections(accountConfig)
        : [
            {
              id: "core",
              label: CORE_FILTER_SECTION_LABEL,
              definitions: buildAlertsFilterDefinitions(),
            },
          ],
    [view, accountConfig],
  );

  const definitions = useMemo(
    () => flattenFilterSections(sections),
    [sections],
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
      setActiveKey(definitions[0]?.key ?? null);
    }
  }, [open, filters, definitions]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map((section) => ({
        ...section,
        definitions: section.definitions.filter((definition) =>
          definition.label.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.definitions.length > 0);
  }, [sections, query]);

  const activeDefinition =
    definitions.find((definition) => definition.key === activeKey) ?? null;

  const usesDefaultDateRange = view === "alerts" || view === "action-log";

  const activeCount = countActiveCoreFilters(
    filters,
    view,
    usesDefaultDateRange ? defaultDateRange() : undefined,
  );

  const handleApply = () => {
    onChange(clampDateRange(draft, minDate));
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
          <Button
            variant="outline"
            size="icon"
            aria-label={
              activeCount > 0
                ? `Filters, ${activeCount} active`
                : "Filters"
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
        align="start"
        className="w-[min(42rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-xl p-0 shadow-lg ring-1 ring-slate-200"
      >
        <div className="flex max-h-[min(28rem,calc(100vh-8rem))] min-h-[22rem] overflow-hidden">
          <div className="flex min-h-0 w-[15.5rem] shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="shrink-0 border-b border-slate-200 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for any filter"
                  className={cn(
                    "border-slate-200 pr-8 text-sm shadow-none",
                    explainabilityInputClass,
                  )}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <FilterNavSections
                sections={sections}
                filteredSections={filteredSections}
                activeKey={activeKey}
                draft={draft}
                onSelect={setActiveKey}
              />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
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
                    minDate={minDate}
                  />
                ) : activeDefinition.panel === "text" ? (
                  <EntityScopePanel draft={draft} onChange={setDraft} />
                ) : activeDefinition.multiSelect && activeDefinition.key === "user" ? (
                  <MultiSelectUserOptionsPanel
                    draft={draft}
                    onChange={(user) =>
                      setDraft((current) => ({ ...current, user }))
                    }
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
            className={cn("shadow-none", explainabilityActionable.slateFocus)}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className={explainabilityActionable.primaryButton}
            onClick={handleApply}
          >
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
