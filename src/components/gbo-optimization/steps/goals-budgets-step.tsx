"use client";

import { ChevronDown, CircleHelp, Plus, Search } from "lucide-react";

import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  BUDGET_MONTHS,
  GOALS_SCOPE_ROWS,
} from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

export function GoalsBudgetsStep() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search" className="pl-9" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Add Filters
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Switch defaultChecked />
          <span>Include Seasonality</span>
          <CircleHelp className="size-4 text-slate-400" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <th rowSpan={2} className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Scope" />
              </th>
              <th colSpan={3} className="border-r border-slate-200 px-4 py-2 text-center font-medium">
                Goal
              </th>
              <th colSpan={BUDGET_MONTHS.length + 1} className="px-4 py-2 text-center font-medium">
                Budget FY2026
              </th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <th className="border-r border-slate-200 px-4 py-2 font-medium">
                <InfoLabel label="Metric to optimize" />
              </th>
              <th className="border-r border-slate-200 px-4 py-2 font-medium">
                <div>Value</div>
                <div className="mt-1 flex gap-2 font-normal text-slate-400">
                  <span>Absolute</span>
                  <span>Percentage</span>
                </div>
              </th>
              <th className="border-r border-slate-200 px-4 py-2 font-medium">
                <InfoLabel label="Last 30 days performance" />
              </th>
              {BUDGET_MONTHS.map((month) => (
                <th
                  key={month}
                  className="border-r border-slate-200 px-3 py-2 text-center font-medium"
                >
                  {month}
                </th>
              ))}
              <th className="px-4 py-2 text-center font-medium">
                <InfoLabel label="FY 2026" />
              </th>
            </tr>
          </thead>
          <tbody>
            {GOALS_SCOPE_ROWS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="border-r border-slate-100 px-4 py-3 font-medium text-slate-900">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      row.indent && "pl-6",
                    )}
                  >
                    {row.expandable && (
                      <ChevronDown className="size-4 text-slate-400" />
                    )}
                    {row.name}
                  </span>
                </td>
                <td className="border-r border-slate-100 px-4 py-3 text-slate-700">
                  {row.goalMetric}
                </td>
                <td className="border-r border-slate-100 px-4 py-3" />
                <td className="border-r border-slate-100 px-4 py-3 text-slate-700">
                  {row.last30Days}
                </td>
                {row.monthlyBudgets.map((budget, index) => (
                  <td
                    key={`${row.id}-${index}`}
                    className="border-r border-slate-100 px-3 py-3 text-center text-slate-700"
                  >
                    {budget}
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-medium text-slate-900">
                  {row.fyTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
