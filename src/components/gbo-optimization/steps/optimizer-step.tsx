"use client";

import { ChevronDown, Code2, Plus, Search, Settings } from "lucide-react";

import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OPTIMIZER_SCOPE_ROWS } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

export function OptimizerStep() {
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

        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="size-4 text-slate-500" />
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Scope" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Goals" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Value" />
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center justify-between">
                  <InfoLabel label="Mode" />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-brand-600"
                  >
                    <Code2 className="size-3.5" />
                    Expand
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {OPTIMIZER_SCOPE_ROWS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="border-r border-slate-100 px-4 py-3 font-medium text-slate-900">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      "indent" in row && row.indent && "pl-6",
                    )}
                  >
                    {"expandable" in row && row.expandable && (
                      <ChevronDown className="size-4 text-slate-400" />
                    )}
                    {row.name}
                  </span>
                </td>
                <td className="border-r border-slate-100 px-4 py-3 text-slate-700">
                  {"goal" in row ? row.goal : ""}
                </td>
                <td className="border-r border-slate-100 px-4 py-3 font-medium text-brand-600">
                  {"value" in row ? row.value : ""}
                </td>
                <td className="px-4 py-3">
                  {"goal" in row && (
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <span className="flex size-5 items-center justify-center rounded border border-slate-200 bg-slate-50 text-[10px] font-medium">
                        01
                      </span>
                      Rule Based
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
