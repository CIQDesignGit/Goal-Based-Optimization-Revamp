"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  ListTree,
  type LucideIcon,
} from "lucide-react";
import {
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { useTaxonomyScopeLevels } from "@/components/gbo-optimization/taxonomy-scope-columns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AGGRESSIVENESS_OPTIONS,
  ENTIRE_BUSINESS_SCOPE_ID,
  getBudgetDefinitionLabel,
  getGoalTypeLabel,
  getLevelLabel,
  getOptimizerLabel,
  getScopeTaxonomyValue,
  GOALS_SCOPE_ROWS,
} from "@/lib/gbo-optimization/setup-data";
import {
  getScopeIdentity,
  type ScopeIdentity,
} from "@/lib/gbo-optimization/scope-tree";
import {
  groupChangesByStep,
  hasTaxonomyChanged,
  SETUP_CHANGE_CATEGORY_LABELS,
  useSetupSessionStore,
  type ChangeLedgerEntry,
  type SetupChangeCategory,
  type TaxonomySnapshot,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const CATEGORY_BADGE_CLASS: Record<SetupChangeCategory, string> = {
  goal: "bg-brand-50 text-brand-700 hover:bg-brand-50",
  budget: "bg-sky-50 text-sky-700 hover:bg-sky-50",
  constraint: "bg-violet-50 text-violet-700 hover:bg-violet-50",
  seasonality: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  general: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  optimizer: "bg-blue-50 text-blue-700 hover:bg-blue-50",
};

/** How line-item changes are arranged in the Summary review widget. */
type LineItemChangesView = "by-steps" | "by-impact";

const LINE_ITEM_VIEW_OPTIONS: {
  id: LineItemChangesView;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "by-steps", label: "By steps", icon: ListTree },
  { id: "by-impact", label: "By impact", icon: Layers },
];

function formatChangeValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
}

/** Group ledger rows by brand/scope so each line item lists its impacts. */
function groupChangesByScope(
  ledger: ChangeLedgerEntry[],
): { scopeId: string; scopeName: string; entries: ChangeLedgerEntry[] }[] {
  const grouped = new Map<
    string,
    { scopeId: string; scopeName: string; entries: ChangeLedgerEntry[] }
  >();

  for (const entry of ledger) {
    const existing = grouped.get(entry.scopeId);

    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    grouped.set(entry.scopeId, {
      scopeId: entry.scopeId,
      scopeName: entry.scopeName,
      entries: [entry],
    });
  }

  // Most-changed line items first — easier to scan before Save & Launch.
  return Array.from(grouped.values()).sort(
    (left, right) => right.entries.length - left.entries.length,
  );
}

function uniqueCategories(
  entries: ChangeLedgerEntry[],
): SetupChangeCategory[] {
  const categories: SetupChangeCategory[] = [];

  for (const entry of entries) {
    if (!categories.includes(entry.category)) {
      categories.push(entry.category);
    }
  }

  return categories;
}

/**
 * Tag for the scope level of a change:
 * Entire Business / Level 1 dimension / Level 2 dimension.
 * Level 1 (+ entire business) = filled; Level 2 = outline only.
 */
function ScopeLevelTag({
  identity,
  label: labelOverride,
  className,
}: {
  identity: ScopeIdentity;
  /** When set (e.g. seasonality Scope dropdown), wins over identity defaults. */
  label?: string;
  className?: string;
}) {
  const label =
    labelOverride ??
    (identity.editLevel === "entire-business"
      ? "Entire Business"
      : identity.editLevel === "level1"
        ? identity.level1Label
        : identity.level2Label);

  const isLevel1 =
    identity.editLevel === "level1" ||
    identity.editLevel === "entire-business";

  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        isLevel1
          ? "bg-slate-200 text-slate-800"
          : "border border-slate-300 bg-transparent text-slate-600",
        className,
      )}
      title={label}
    >
      {label}
    </span>
  );
}

/**
 * Secondary hierarchy cue under a line item — labeled L1 / L2 path only.
 * The edit-level tag sits in its own column (see ScopeLevelTag).
 */
function ScopeHierarchyCue({
  scopeId,
  className,
}: {
  scopeId: string;
  className?: string;
}) {
  const identity = useScopeIdentityForId(scopeId);

  if (identity.editLevel === "entire-business") {
    return (
      <p
        className={cn(
          "mt-0.5 text-xs leading-snug text-slate-400",
          className,
        )}
      >
        Rollup row
      </p>
    );
  }

  const fullTitle = [
    `${identity.level1Label}: ${identity.level1Value}`,
    identity.level2Value
      ? `${identity.level2Label}: ${identity.level2Value}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <p
      className={cn(
        "mt-0.5 flex min-w-0 flex-wrap items-center text-xs leading-snug",
        className,
      )}
      title={fullTitle}
    >
      <ScopeHierarchyPath identity={identity} />
    </p>
  );
}

/** L1 / L2 path values only — dimension labels live on the row tag column. */
function ScopeHierarchyPath({ identity }: { identity: ScopeIdentity }) {
  const editedAtLevel1 = identity.editLevel === "level1";
  const editedAtLevel2 = identity.editLevel === "level2";

  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1 text-slate-500">
      <span
        className={cn(
          "wrap-break-word",
          editedAtLevel1
            ? "font-medium text-slate-700"
            : "font-normal text-slate-500",
        )}
      >
        {identity.level1Value || "—"}
      </span>

      <span className="text-slate-300" aria-hidden>
        /
      </span>

      {editedAtLevel1 ? null : (
        <span
          className={cn(
            "wrap-break-word",
            editedAtLevel2
              ? "font-medium text-slate-700"
              : "font-normal text-slate-500",
          )}
        >
          {identity.level2Value || "—"}
        </span>
      )}
    </span>
  );
}

function useScopeIdentityForId(scopeId: string): ScopeIdentity {
  const { level1Key, level2Key, level1Label, level2Label } =
    useTaxonomyScopeLevels();

  return useMemo(
    () =>
      getScopeIdentity(
        scopeId,
        level1Key,
        level2Key,
        level1Label,
        level2Label,
        GOALS_SCOPE_ROWS,
      ),
    [scopeId, level1Key, level2Key, level1Label, level2Label],
  );
}

/** Level 1 / Level 2 dimension names — plain text under accordion headers. */
function TaxonomyLevelsHint({ className }: { className?: string }) {
  const { level1Label, level2Label } = useTaxonomyScopeLevels();

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-slate-500",
        className,
      )}
      aria-label={`${level1Label} / ${level2Label}`}
    >
      <span>{level1Label}</span>
      <span className="text-slate-300" aria-hidden>
        /
      </span>
      <span>{level2Label}</span>
    </p>
  );
}

function TaxonomyDiffRow({
  label,
  from,
  to,
}: {
  label: string;
  from: string;
  to: string;
}) {
  const changed = from !== to;

  return (
    <li className="grid gap-2 border-b border-brand-100 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        {changed ? (
          <>
            <span className="text-slate-500 line-through decoration-slate-300">
              {from}
            </span>
            <ArrowRight
              className="size-3.5 shrink-0 text-brand-400"
              aria-hidden
            />
            <span className="font-semibold text-brand-700">{to}</span>
          </>
        ) : (
          <span className="text-slate-600">{to}</span>
        )}
      </div>
    </li>
  );
}

/** Structural taxonomy change — elevated above other summary sections. */
function OrganizationChangeSection({
  previous,
  next,
}: {
  previous: TaxonomySnapshot;
  next: TaxonomySnapshot;
}) {
  const previousType = getBudgetDefinitionLabel(previous.budgetType);
  const nextType = getBudgetDefinitionLabel(next.budgetType);
  const previousLevel1 = getLevelLabel(previous.budgetType, previous.level1);
  const nextLevel1 = getLevelLabel(next.budgetType, next.level1);
  const previousLevel2 = getLevelLabel(previous.budgetType, previous.level2);
  const nextLevel2 = getLevelLabel(next.budgetType, next.level2);

  return (
    <section
      aria-labelledby="organization-change-heading"
      className="overflow-hidden rounded-lg border border-brand-200 border-l-4 border-l-brand-500 bg-white shadow-sm"
    >
      <div className="border-b border-brand-100 bg-brand-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle
            className="size-4 shrink-0 text-brand-600"
            aria-hidden
          />
          <h3
            id="organization-change-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Organization change
          </h3>
          <Badge
            variant="secondary"
            className="bg-warning-100 font-normal text-warning-700 hover:bg-warning-100"
          >
            Effective next day
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          How your budget Scope is organized. This reshapes the hierarchy used
          across Goals &amp; Budgets and later steps.
        </p>
      </div>

      <ul className="divide-y divide-brand-50 bg-white">
        <TaxonomyDiffRow
          label="Definition type"
          from={previousType}
          to={nextType}
        />
        <TaxonomyDiffRow
          label="Level 1"
          from={previousLevel1}
          to={nextLevel1}
        />
        <TaxonomyDiffRow
          label="Level 2"
          from={previousLevel2}
          to={nextLevel2}
        />
      </ul>
    </section>
  );
}

function ChangeRow({
  entry,
  hideScope = false,
}: {
  entry: ChangeLedgerEntry;
  /** When true, skip brand name — parent accordion already shows the line item. */
  hideScope?: boolean;
}) {
  const identity = useScopeIdentityForId(entry.scopeId);
  // Seasonality stores the form Scope label on the ledger entry.
  const tagLabel =
    entry.category === "seasonality" ? entry.scopeName : undefined;

  const isSeasonalityAdd = entry.field.startsWith("seasonality.add.");
  const seasonalityAdd = isSeasonalityAdd
    ? resolveSeasonalityAddDisplay(entry)
    : null;

  return (
    <li className="grid gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,2.2fr)_auto_minmax(0,1.2fr)] sm:items-start sm:gap-3">
      {/* Col 1 — scope level of the change (Entire Business / L1 / L2) */}
      <div className="sm:pt-0.5">
        <ScopeLevelTag identity={identity} label={tagLabel} />
      </div>

      <div className="min-w-0">
        {!hideScope ? (
          <>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium wrap-break-word text-slate-900">
                {identity.primaryName}
              </p>
              <p className="text-xs wrap-break-word text-slate-500">
                {entry.fieldLabel}
              </p>
            </div>
            <ScopeHierarchyCue scopeId={entry.scopeId} />
          </>
        ) : (
          <p className="text-sm font-medium wrap-break-word text-slate-900">
            {entry.fieldLabel}
          </p>
        )}
      </div>

      <div className="sm:justify-self-start sm:pt-0.5">
        <Badge
          variant="secondary"
          className={cn(
            "font-normal",
            CATEGORY_BADGE_CLASS[entry.category],
          )}
        >
          {SETUP_CHANGE_CATEGORY_LABELS[entry.category]}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm tabular-nums sm:justify-end sm:pt-0.5">
        {seasonalityAdd ? (
          // Additions: title + dates + Added tag (no “—” → arrow)
          <div className="flex min-w-0 flex-col items-end gap-1 text-right">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="font-medium wrap-break-word text-slate-900">
                {seasonalityAdd.name}
              </span>
              <Badge
                variant="secondary"
                className="border border-emerald-200 bg-emerald-50 font-normal text-emerald-700"
              >
                Added
              </Badge>
            </div>
            {seasonalityAdd.dates ? (
              <span className="text-xs leading-snug text-slate-500">
                {seasonalityAdd.dates}
              </span>
            ) : null}
          </div>
        ) : (
          <>
            <span className="text-slate-500 line-through decoration-slate-300">
              {formatChangeValue(entry.from)}
            </span>
            <ArrowRight
              className="size-3.5 shrink-0 text-slate-400"
              aria-hidden
            />
            <span className="font-medium text-slate-900">
              {formatChangeValue(entry.to)}
            </span>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Seasonality “add” rows: title on top, dates underneath.
 * Supports new ledger shape (to=name, from=dates) and older “name · dates · …” labels.
 */
function resolveSeasonalityAddDisplay(entry: ChangeLedgerEntry): {
  name: string;
  dates: string | null;
} {
  const from = entry.from.trim();
  const to = entry.to.trim();

  // New shape: to is the event name; from is the date range (or "—").
  if (!to.includes(" · ")) {
    return {
      name: to || "New event",
      dates: !from || from === "—" ? null : from,
    };
  }

  // Legacy: "Name · Jul 08, 2026 → Jul 08, 2026 · percent 0"
  const parts = to
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  const datePart = parts.find((part) => part.includes("→")) ?? null;
  const name =
    parts.find(
      (part) =>
        part !== datePart && !/^(percent|absolute)\b/i.test(part),
    ) ??
    parts[0] ??
    to;

  return {
    name: name || "New event",
    dates: datePart,
  };
}

function ChangesAccordionSection({
  label,
  entries,
  hideScopeInRows = false,
  categories,
  scopeId,
}: {
  label: string;
  entries: ChangeLedgerEntry[];
  hideScopeInRows?: boolean;
  categories?: SetupChangeCategory[];
  /** When set (By impact view), show Level 1 / Level 2 values under the line item name. */
  scopeId?: string;
}) {
  // Always start collapsed — user opens the sections they care about.
  const [open, setOpen] = useState(false);
  /** Empty = show all. Otherwise only matching categories. */
  const [activeCategories, setActiveCategories] = useState<
    SetupChangeCategory[]
  >([]);

  const scopeIdentity = useScopeIdentityForId(
    scopeId ?? ENTIRE_BUSINESS_SCOPE_ID,
  );
  const headingLabel = scopeId ? scopeIdentity.primaryName : label;
  // When grouping seasonality by the form Scope, show that label on the tag.
  const scopeTagLabel =
    scopeId && entries[0]?.category === "seasonality"
      ? entries[0].scopeName
      : undefined;

  const availableCategories = categories ?? uniqueCategories(entries);

  const visibleEntries = useMemo(() => {
    if (activeCategories.length === 0) {
      return entries;
    }

    return entries.filter((entry) =>
      activeCategories.includes(entry.category),
    );
  }, [entries, activeCategories]);

  const toggleOpen = () => setOpen((current) => !current);

  const onHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleOpen();
    }
  };

  const toggleCategory = (
    category: SetupChangeCategory,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    // Don't also toggle the accordion when clicking a filter chip.
    event.stopPropagation();

    setActiveCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      return [...current, category];
    });

    // Expanding helps the user see what the filter did.
    setOpen(true);
  };

  const changeCountLabel =
    activeCategories.length > 0 &&
    visibleEntries.length !== entries.length
      ? `${visibleEntries.length} of ${entries.length}`
      : `${entries.length} change${entries.length === 1 ? "" : "s"}`;

  return (
    // Flat section — no nested card. Parent widget owns the outer border.
    <div>
      {/* Whole header row toggles open/closed; filter chips stop the click */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? `Collapse ${headingLabel}` : `Expand ${headingLabel}`}
        onClick={toggleOpen}
        onKeyDown={onHeaderKeyDown}
        className={cn(
          "flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3",
          "transition-colors hover:bg-slate-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-inset",
          open && "border-b border-slate-100",
        )}
      >
        <div className="flex min-w-0 flex-1 items-stretch gap-2.5">
          {/* Tall bar spans title + taxonomy hint under it */}
          <span
            className="w-1 shrink-0 self-stretch rounded-full bg-brand-500"
            aria-hidden
          />
          <div className="min-w-0 space-y-1 py-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {scopeId ? (
                <ScopeLevelTag
                  identity={scopeIdentity}
                  label={scopeTagLabel}
                />
              ) : null}
              <h3 className="text-sm font-semibold wrap-break-word text-slate-900">
                {headingLabel}
              </h3>
            </div>
            {scopeId ? (
              <ScopeHierarchyCue scopeId={scopeId} />
            ) : (
              <TaxonomyLevelsHint />
            )}
          </div>
        </div>

        <div className="flex max-w-[55%] shrink-0 flex-wrap items-center justify-end gap-1.5 self-start pt-0.5">
          {/* Category chips — click to filter this section's rows */}
          {availableCategories.map((category) => {
            const isFiltered = activeCategories.length > 0;
            const isActive =
              !isFiltered || activeCategories.includes(category);

            return (
              <button
                key={`${label}-${category}`}
                type="button"
                aria-pressed={activeCategories.includes(category)}
                title={
                  activeCategories.includes(category)
                    ? `Clear ${SETUP_CHANGE_CATEGORY_LABELS[category]} filter`
                    : `Show only ${SETUP_CHANGE_CATEGORY_LABELS[category]} changes`
                }
                onClick={(event) => toggleCategory(category, event)}
                className={cn(
                  "inline-flex h-5 items-center rounded-full px-2 text-xs font-normal transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  CATEGORY_BADGE_CLASS[category],
                  isActive
                    ? "opacity-100 ring-1 ring-slate-300/70"
                    : "opacity-35 hover:opacity-70",
                  activeCategories.includes(category) &&
                    "ring-2 ring-slate-400/50",
                )}
              >
                {SETUP_CHANGE_CATEGORY_LABELS[category]}
              </button>
            );
          })}

          <Badge
            variant="outline"
            className="border-slate-300 bg-white font-normal text-slate-600"
          >
            {changeCountLabel}
          </Badge>

          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-500 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </div>
      </div>

      {open && (
        <ul className="divide-y divide-slate-100 bg-white px-4">
          {visibleEntries.length > 0 ? (
            visibleEntries.map((entry) => (
              <ChangeRow
                key={entry.id}
                entry={entry}
                hideScope={hideScopeInRows}
              />
            ))
          ) : (
            <li className="py-6 text-center text-sm text-slate-500">
              No changes match the selected filters.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Toggle + list of line-item changes (steps vs impact). Taxonomy stays outside. */
function LineItemChangesWidget({
  changeLedger,
}: {
  changeLedger: ChangeLedgerEntry[];
}) {
  const [view, setView] = useState<LineItemChangesView>("by-steps");

  const groupedByStep = useMemo(
    () => groupChangesByStep(changeLedger),
    [changeLedger],
  );

  const { level1Key, level2Key } = useTaxonomyScopeLevels();

  // Sort By impact groups the same way as Goals tables: Level 1 then Level 2.
  const groupedByScope = useMemo(() => {
    const groups = groupChangesByScope(changeLedger);

    return [...groups].sort((left, right) => {
      const leftRow = GOALS_SCOPE_ROWS.find((row) => row.id === left.scopeId);
      const rightRow = GOALS_SCOPE_ROWS.find((row) => row.id === right.scopeId);

      if (!leftRow || !rightRow) {
        return left.scopeName.localeCompare(right.scopeName);
      }

      if (left.scopeId === ENTIRE_BUSINESS_SCOPE_ID) return -1;
      if (right.scopeId === ENTIRE_BUSINESS_SCOPE_ID) return 1;

      const left1 = getScopeTaxonomyValue(leftRow, level1Key);
      const right1 = getScopeTaxonomyValue(rightRow, level1Key);
      if (left1 !== right1) return left1.localeCompare(right1);

      const left2 = getScopeTaxonomyValue(leftRow, level2Key);
      const right2 = getScopeTaxonomyValue(rightRow, level2Key);
      return left2.localeCompare(right2);
    });
  }, [changeLedger, level1Key, level2Key]);

  return (
    <section
      aria-labelledby="line-item-changes-heading"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {/* Title + compact view switch — switcher stays secondary (not a second content block) */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h3
            id="line-item-changes-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Line item changes
          </h3>
          <span className="text-xs tabular-nums text-slate-500">
            {changeLedger.length}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Line item changes view"
          className="inline-flex shrink-0 rounded-md bg-slate-200/70 p-0.5"
        >
          {LINE_ITEM_VIEW_OPTIONS.map((option) => {
            const isSelected = view === option.id;
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setView(option.id)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  isSelected
                    ? "bg-white font-semibold text-slate-900 shadow-xs"
                    : "font-medium text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    isSelected ? "text-brand-600" : "text-slate-400",
                  )}
                  aria-hidden
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* One list under the title — dividers only, no nested bordered cards */}
      <div className="divide-y divide-slate-200 bg-white">
        {view === "by-steps"
          ? groupedByStep.map((group) => (
              <ChangesAccordionSection
                key={group.step}
                label={group.label}
                entries={group.entries}
                categories={uniqueCategories(group.entries)}
              />
            ))
          : groupedByScope.map((group) => (
              <ChangesAccordionSection
                key={group.scopeId}
                label={group.scopeName}
                scopeId={group.scopeId}
                entries={group.entries}
                hideScopeInRows
                categories={uniqueCategories(group.entries)}
              />
            ))}
      </div>
    </section>
  );
}

export function SummaryStep() {
  const { optimizerType } = useSetupContext();
  const generalConfig = useSetupSessionStore((state) => state.generalConfig);
  const taxonomyBaseline = useSetupSessionStore(
    (state) => state.taxonomyBaseline,
  );
  const changeLedger = useSetupSessionStore((state) => state.changeLedger);
  const summaryReviewed = useSetupSessionStore((state) => state.summaryReviewed);
  const setSummaryReviewed = useSetupSessionStore(
    (state) => state.setSummaryReviewed,
  );

  const optimizerLabel = getOptimizerLabel(optimizerType);
  const goalLabel = generalConfig.goalType
    ? getGoalTypeLabel(generalConfig.goalType)
    : null;
  const aggressivenessLabel = generalConfig.aggressiveness
    ? AGGRESSIVENESS_OPTIONS.find(
        (option) => option.value === generalConfig.aggressiveness,
      )?.label
    : null;

  const taxonomyChanged = hasTaxonomyChanged(taxonomyBaseline, generalConfig);
  const currentTaxonomy: TaxonomySnapshot = {
    budgetType: generalConfig.budgetType,
    level1: generalConfig.level1,
    level2: generalConfig.level2,
  };
  const hasLedgerChanges = changeLedger.length > 0;
  const hasChanges = hasLedgerChanges || taxonomyChanged;

  const changeCount = changeLedger.length + (taxonomyChanged ? 1 : 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Review changes
        </h2>
        <p className="text-sm text-slate-500">
          Confirm all changes and impacted areas before saving. Nothing commits
          until you approve on this screen (FR-023, FR-024).
        </p>
      </div>

      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {goalLabel && (
              <Badge variant="secondary" className="font-normal">
                Goal: {goalLabel}
              </Badge>
            )}
            {aggressivenessLabel && (
              <Badge variant="outline" className="font-normal text-slate-600">
                {aggressivenessLabel}
              </Badge>
            )}
            <Badge variant="secondary" className="font-normal">
              Optimizer: {optimizerLabel}
            </Badge>
            <Badge variant="outline" className="font-normal text-slate-600">
              {hasChanges
                ? `${changeCount} change${changeCount === 1 ? "" : "s"}`
                : "No changes yet"}
            </Badge>
          </div>

          {!hasChanges ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No session changes to review
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Edit goals, budgets, or constraints earlier in the flow and
                they will appear here before you save.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Taxonomy / org changes always stay at the top */}
              {taxonomyChanged && (
                <OrganizationChangeSection
                  previous={taxonomyBaseline}
                  next={currentTaxonomy}
                />
              )}

              {/* Same data, two groupings — switch with the control in the widget header */}
              {hasLedgerChanges && (
                <LineItemChangesWidget changeLedger={changeLedger} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {hasChanges && (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={summaryReviewed}
            onChange={(event) => setSummaryReviewed(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <div className="space-y-1">
            <Label className="cursor-pointer text-sm font-medium text-slate-900">
              I have reviewed these changes
            </Label>
            <p className="text-sm text-slate-500">
              Save &amp; Launch stays disabled until you confirm you have checked
              every change above.
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
