"use client";

import {
  CalendarDays,
  ChevronDown,
  Database,
  Download,
  EllipsisVertical,
  Info,
  PencilLine,
  Plus,
  RefreshCw,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BUDGET_PACING_CHART_DATA,
  BUDGET_PACING_SUMMARY,
  formatSpendAxis,
} from "@/lib/home/budget-pacing-data";
import { cn } from "@/lib/utils";

const CHART_CONFIG = {
  spend: {
    label: "Spend",
    color: "hsl(174 58% 39%)",
  },
} as const;

function MetricCard({
  label,
  value,
  delta,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[88px] flex-col justify-center rounded-lg border border-slate-200 bg-white px-4 py-3",
        className,
      )}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-xl font-semibold text-slate-900">{value}</p>
        {delta ? (
          <span className="text-xs font-medium text-destructive">{delta}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Budget Pacing dashboard widget on the home page. */
export function BudgetPacingCard() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Budget Pacing</h2>
          <button
            type="button"
            className="text-slate-400 transition-colors hover:text-slate-600"
            aria-label="About Budget Pacing"
          >
            <Info className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-slate-200 bg-white text-slate-600 shadow-none"
          >
            Show filter (0)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-slate-200 bg-white text-slate-700 shadow-none"
          >
            <CalendarDays className="size-4 text-slate-500" />
            {BUDGET_PACING_SUMMARY.dateRange}
            <ChevronDown className="size-4 text-slate-400" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="border-slate-200 bg-white text-slate-600 shadow-none"
            aria-label="Edit widget"
          >
            <PencilLine className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="border-slate-200 bg-white text-slate-600 shadow-none"
            aria-label="Download"
          >
            <Download className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="border-slate-200 bg-white text-slate-600 shadow-none"
            aria-label="More options"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Current Budget"
            value={BUDGET_PACING_SUMMARY.currentBudget}
          />
          <MetricCard
            label="Actual Spend till date"
            value={BUDGET_PACING_SUMMARY.actualSpend}
            delta={BUDGET_PACING_SUMMARY.spendDelta}
          />
          <button
            type="button"
            className="flex min-h-[88px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-600"
            aria-label="Add metric card"
          >
            <Plus className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-medium">
            Dimension : {BUDGET_PACING_SUMMARY.dimensionLabel}
          </span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-3.5 rounded border-slate-300"
              defaultChecked
            />
            Plot Trend line
          </label>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-slate-200 bg-white px-2 text-xs shadow-none"
          >
            Roll up by: Days
            <ChevronDown className="size-3.5 text-slate-400" />
          </Button>
        </div>

        <ChartContainer
          config={CHART_CONFIG}
          className="aspect-[2.6/1] h-[280px] w-full rounded-lg border border-slate-200 bg-white"
        >
          <LineChart
            data={[...BUDGET_PACING_CHART_DATA]}
            margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 52000]}
              ticks={[0, 13000, 26000, 39000, 52000]}
              tickFormatter={formatSpendAxis}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="date"
                  formatter={(value) => formatSpendAxis(Number(value))}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="spend"
              stroke="var(--color-spend)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="size-3.5" />
          {BUDGET_PACING_SUMMARY.lastRefreshed}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Database className="size-3.5" />
          Gbo Budget Pacing
        </span>
      </footer>
    </section>
  );
}
