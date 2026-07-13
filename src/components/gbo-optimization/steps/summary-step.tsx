"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AGGRESSIVENESS_OPTIONS,
  getBudgetDefinitionLabel,
  getGoalTypeLabel,
  getLevelLabel,
  getOptimizerLabel,
} from "@/lib/gbo-optimization/setup-data";
import {
  groupChangesByStep,
  hasTaxonomyChanged,
  SETUP_CHANGE_CATEGORY_LABELS,
  useSetupSessionStore,
  type ChangeLedgerEntry,
  type ImpactedScope,
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

function formatChangeValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "—";
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

function ChangeRow({ entry }: { entry: ChangeLedgerEntry }) {
  return (
    <li className="grid gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {entry.scopeName}
        </p>
        <p className="text-xs text-slate-500">{entry.fieldLabel}</p>
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

/** How many impacted scopes to show inline before offering the full list panel. */
const IMPACTED_AREAS_PREVIEW_LIMIT = 5;

function ImpactedScopeRow({ scope }: { scope: ImpactedScope }) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{scope.scopeName}</p>
          <p className="text-xs text-slate-500">
            {scope.changeCount} pending change
            {scope.changeCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {scope.categories.map((category) => (
            <Badge
              key={`${scope.scopeId}-${category}`}
              variant="secondary"
              className={cn("font-normal", CATEGORY_BADGE_CLASS[category])}
            >
              {SETUP_CHANGE_CATEGORY_LABELS[category]}
            </Badge>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600">Affected fields</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {scope.fields.map((field) => (
          <li
            key={`${scope.scopeId}-${field}`}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {field}
          </li>
        ))}
      </ul>
    </li>
  );
}

/** FR-024 — brands/scopes affected; long lists open in a side panel. */
function ImpactedAreasSection({
  scopes,
  changeLedger,
}: {
  scopes: ImpactedScope[];
  changeLedger: ChangeLedgerEntry[];
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  const categoryTotals = useMemo(() => {
    const totals = new Map<SetupChangeCategory, number>();

    for (const entry of changeLedger) {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + 1);
    }

    return Array.from(totals.entries()).sort(
      (left, right) => right[1] - left[1],
    );
  }, [changeLedger]);

  const totalChanges = changeLedger.length;
  const isTruncated = scopes.length > IMPACTED_AREAS_PREVIEW_LIMIT;
  const previewScopes = isTruncated
    ? scopes.slice(0, IMPACTED_AREAS_PREVIEW_LIMIT)
    : scopes;
  const hiddenScopeCount = Math.max(
    0,
    scopes.length - IMPACTED_AREAS_PREVIEW_LIMIT,
  );

  return (
    <>
      <section
        aria-labelledby="impacted-areas-heading"
        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
      >
        <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
          <h3
            id="impacted-areas-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Impacted areas
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Brands, budgets, and settings affected by your pending changes
            (FR-024).
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="border-slate-300 bg-white font-normal"
            >
              {scopes.length} scope{scopes.length === 1 ? "" : "s"}
            </Badge>
            {categoryTotals.map(([category, count]) => (
              <Badge
                key={category}
                variant="secondary"
                className={cn("font-normal", CATEGORY_BADGE_CLASS[category])}
              >
                {count} {SETUP_CHANGE_CATEGORY_LABELS[category].toLowerCase()}
                {count === 1 ? "" : "s"}
              </Badge>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-slate-200 bg-white">
          {previewScopes.map((scope) => (
            <ImpactedScopeRow key={scope.scopeId} scope={scope} />
          ))}
        </ul>

        {isTruncated ? (
          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {IMPACTED_AREAS_PREVIEW_LIMIT} of {scopes.length} scopes
              {totalChanges > 0
                ? ` · ${totalChanges} total change${totalChanges === 1 ? "" : "s"}`
                : ""}
              .
            </p>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="mt-1.5 text-sm font-medium text-brand-600 underline decoration-dashed underline-offset-4 hover:text-brand-700"
            >
              View all {scopes.length} impacted scopes
              {hiddenScopeCount > 0 ? ` (+${hiddenScopeCount} more)` : ""}
            </button>
          </div>
        ) : null}
      </section>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className="w-full! max-w-none! gap-0 border-slate-200 bg-white p-0 sm:w-md! sm:max-w-none!"
        >
          <SheetHeader className="space-y-1 border-b border-slate-200 px-5 py-4 pr-12 text-left">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              All impacted areas
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500">
              {scopes.length} scope{scopes.length === 1 ? "" : "s"} ·{" "}
              {totalChanges} pending change
              {totalChanges === 1 ? "" : "s"}
            </SheetDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryTotals.map(([category, count]) => (
                <Badge
                  key={`panel-${category}`}
                  variant="secondary"
                  className={cn("font-normal", CATEGORY_BADGE_CLASS[category])}
                >
                  {count} {SETUP_CHANGE_CATEGORY_LABELS[category].toLowerCase()}
                  {count === 1 ? "" : "s"}
                </Badge>
              ))}
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-200">
              {scopes.map((scope) => (
                <ImpactedScopeRow key={`panel-${scope.scopeId}`} scope={scope} />
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ChangesAccordionSection({
  label,
  entries,
  defaultOpen = false,
}: {
  label: string;
  entries: ChangeLedgerEntry[];
  defaultOpen?: boolean;
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
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-4 w-1 shrink-0 rounded-full bg-brand-500"
            aria-hidden
          />
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {label}
          </h3>
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
            <ChangeRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
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
  const getImpactedScopes = useSetupSessionStore(
    (state) => state.getImpactedScopes,
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

  const groupedChanges = useMemo(
    () => groupChangesByStep(changeLedger),
    [changeLedger],
  );

  const impactedScopes = useMemo(
    () => getImpactedScopes(),
    [getImpactedScopes, changeLedger],
  );

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
              {taxonomyChanged && (
                <OrganizationChangeSection
                  previous={taxonomyBaseline}
                  next={currentTaxonomy}
                />
              )}

              {impactedScopes.length > 0 && (
                <ImpactedAreasSection
                  scopes={impactedScopes}
                  changeLedger={changeLedger}
                />
              )}

              {groupedChanges.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Changes by step
                  </p>
                  {groupedChanges.map((group, index) => (
                    <ChangesAccordionSection
                      key={group.step}
                      label={group.label}
                      entries={group.entries}
                      defaultOpen={!taxonomyChanged && index === 0}
                    />
                  ))}
                </div>
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
