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

import { useTaxonomyScopeLevels } from "@/components/gbo-optimization/taxonomy-scope-columns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AGGRESSIVENESS_OPTIONS,
  ENTIRE_BUSINESS_SCOPE_ID,
  getBudgetDefinitionLabel,
  getGoalTypeLabel,
  getLevelLabel,
  GOALS_SCOPE_ROWS,
} from "@/lib/gbo-optimization/setup-data";
import {
  getScopeIdentity,
  type ScopeIdentity,
} from "@/lib/gbo-optimization/scope-tree";
import {
  groupChangesByStep,
  hasTaxonomyChanged,
  PORTFOLIO_CHANGE_SCOPE_ID,
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

const CHANGE_TYPE_FILTER_ORDER: SetupChangeCategory[] = [
  "goal",
  "budget",
  "constraint",
  "seasonality",
  "optimizer",
  "general",
];

/** How line-item changes are arranged in the Summary review widget. */
type LineItemChangesView = "by-steps" | "by-impact";

const CHANGES_PER_PAGE = 10;

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

/** Secondary hierarchy cue under a line item — labeled L1 / L2 path only. */
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
  // General settings (granularity, goal type, …) are portfolio-wide — not a taxonomy leaf.
  const isGeneralSetting = entry.scopeId === PORTFOLIO_CHANGE_SCOPE_ID;
  const isLevel2 = !isGeneralSetting && identity.editLevel === "level2";

  const isSeasonalityAdd = entry.field.startsWith("seasonality.add.");
  const seasonalityAdd = isSeasonalityAdd
    ? resolveSeasonalityAddDisplay(entry)
    : null;

  return (
    <li
      className={cn(
        "grid gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:items-start sm:gap-3",
        isLevel2
          ? "pl-8 pr-2 sm:grid-cols-[minmax(0,1fr)_minmax(19rem,2fr)]"
          : "px-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(19rem,2fr)]",
      )}
    >
      <div className="min-w-0">
        {isGeneralSetting || hideScope ? (
          // General settings / by-impact: field name is the primary line.
          <p
            className={cn(
              "text-sm wrap-break-word text-slate-900",
              isLevel2 ? "font-normal" : "font-semibold",
            )}
          >
            {entry.fieldLabel}
          </p>
        ) : (
          <p
            className={cn(
              "text-sm wrap-break-word text-slate-900",
              isLevel2 ? "font-normal" : "font-semibold",
            )}
          >
            {identity.primaryName}
          </p>
        )}
      </div>

      {!isLevel2 ? (
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-self-start sm:pt-0.5">
          <Badge
            variant="secondary"
            className={cn(
              "font-normal",
              CATEGORY_BADGE_CLASS[entry.category],
            )}
          >
            {SETUP_CHANGE_CATEGORY_LABELS[entry.category]}
          </Badge>
          {seasonalityAdd ? (
            <Badge
              variant="secondary"
              className="border border-emerald-200 bg-emerald-50 font-normal text-emerald-700"
            >
              Added
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm tabular-nums sm:justify-end sm:justify-self-stretch sm:pt-0.5">
        {seasonalityAdd ? (
          // Additions: title with date and budget details (no “—” → arrow).
          <div className="flex w-full min-w-0 flex-col items-end gap-1 text-right">
            <span className="font-medium wrap-break-word text-slate-900">
              {seasonalityAdd.name}
            </span>
            {seasonalityAdd.dates || seasonalityAdd.budget ? (
              <span className="flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap text-xs leading-snug text-slate-500">
                {seasonalityAdd.dates ? (
                  <span>{seasonalityAdd.dates}</span>
                ) : null}
                {seasonalityAdd.dates && seasonalityAdd.budget ? (
                  <span className="text-slate-300" aria-hidden>
                    •
                  </span>
                ) : null}
                {seasonalityAdd.budget ? (
                  <span>{seasonalityAdd.budget}</span>
                ) : null}
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

type HierarchyChangeGroup = {
  id: string;
  label: string;
  level1Entries: ChangeLedgerEntry[];
  level2Entries: ChangeLedgerEntry[];
};

/**
 * Arrange step changes as collapsible Level 1 rows with indented Level 2 rows.
 * Typography and spacing communicate hierarchy without repeating level badges.
 */
function HierarchicalChangeRows({
  entries,
}: {
  entries: ChangeLedgerEntry[];
}) {
  const { level1Key, level2Key, level1Label, level2Label } =
    useTaxonomyScopeLevels();
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );

  const { standaloneEntries, groups } = useMemo(() => {
    const standalone: ChangeLedgerEntry[] = [];
    const grouped = new Map<string, HierarchyChangeGroup>();

    for (const entry of entries) {
      if (
        entry.scopeId === PORTFOLIO_CHANGE_SCOPE_ID ||
        entry.scopeId === ENTIRE_BUSINESS_SCOPE_ID
      ) {
        standalone.push(entry);
        continue;
      }

      const identity = getScopeIdentity(
        entry.scopeId,
        level1Key,
        level2Key,
        level1Label,
        level2Label,
        GOALS_SCOPE_ROWS,
      );
      const groupLabel =
        identity.level1Value || entry.scopeName || identity.primaryName;
      const groupId = `hierarchy:${groupLabel}`;
      const group = grouped.get(groupId) ?? {
        id: groupId,
        label: groupLabel,
        level1Entries: [],
        level2Entries: [],
      };

      if (identity.editLevel === "level1") {
        group.level1Entries.push(entry);
      } else {
        group.level2Entries.push(entry);
      }

      grouped.set(groupId, group);
    }

    return {
      standaloneEntries: standalone,
      groups: Array.from(grouped.values()),
    };
  }, [entries, level1Key, level1Label, level2Key, level2Label]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <>
      {standaloneEntries.map((entry) => (
        <ChangeRow key={entry.id} entry={entry} />
      ))}

      {groups.map((group) => {
        const isCollapsed = collapsedGroupIds.has(group.id);
        const hasLevel2Entries = group.level2Entries.length > 0;

        return (
          <li key={group.id} className="border-b border-slate-100 last:border-b-0">
            <button
              type="button"
              aria-expanded={hasLevel2Entries ? !isCollapsed : undefined}
              onClick={() => {
                if (hasLevel2Entries) toggleGroup(group.id);
              }}
              className={cn(
                "grid w-full gap-2 px-2 py-3 text-left text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40 sm:grid-cols-[minmax(0,1fr)_minmax(19rem,2fr)] sm:items-start sm:gap-3",
                hasLevel2Entries
                  ? "transition-colors hover:bg-slate-50"
                  : "cursor-default",
              )}
            >
              <span className="flex min-w-0 items-center gap-2 font-semibold">
                {hasLevel2Entries ? (
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-slate-500 transition-transform",
                      isCollapsed && "-rotate-90",
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
              </span>

              <span className="flex min-w-0 flex-col items-end gap-1 pt-0.5 text-right font-normal tabular-nums">
                {group.level1Entries.map((entry) => {
                  const seasonalityAdd = entry.field.startsWith(
                    "seasonality.add.",
                  )
                    ? resolveSeasonalityAddDisplay(entry)
                    : null;

                  return seasonalityAdd ? (
                    <span
                      key={entry.id}
                      className="flex w-full min-w-0 flex-col items-end gap-1"
                    >
                      <span className="font-medium wrap-break-word text-slate-900">
                        {seasonalityAdd.name}
                      </span>
                      {seasonalityAdd.dates || seasonalityAdd.budget ? (
                        <span className="flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap text-xs leading-snug text-slate-500">
                          {seasonalityAdd.dates ? (
                            <span>{seasonalityAdd.dates}</span>
                          ) : null}
                          {seasonalityAdd.dates && seasonalityAdd.budget ? (
                            <span className="text-slate-300" aria-hidden>
                              •
                            </span>
                          ) : null}
                          {seasonalityAdd.budget ? (
                            <span>{seasonalityAdd.budget}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span
                      key={entry.id}
                      className="flex flex-wrap items-center justify-end gap-2"
                    >
                      <span className="text-xs text-slate-500">
                        {entry.fieldLabel}
                      </span>
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
                    </span>
                  );
                })}
              </span>
            </button>

            {hasLevel2Entries && !isCollapsed ? (
              <ul className="border-t border-slate-100 bg-slate-50/30">
                {group.level2Entries.map((entry) => (
                  <ChangeRow key={entry.id} entry={entry} />
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
  );
}

/**
 * Seasonality “add” rows: title on top, dates underneath.
 * Supports new ledger shape (to=name, from=dates) and older “name · dates · …” labels.
 */
function resolveSeasonalityAddDisplay(entry: ChangeLedgerEntry): {
  name: string;
  dates: string | null;
  budget: string | null;
} {
  const from = entry.from.trim();
  const to = entry.to.trim();
  const fromParts = from
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);

  // New shape: to is the event name; from contains dates and budget details.
  if (!to.includes(" · ")) {
    return {
      name: to || "New event",
      dates: fromParts.find((part) => part.includes("→")) ?? null,
      budget: formatSeasonalityBudgetDetail(
        fromParts.find((part) => /^(percent|absolute)\b/i.test(part)) ?? null,
      ),
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
    budget: formatSeasonalityBudgetDetail(
      parts.find((part) => /^(percent|absolute)\b/i.test(part)) ?? null,
    ),
  };
}

/** Turn stored seasonality budget data into compact review copy. */
function formatSeasonalityBudgetDetail(value: string | null): string | null {
  if (!value) return null;

  const match = value.match(/^(percent|absolute)\s+(.+)$/i);
  if (!match) return null;

  const [, mode, rawValue] = match;
  const numericValue = Number.parseFloat(rawValue.replaceAll(",", ""));

  if (mode.toLowerCase() === "percent") {
    const displayValue = Number.isFinite(numericValue)
      ? numericValue.toString()
      : rawValue;
    return `Budget ${displayValue}%`;
  }

  const displayValue = Number.isFinite(numericValue)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(numericValue)
    : `$${rawValue}`;

  return `Budget ${displayValue}`;
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
  const [page, setPage] = useState(1);

  const scopeIdentity = useScopeIdentityForId(
    scopeId ?? ENTIRE_BUSINESS_SCOPE_ID,
  );
  const isGeneralSettingGroup = scopeId === PORTFOLIO_CHANGE_SCOPE_ID;
  const headingLabel = isGeneralSettingGroup
    ? "General"
    : scopeId
      ? scopeIdentity.primaryName
      : label;
  const isLevel2Scope =
    Boolean(scopeId) &&
    !isGeneralSettingGroup &&
    scopeIdentity.editLevel === "level2";

  const availableCategories = categories ?? uniqueCategories(entries);

  const visibleEntries = useMemo(() => {
    if (activeCategories.length === 0) {
      return entries;
    }

    return entries.filter((entry) =>
      activeCategories.includes(entry.category),
    );
  }, [entries, activeCategories]);
  const pageCount = Math.max(
    1,
    Math.ceil(visibleEntries.length / CHANGES_PER_PAGE),
  );
  const currentPage = Math.min(page, pageCount);
  const paginatedEntries = visibleEntries.slice(
    (currentPage - 1) * CHANGES_PER_PAGE,
    currentPage * CHANGES_PER_PAGE,
  );

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
    setPage(1);

    // Expanding helps the user see what the filter did.
    setOpen(true);
  };

  const goToPage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, pageCount)));
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
          scopeId && (isLevel2Scope ? "pl-10" : "pl-2"),
          open && "border-b border-slate-100",
        )}
      >
        <div className="flex min-w-0 flex-1 items-stretch gap-2.5">
          {/* The accent bar identifies top-level sections, not nested Level 2 rows. */}
          {!isLevel2Scope ? (
            <span
              className="w-1 shrink-0 self-stretch rounded-full bg-brand-500"
              aria-hidden
            />
          ) : null}
          <div className="min-w-0 space-y-1 py-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3
                className={cn(
                  "text-sm wrap-break-word text-slate-900",
                  isLevel2Scope ? "font-normal" : "font-semibold",
                )}
              >
                {headingLabel}
              </h3>
            </div>
            {scopeId && !isGeneralSettingGroup ? (
              <ScopeHierarchyCue scopeId={scopeId} />
            ) : !scopeId ? (
              <TaxonomyLevelsHint />
            ) : (
              <p className="mt-0.5 text-xs leading-snug text-slate-400">
                Setup settings
              </p>
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
        <div>
          <ul className="divide-y divide-slate-100 bg-white px-4">
            {visibleEntries.length > 0 ? (
              scopeId ? (
                paginatedEntries.map((entry) => (
                  <ChangeRow
                    key={entry.id}
                    entry={entry}
                    hideScope={hideScopeInRows}
                  />
                ))
              ) : (
                <HierarchicalChangeRows entries={paginatedEntries} />
              )
            ) : (
              <li className="py-6 text-center text-sm text-slate-500">
                No changes match the selected filters.
              </li>
            )}
          </ul>

          {visibleEntries.length > CHANGES_PER_PAGE ? (
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
              <Pagination
                aria-label={`Pagination for ${headingLabel} changes`}
                className="justify-end"
              >
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                      className={cn(
                        currentPage === 1 &&
                          "pointer-events-none opacity-40",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(currentPage - 1);
                      }}
                    />
                  </PaginationItem>

                  {Array.from({ length: pageCount }, (_, index) => {
                    const pageNumber = index + 1;

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === currentPage}
                          aria-label={`Go to page ${pageNumber} for ${headingLabel}`}
                          onClick={(event) => {
                            event.preventDefault();
                            goToPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      aria-disabled={currentPage === pageCount}
                      tabIndex={
                        currentPage === pageCount ? -1 : undefined
                      }
                      className={cn(
                        currentPage === pageCount &&
                          "pointer-events-none opacity-40",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ImpactInlineChange({ entry }: { entry: ChangeLedgerEntry }) {
  const seasonalityAdd = entry.field.startsWith("seasonality.add.")
    ? resolveSeasonalityAddDisplay(entry)
    : null;

  if (seasonalityAdd) {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-l border-slate-200 pl-3 first:border-l-0 first:pl-0">
        <span className="text-xs font-medium text-slate-500">
          {entry.fieldLabel}
        </span>
        <span className="text-sm font-medium wrap-break-word text-slate-900">
          {seasonalityAdd.name}
        </span>
        {seasonalityAdd.dates || seasonalityAdd.budget ? (
          <span className="text-xs text-slate-500">
            {[seasonalityAdd.dates, seasonalityAdd.budget]
              .filter(Boolean)
              .join(" • ")}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-2 border-l border-slate-200 pl-3 first:border-l-0 first:pl-0">
      <span className="text-xs font-medium text-slate-500">
        {entry.fieldLabel}
      </span>
      <span className="text-sm wrap-break-word text-slate-400 line-through decoration-slate-300">
        {formatChangeValue(entry.from)}
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      <span className="text-sm font-medium wrap-break-word text-slate-900">
        {formatChangeValue(entry.to)}
      </span>
    </span>
  );
}

function ImpactChangeSummary({
  entries,
  expanded,
  onToggle,
  hasNestedItems = false,
}: {
  entries: ChangeLedgerEntry[];
  expanded: boolean;
  onToggle: () => void;
  hasNestedItems?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div
        role="cell"
        className="px-3 py-3 text-sm text-slate-400"
      >
        {hasNestedItems ? "Changes are listed in nested line items" : "—"}
      </div>
    );
  }

  const groupedChanges = groupChangesByStep(entries);

  return (
    <div
      role="cell"
      className="flex min-w-0 items-center justify-between gap-3 px-3 py-3"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {groupedChanges.map((group) => (
          <span
            key={group.step}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-medium text-slate-600"
          >
            {group.label}
            <span className="font-semibold tabular-nums text-slate-900">
              {group.entries.length}
            </span>
          </span>
        ))}
      </div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? "Hide exact changes" : "Show exact changes"}
        onClick={onToggle}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}

function ImpactChangeDetails({ entries }: { entries: ChangeLedgerEntry[] }) {
  return (
    <div className="space-y-4 py-3">
      {groupChangesByStep(entries).map((group) => (
        <section key={group.step} className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-700">
            {group.label}
          </h4>
          <div className="flex flex-col gap-2">
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-md bg-white px-3 py-2 ring-1 ring-slate-200"
              >
                <ImpactInlineChange entry={entry} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type ImpactScopeRow = {
  id: string;
  label: string;
  entries: ChangeLedgerEntry[];
};

type ImpactLevel1Group = ImpactScopeRow & {
  children: ImpactScopeRow[];
};

function ImpactMatrixRow({
  row,
  level,
  collapsible = false,
  collapsed = false,
  onToggle,
}: {
  row: ImpactScopeRow;
  level: "level1" | "level2";
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const labelContent = (
    <>
      {collapsible ? (
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-500 transition-transform",
            collapsed && "-rotate-90",
          )}
          aria-hidden
        />
      ) : level === "level2" ? (
        <span className="size-4 shrink-0" aria-hidden />
      ) : null}
      <span className="min-w-0 wrap-break-word">{row.label}</span>
    </>
  );

  return (
    <div role="rowgroup" className="border-b border-slate-100 last:border-b-0">
      <div
        role="row"
        className={cn(
          "grid grid-cols-[15rem_minmax(0,1fr)]",
          level === "level1" ? "bg-slate-50/80" : "bg-white",
        )}
      >
        <div
          role="rowheader"
          className={cn(
            "flex items-start gap-2 px-3 py-3 text-sm text-slate-900",
            level === "level1" ? "font-semibold" : "pl-8 font-normal",
          )}
        >
          {collapsible ? (
            <button
              type="button"
              aria-expanded={!collapsed}
              onClick={onToggle}
              className="flex min-w-0 items-start gap-2 text-left hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              {labelContent}
            </button>
          ) : (
            labelContent
          )}
        </div>

        <ImpactChangeSummary
          entries={row.entries}
          expanded={detailsExpanded}
          onToggle={() => setDetailsExpanded((current) => !current)}
          hasNestedItems={collapsible}
        />
      </div>

      {detailsExpanded && row.entries.length > 0 ? (
        <div className="grid grid-cols-[15rem_minmax(0,1fr)] bg-slate-50/50">
          <div aria-hidden />
          <div className="border-t border-slate-100 px-3">
            <ImpactChangeDetails entries={row.entries} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImpactComparisonTable({
  changeLedger,
}: {
  changeLedger: ChangeLedgerEntry[];
}) {
  const { level1Key, level2Key, level1Label, level2Label } =
    useTaxonomyScopeLevels();
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );

  const { standaloneRows, level1Groups } = useMemo(() => {
    const standalone: ImpactScopeRow[] = [];
    const groups = new Map<string, ImpactLevel1Group>();

    for (const scopeGroup of groupChangesByScope(changeLedger)) {
      const identity = getScopeIdentity(
        scopeGroup.scopeId,
        level1Key,
        level2Key,
        level1Label,
        level2Label,
        GOALS_SCOPE_ROWS,
      );
      const row: ImpactScopeRow = {
        id: scopeGroup.scopeId,
        label:
          scopeGroup.scopeId === PORTFOLIO_CHANGE_SCOPE_ID
            ? "General"
            : identity.primaryName,
        entries: scopeGroup.entries,
      };

      if (
        scopeGroup.scopeId === PORTFOLIO_CHANGE_SCOPE_ID ||
        identity.editLevel === "entire-business"
      ) {
        standalone.push(row);
        continue;
      }

      const level1Value =
        identity.level1Value || scopeGroup.scopeName || identity.primaryName;
      const groupId = `impact:${level1Value}`;
      const group = groups.get(groupId) ?? {
        id: groupId,
        label: level1Value,
        entries: [],
        children: [],
      };

      if (identity.editLevel === "level1") {
        group.entries.push(...scopeGroup.entries);
      } else {
        group.children.push(row);
      }

      groups.set(groupId, group);
    }

    return {
      standaloneRows: standalone,
      level1Groups: Array.from(groups.values())
        .map((group) => ({
          ...group,
          children: [...group.children].sort((left, right) =>
            left.label.localeCompare(right.label),
          ),
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    };
  }, [
    changeLedger,
    level1Key,
    level1Label,
    level2Key,
    level2Label,
  ]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div
      className="bg-white"
      role="table"
      aria-label="Changes by impacted line item"
    >
      <div
        role="row"
        className="grid grid-cols-[15rem_minmax(0,1fr)] border-b border-slate-200 bg-slate-100"
      >
        <div
          role="columnheader"
          className="px-3 py-2.5 text-xs font-semibold text-slate-600"
        >
          Line item
        </div>
        <div
          role="columnheader"
          className="px-3 py-2.5 text-xs font-semibold text-slate-600"
        >
          Changes
        </div>
      </div>

      {standaloneRows.map((row) => (
        <ImpactMatrixRow key={row.id} row={row} level="level1" />
      ))}

      {level1Groups.map((group) => {
        const collapsed = collapsedGroupIds.has(group.id);
        const hasChildren = group.children.length > 0;

        return (
          <div key={group.id} role="rowgroup">
            <ImpactMatrixRow
              row={group}
              level="level1"
              collapsible={hasChildren}
              collapsed={collapsed}
              onToggle={() => toggleGroup(group.id)}
            />
            {hasChildren && !collapsed
              ? group.children.map((child) => (
                  <ImpactMatrixRow
                    key={child.id}
                    row={child}
                    level="level2"
                  />
                ))
              : null}
          </div>
        );
      })}
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

      {view === "by-steps" ? (
        <div className="divide-y divide-slate-200 bg-white">
          {groupedByStep.map((group) => (
              <ChangesAccordionSection
                key={group.step}
                label={group.label}
                entries={group.entries}
                categories={uniqueCategories(group.entries)}
              />
            ))}
        </div>
      ) : (
        <ImpactComparisonTable changeLedger={changeLedger} />
      )}
    </section>
  );
}

export function SummaryStep() {
  const generalConfig = useSetupSessionStore((state) => state.generalConfig);
  const taxonomyBaseline = useSetupSessionStore(
    (state) => state.taxonomyBaseline,
  );
  const changeLedger = useSetupSessionStore((state) => state.changeLedger);
  const summaryReviewed = useSetupSessionStore((state) => state.summaryReviewed);
  const setSummaryReviewed = useSetupSessionStore(
    (state) => state.setSummaryReviewed,
  );

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
