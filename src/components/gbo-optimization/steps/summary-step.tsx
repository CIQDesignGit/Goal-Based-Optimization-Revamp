"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSetupContext } from "@/components/gbo-optimization/setup-context";

export function SummaryStep() {
  const { optimizerType } = useSetupContext();
  const optimizerLabel =
    optimizerType === "ally-ai" ? "Ally AI" : "Rule-based";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
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
            <Badge variant="secondary" className="font-normal">
              Optimizer: {optimizerLabel}
            </Badge>
            <Badge variant="outline" className="font-normal text-slate-600">
              Session draft
            </Badge>
          </div>

          <p className="text-sm text-slate-600">
            A detailed list of changed goals, budgets, constraints, and impacted
            brands will appear here. This prototype placeholder marks the end of
            the setup flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
