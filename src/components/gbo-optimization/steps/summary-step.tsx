"use client";

import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AGGRESSIVENESS_OPTIONS,
  getGoalTypeLabel,
  getOptimizerLabel,
} from "@/lib/gbo-optimization/setup-data";
import {
  groupChangesByStep,
  SETUP_CHANGE_CATEGORY_LABELS,
  useSetupSessionStore,
  type ChangeLedgerEntry,
  type SetupChangeCategory,
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="font-normal text-slate-600">
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
        <ul className="divide-y divide-slate-100 border-t border-slate-200 px-4">
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
  const hasChanges = changeLedger.length > 0;

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
                ? `${changeLedger.length} change${changeLedger.length === 1 ? "" : "s"}`
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
              {impactedScopes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Impacted areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {impactedScopes.map((scope) => (
                      <Badge
                        key={scope.scopeId}
                        variant="outline"
                        className="font-normal text-slate-700"
                        title={scope.fields.join(", ")}
                      >
                        {scope.scopeName}
                        <span className="ml-1.5 text-slate-400">
                          · {scope.changeCount}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {groupedChanges.map((group, index) => (
                  <ChangesAccordionSection
                    key={group.step}
                    label={group.label}
                    entries={group.entries}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
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
