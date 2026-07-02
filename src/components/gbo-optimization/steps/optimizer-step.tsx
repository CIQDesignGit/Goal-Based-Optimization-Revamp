"use client";

import {
  ChevronDown,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OPTIMIZER_SCOPE_ROWS } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

function AllyBadge() {
  return (
    <Badge
      variant="secondary"
      className="gap-1 border border-brand-200 bg-brand-50 font-normal text-brand-700 hover:bg-brand-50"
    >
      <Sparkles className="size-3 text-brand-500" />
      Ally
    </Badge>
  );
}

function OptimizerCell({
  row,
  column,
}: {
  row: (typeof OPTIMIZER_SCOPE_ROWS)[number];
  column:
    | "mode"
    | "budget"
    | "bid"
    | "dayParting"
    | "targeting";
}) {
  if (!("allyMode" in row) || !row.allyMode) {
    return null;
  }

  if (column === "dayParting") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-[7rem] flex-1">
          <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            defaultValue="Hourly Bid..."
            className="h-8 border-slate-200 bg-white pl-7 text-xs shadow-none"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Reset day parting"
          className="text-slate-400 hover:text-slate-600"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
    );
  }

  if (column === "targeting") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Reset targeting"
        className="text-slate-400 hover:text-slate-600"
      >
        <RefreshCw className="size-3.5" />
      </Button>
    );
  }

  if (column === "bid") {
    return (
      <div className="flex items-center gap-2">
        <AllyBadge />
        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-100">
          <RefreshCw className="size-2.5 text-emerald-600" />
        </span>
      </div>
    );
  }

  return <AllyBadge />;
}

export function OptimizerStep() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search" className="h-9 border-slate-200 pl-9 shadow-none" />
        </div>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-600">
          <Plus className="size-4" />
          Add Filters
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <th className="min-w-[200px] border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Scope" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Goals" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Value" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <div className="flex items-center justify-between gap-2">
                  <InfoLabel label="Mode" />
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Collapse
                  </button>
                </div>
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Budget Optimization" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Bid Optimization" />
              </th>
              <th className="border-r border-slate-200 px-4 py-3 font-medium">
                <InfoLabel label="Day Parting" />
              </th>
              <th className="px-4 py-3 font-medium">
                <InfoLabel label="Targeting" />
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
                        "inline-flex min-w-0 items-center gap-1",
                        "indent" in row && row.indent && "pl-6",
                      )}
                    >
                      {"expandable" in row && row.expandable && (
                        <ChevronDown className="size-4 shrink-0 text-slate-400" />
                      )}
                      <span className="truncate">{row.name}</span>
                    </span>
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3 text-slate-700">
                    {"goal" in row ? row.goal : ""}
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    {"value" in row && row.value ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-brand-600">
                        {row.value}
                        <Eye className="size-3.5 text-brand-400" />
                      </span>
                    ) : null}
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell row={row} column="mode" />
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell row={row} column="budget" />
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell row={row} column="bid" />
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell row={row} column="dayParting" />
                  </td>
                  <td className="px-4 py-3">
                    <OptimizerCell row={row} column="targeting" />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
