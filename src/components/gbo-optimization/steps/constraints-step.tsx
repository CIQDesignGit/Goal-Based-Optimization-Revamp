"use client";

import { ChevronDown, CircleHelp, Eye, Plus, Search, TrendingUp } from "lucide-react";

import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CONSTRAINTS_SCOPE_ROWS } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

export function ConstraintsStep() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by budget category level"
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Add Filters
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-brand-600">
            <Eye className="size-4" />
            View historical data
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Switch defaultChecked />
          <span>Set campaign constraints</span>
          <CircleHelp className="size-4 text-slate-400" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <th rowSpan={3} className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Scope" />
              </th>
              <th rowSpan={3} className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Goal" />
              </th>
              <th rowSpan={3} className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Goal Value" />
              </th>
              <th
                colSpan={11}
                className="border-b border-slate-200 px-4 py-2 text-center font-medium"
              >
                Spend Constraints (Optional)
              </th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
              <th colSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                Generic
              </th>
              <th colSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                Client Branded
              </th>
              <th colSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                Competitor Branded
              </th>
              <th rowSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                Auto
              </th>
              <th rowSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                Others
              </th>
              <th rowSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                Total
              </th>
              <th rowSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                SP
              </th>
              <th rowSpan={2} className="px-2 py-2 text-center">
                SB
              </th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <th className="border-r border-slate-200 px-2 py-2 text-center font-normal">
                Keyword Targeting
              </th>
              <th className="border-r border-slate-200 px-2 py-2 text-center font-normal">
                Product Targeting
              </th>
              <th className="border-r border-slate-200 px-2 py-2 text-center font-normal">
                Keyword Targeting
              </th>
              <th className="border-r border-slate-200 px-2 py-2 text-center font-normal">
                Product Targeting
              </th>
              <th className="border-r border-slate-200 px-2 py-2 text-center font-normal">
                Keyword Targeting
              </th>
              <th className="border-r border-slate-200 px-2 py-2 text-center font-normal">
                Product Targeting
              </th>
            </tr>
          </thead>
          <tbody>
            {CONSTRAINTS_SCOPE_ROWS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="border-r border-slate-100 px-4 py-3 font-medium text-slate-900">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      row.indent && "pl-6",
                      !row.indent && "gap-1",
                    )}
                  >
                    {!row.indent && (
                      <ChevronDown className="size-4 text-slate-400" />
                    )}
                    {row.name}
                  </span>
                </td>
                <td className="border-r border-slate-100 px-4 py-3">
                  {row.indent && (
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <TrendingUp className="size-4 text-success-500" />
                      ROAS
                    </span>
                  )}
                </td>
                <td className="border-r border-slate-100 px-4 py-3 font-medium text-brand-600">
                  {row.goalValue}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center text-slate-700">
                  {row.genericKeyword}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center" />
                <td className="border-r border-slate-100 px-2 py-3 text-center" />
                <td className="border-r border-slate-100 px-2 py-3 text-center" />
                <td className="border-r border-slate-100 px-2 py-3 text-center text-slate-700">
                  {row.competitorKeyword}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center text-slate-700">
                  {row.competitorProduct}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center text-slate-700">
                  {row.auto}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center">
                  {row.others}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center text-slate-700">
                  {row.total}
                </td>
                <td className="border-r border-slate-100 px-2 py-3 text-center">
                  {row.sp}
                </td>
                <td className="px-2 py-3 text-center text-slate-700">{row.sb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
