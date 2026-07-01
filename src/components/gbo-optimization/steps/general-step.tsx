"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { BUDGET_GRANULARITIES } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

type BudgetType = "retailer" | "internal";

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
        selected ? "border-info-600" : "border-slate-300",
      )}
      aria-hidden
    >
      {selected ? <span className="size-2 rounded-full bg-info-600" /> : null}
    </span>
  );
}

export function GeneralStep() {
  const [granularity, setGranularity] = useState<string>("Monthly");
  const [budgetType, setBudgetType] = useState<BudgetType>("retailer");
  const [level1, setLevel1] = useState("portfolio");
  const [level2, setLevel2] = useState("na");
  const [prefillMetric, setPrefillMetric] = useState<string>("roas");

  const metricLabel =
    prefillMetric === "roas"
      ? "ROAS"
      : prefillMetric === "acos"
        ? "ACOS"
        : "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      {/* Card 1 — Budget granularity */}
      <Card className="shadow-sm">
        <CardContent className="space-y-5">
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
                      ? "border border-info-600 bg-white font-semibold text-slate-900"
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

      {/* Card 2 — Budget definition */}
      <Card className="shadow-sm">
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
                      ? "border-info-600 bg-info-50"
                      : "border-transparent bg-white hover:bg-slate-50",
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

          <div className="rounded-lg bg-slate-100 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={level1} onValueChange={(value) => setLevel1(value ?? "portfolio")}>
                <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-none">
                  <span className="text-sm text-slate-700">Level 1 : Portfolio</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portfolio">Level 1 : Portfolio</SelectItem>
                </SelectContent>
              </Select>

              <Select value={level2} onValueChange={(value) => setLevel2(value ?? "na")}>
                <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-none">
                  <span className="text-sm text-slate-700">Level 2 : NA</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na">Level 2 : NA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Pre-fill goals */}
      <Card className="shadow-sm">
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

          <div className="rounded-lg bg-slate-100 p-4">
            <div className="relative">
              <Select
                value={prefillMetric}
                onValueChange={(value) => setPrefillMetric(value ?? "")}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 w-full border-slate-200 bg-white shadow-none",
                    prefillMetric && "pr-16",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm",
                      metricLabel ? "text-slate-700" : "text-slate-400",
                    )}
                  >
                    {metricLabel || "Select a metric to prefill"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roas">ROAS</SelectItem>
                  <SelectItem value="acos">ACOS</SelectItem>
                </SelectContent>
              </Select>

              {prefillMetric ? (
                <button
                  type="button"
                  onClick={() => setPrefillMetric("")}
                  className="absolute top-1/2 right-9 z-10 -translate-y-1/2 rounded-sm p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="Clear metric selection"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
