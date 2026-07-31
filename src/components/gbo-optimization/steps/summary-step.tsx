"use client";

import { useMemo } from "react";

import { SetupChangesSummaryView } from "@/components/gbo-optimization/setup-changes-summary-view";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AGGRESSIVENESS_OPTIONS,
  getGoalTypeLabel,
} from "@/lib/gbo-optimization/setup-data";
import {
  getTaxonomySnapshotFromConfig,
  useSetupSessionStore,
} from "@/lib/gbo-optimization/setup-session-store";

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
  const taxonomyCurrent = useMemo(
    () => getTaxonomySnapshotFromConfig(generalConfig),
    [generalConfig],
  );
  const hasChanges =
    changeLedger.length > 0 ||
    (taxonomyBaseline.budgetType !== taxonomyCurrent.budgetType ||
      taxonomyBaseline.level1 !== taxonomyCurrent.level1 ||
      taxonomyBaseline.level2 !== taxonomyCurrent.level2);

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
          <SetupChangesSummaryView
            changeLedger={changeLedger}
            taxonomyBaseline={taxonomyBaseline}
            taxonomyCurrent={taxonomyCurrent}
            goalLabel={goalLabel}
            aggressivenessLabel={aggressivenessLabel}
          />
        </CardContent>
      </Card>

      {hasChanges ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={summaryReviewed}
            onChange={(event) => setSummaryReviewed(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
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
      ) : null}
    </div>
  );
}
