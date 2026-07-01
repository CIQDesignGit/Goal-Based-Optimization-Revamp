"use client";

import { useState } from "react";

import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BUDGET_GRANULARITIES,
  LEVEL_1_OPTIONS,
  LEVEL_2_OPTIONS,
  PREFILL_METRIC_OPTIONS,
} from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

type BudgetType = "retailer" | "internal";

const SETUP_SELECT_TRIGGER_CLASS =
  "w-full border-slate-200 bg-white text-slate-700 shadow-none";

const BUDGET_TYPE_OPTIONS: {
  value: BudgetType;
  title: string;
  description: string;
}[] = [
  {
    value: "retailer",
    title: "Retailer Categorization",
    description:
      "Select this to use the advertising structure pre-defined within the retailer",
  },
  {
    value: "internal",
    title: "Internal Categorization",
    description:
      "Select this to use a custom advertising structure defined by you in Campaign Taxonomy",
  },
];

function RadioIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
        selected ? "border-brand-600" : "border-slate-300",
      )}
      aria-hidden
    >
      {selected ? <span className="size-2 rounded-full bg-brand-600" /> : null}
    </span>
  );
}

export function GeneralStep() {
  const [granularity, setGranularity] = useState<string>("Monthly");
  const [budgetType, setBudgetType] = useState<BudgetType>("retailer");
  const [level1, setLevel1] = useState("portfolio");
  const [level2, setLevel2] = useState("na");
  const [prefillMetric, setPrefillMetric] = useState<string>("roas");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-8">
      {/* Card 1 — Budget granularity */}
      <div className="relative">
        <Card className="border border-slate-200 shadow-none">
          <CardContent className="relative space-y-5">
            <Badge
              variant="secondary"
              className="absolute top-4 right-4 border border-slate-200 bg-slate-100 font-normal text-slate-600"
            >
              General Configuration
            </Badge>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900">
                How do you want to plan your budget?{" "}
                <span className="text-slate-900">*</span>
              </h2>
              <p className="text-sm text-slate-500">Budget granularity</p>
            </div>

            <div
              className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1"
              role="tablist"
              aria-label="Budget granularity"
            >
              {BUDGET_GRANULARITIES.map((option) => {
                const isSelected = granularity === option;

                return (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setGranularity(option)}
                    className={cn(
                      "rounded-md px-2 py-2.5 text-center text-sm transition-colors",
                      isSelected
                        ? "border border-brand-600 bg-white font-semibold text-brand-600"
                        : "border border-transparent bg-transparent font-normal text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card 2 — Budget definition */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">
              How do you want to define your budget?
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Note: You can change how your budget is spread out anytime you need.
              Just remember, when you make changes, your new budget setup will
              start the next day.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_TYPE_OPTIONS.map((option) => {
              const isSelected = budgetType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBudgetType(option.value)}
                  className={cn(
                    "flex gap-3 rounded-lg border p-4 text-left transition-colors",
                    isSelected
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <RadioIndicator selected={isSelected} />
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {option.title}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-md bg-slate-100 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SetupInlineSelect
                label="Level 1"
                value={level1}
                options={LEVEL_1_OPTIONS}
                placeholder="Select portfolio"
                onValueChange={setLevel1}
                triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
              />

              <SetupInlineSelect
                label="Level 2"
                value={level2}
                options={LEVEL_2_OPTIONS}
                placeholder="Select category"
                onValueChange={setLevel2}
                triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Pre-fill goals */}
      <Card className="border border-slate-200 shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Pre-fill goals for the categorization
            </h2>
            <p className="text-sm text-slate-500">
              Choose a metric to auto populate your goals at{" "}
              <span className="font-semibold text-slate-700">Portfolio</span> level
            </p>
          </div>

          <div className="rounded-md bg-slate-100 p-4">
            <SetupInlineSelect
              label="Metric to pre-fill"
              value={prefillMetric || null}
              options={PREFILL_METRIC_OPTIONS}
              placeholder="Select a metric to prefill"
              onValueChange={setPrefillMetric}
              onClear={() => setPrefillMetric("")}
              triggerClassName={SETUP_SELECT_TRIGGER_CLASS}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
