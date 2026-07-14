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
import { useMemo, useState } from "react";

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
 * Compact Level 1 › Level 2 path for a line item, using the user's General picks.
 * Example: Brand · JBC › Sub-brand · JBC Fresh
 */
function ScopeHierarchyCue({
  scopeId,
  className,
}: {
  scopeId: string;
  className?: string;
}) {
  const { level1Key, level2Key, level1Label, level2Label } =
    useTaxonomyScopeLevels();

  const row = GOALS_SCOPE_ROWS.find((item) => item.id === scopeId);

  if (!row) {
    return null;
  }

  const level1Value = getScopeTaxonomyValue(row, level1Key).trim();
  const level2Value = getScopeTaxonomyValue(row, level2Key).trim();

  // Entire Business often only has a Level 1 rollup label — still useful to show.
  if (scopeId === ENTIRE_BUSINESS_SCOPE_ID) {
    if (!level1Value) {
      return null;
    }

    return (
      <p
        className={cn("truncate text-xs text-slate-500", className)}
        title={`${level1Label}: ${level1Value}`}
      >
        <span className="text-slate-400">{level1Label}</span>
        <span className="mx-1 text-slate-300">·</span>
        <span>{level1Value}</span>
      </p>
    );
  }

  if (!level1Value && !level2Value) {
    return null;
  }

  const fullTitle = [
    level1Value ? `${level1Label}: ${level1Value}` : null,
    level2Value ? `${level2Label}: ${level2Value}` : null,
  ]
    .filter(Boolean)
    .join(" › ");

  return (
    <p
      className={cn("truncate text-xs text-slate-500", className)}
      title={fullTitle}
    >
      {level1Value ? (
        <>
          <span className="text-slate-400">{level1Label}</span>
          <span className="mx-1 text-slate-300">·</span>
          <span>{level1Value}</span>
        </>
      ) : null}
      {level1Value && level2Value ? (
        <span className="mx-1.5 text-slate-300" aria-hidden>
          ›
        </span>
      ) : null}
      {level2Value ? (
        <>
          <span className="text-slate-400">{level2Label}</span>
          <span className="mx-1 text-slate-300">·</span>
          <span>{level2Value}</span>
        </>
      ) : null}
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
  return (
    <li className="grid gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center sm:gap-4">
      <div className="min-w-0">
        {!hideScope ? (
          <>
            <p className="truncate text-sm font-medium text-slate-900">
              {entry.scopeName}
            </p>
            {/* Where this brand sits in the user's Level 1 / Level 2 setup */}
            <ScopeHierarchyCue scopeId={entry.scopeId} className="mt-0.5" />
            <p className="mt-0.5 text-xs text-slate-500">{entry.fieldLabel}</p>
          </>
        ) : (
          <p className="truncate text-sm font-medium text-slate-900">
            {entry.fieldLabel}
          </p>
        )}
      </div>

      <div className="sm:justify-self-start">
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

      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm tabular-nums">
        <span className="text-slate-500 line-through decoration-slate-300">
          {formatChangeValue(entry.from)}
        </span>
        <ArrowRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
        <span className="font-medium text-slate-900">
          {formatChangeValue(entry.to)}
        </span>
      </div>
    </li>
  );
}

function ChangesAccordionSection({
  label,
  entries,
  defaultOpen = false,
  hideScopeInRows = false,
  categories,
  scopeId,
}: {
  label: string;
  entries: ChangeLedgerEntry[];
  defaultOpen?: boolean;
  hideScopeInRows?: boolean;
  categories?: SetupChangeCategory[];
  /** When set (By impact view), show Level 1 › Level 2 under the line item name. */
  scopeId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
          "bg-slate-100 hover:bg-slate-200/70",
          open && "border-b border-slate-200",
        )}
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-4 w-1 shrink-0 rounded-full bg-brand-500"
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {label}
              </h3>
              {scopeId ? (
                <ScopeHierarchyCue scopeId={scopeId} className="mt-0.5" />
              ) : null}
            </div>
          </div>
          {categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pl-3.5">
              {categories.map((category) => (
                <Badge
                  key={`${label}-${category}`}
                  variant="secondary"
                  className={cn(
                    "font-normal",
                    CATEGORY_BADGE_CLASS[category],
                  )}
                >
                  {SETUP_CHANGE_CATEGORY_LABELS[category]}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className="border-slate-300 bg-white font-normal text-slate-600"
          >
            {entries.length} change{entries.length === 1 ? "" : "s"}
          </Badge>
          <ChevronDown
            className={cn(
              "size-4 text-slate-500 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-slate-100 bg-white px-4">
          {entries.map((entry) => (
            <ChangeRow
              key={entry.id}
              entry={entry}
              hideScope={hideScopeInRows}
            />
          ))}
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

      <div className="space-y-3 bg-white p-4">
        {view === "by-steps"
          ? groupedByStep.map((group, index) => (
              <ChangesAccordionSection
                key={group.step}
                label={group.label}
                entries={group.entries}
                defaultOpen={index === 0}
                categories={uniqueCategories(group.entries)}
              />
            ))
          : groupedByScope.map((group, index) => (
              <ChangesAccordionSection
                key={group.scopeId}
                label={group.scopeName}
                scopeId={group.scopeId}
                entries={group.entries}
                defaultOpen={index === 0}
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
