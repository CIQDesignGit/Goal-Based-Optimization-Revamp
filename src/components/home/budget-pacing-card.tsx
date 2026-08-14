"use client";

import {
  CalendarDays,
  ChevronDown,
  Database,
  Download,
  EllipsisVertical,
  Filter,
  Info,
  PencilLine,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildBudgetPacingSummary,
  formatComparisonDateRange,
  formatSpendAxis,
  getChartData,
} from "@/lib/home/budget-pacing-data";
import { formatFilterDateRange } from "@/lib/home/dashboard-filters";
import type { DashboardFilters } from "@/lib/home/dashboard-filters";
import type { PacingInstance } from "@/lib/home/pacing-instance";
import { cn } from "@/lib/utils";

/** Teal used in the live Budget Pacing product chart. */
const TEAL = "hsl(174 58% 39%)";

const CHART_CONFIG = {
  spend: {
    label: "Planned budget till date",
    color: TEAL,
  },
} as const;

type MetricKey =
  | "current-budget"
  | "planned-mtd"
  | "actual-spend"
  | "utilization";

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: "current-budget", label: "Current Budget" },
  { key: "planned-mtd", label: "Planned budget till date" },
  { key: "actual-spend", label: "Actual Spend till date" },
  { key: "utilization", label: "Utilization %" },
];

const DEFAULT_SLOTS: MetricKey[] = [
  "current-budget",
  "planned-mtd",
  "actual-spend",
  "utilization",
];

type BudgetPacingCardProps = {
  instance: PacingInstance;
  filters: DashboardFilters;
};

/**
 * Budget Pacing chart widget — matches the product Metrics + chart layout.
 * Numbers come from the shared pacing instance.
 */
export function BudgetPacingCard({ instance, filters }: BudgetPacingCardProps) {
  const summary = buildBudgetPacingSummary(instance);
  const chartData = getChartData(instance);
  const maxSpend = Math.max(...chartData.map((d) => d.spend), 1);
  const yMax = Math.ceil(maxSpend / 5000) * 5000 || 50_000;
  const comparisonRange = formatComparisonDateRange(
    filters.dateFrom,
    filters.dateTo,
  );

  const [selectedMetric, setSelectedMetric] =
    useState<MetricKey>("planned-mtd");
  const [slots, setSlots] = useState<MetricKey[]>(DEFAULT_SLOTS);
  const [dimensionOn, setDimensionOn] = useState(true);
  const [plotTrend, setPlotTrend] = useState(true);

  const metricValues: Record<
    MetricKey,
    { value: string; delta?: string }
  > = {
    "current-budget": { value: summary.currentBudget },
    "planned-mtd": { value: summary.plannedBudgetTillDate },
    "actual-spend": {
      value: summary.actualSpend,
      delta: summary.spendDelta,
    },
    utilization: { value: summary.utilization },
  };

  function changeSlotMetric(slotIndex: number, next: MetricKey) {
    setSlots((prev) => {
      const nextSlots = [...prev];
      const existingIndex = nextSlots.indexOf(next);
      // Swap if the chosen metric is already in another slot
      if (existingIndex !== -1 && existingIndex !== slotIndex) {
        nextSlots[existingIndex] = nextSlots[slotIndex];
      }
      nextSlots[slotIndex] = next;
      return nextSlots;
    });
    setSelectedMetric(next);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Budget Pacing</h2>
          <Tooltip>
            <TooltipTrigger
              className="inline-flex text-slate-400 transition-colors hover:text-slate-600"
              aria-label="About Budget Pacing"
            >
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-[280px] flex-col items-start gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-800 shadow-md [&>div:last-child]:hidden"
            >
              <p className="text-sm font-semibold text-slate-900">
                Budget Pacing
              </p>
              <p className="text-xs font-normal leading-relaxed text-slate-600">
                See budget allocated and plan vs spend, as inputted in Budget
                Optimizer
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-slate-200 bg-white text-slate-600 shadow-none"
          >
            <Filter className="size-3.5 text-slate-500" />
            Show filter
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs font-medium tabular-nums text-slate-600">
              0
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-col items-start justify-center gap-px border-slate-200 bg-white px-2.5 py-0 text-left text-slate-700 shadow-none"
          >
            <span className="inline-flex items-center gap-1 text-2xs font-medium leading-none">
              <CalendarDays className="size-3 shrink-0 text-slate-500" />
              {formatFilterDateRange(filters)}
              <ChevronDown className="size-3 text-slate-400" />
            </span>
            {comparisonRange ? (
              <span className="pl-4 text-2xs font-normal leading-none text-slate-400">
                {comparisonRange}
              </span>
            ) : null}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit widget"
          >
            <PencilLine className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
            aria-label="Download"
          >
            <Download className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
            aria-label="More options"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4 bg-white p-4">
        {/* Metrics */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Metrics</p>
          <div className="grid grid-cols-5 gap-3">
            {slots.map((metricKey, slotIndex) => {
              const option = METRIC_OPTIONS.find((o) => o.key === metricKey)!;
              const display = metricValues[metricKey];
              return (
                <MetricTile
                  key={`slot-${slotIndex}`}
                  label={option.label}
                  value={display.value}
                  delta={display.delta}
                  metricKey={metricKey}
                  selected={selectedMetric === metricKey}
                  onSelectCard={() => setSelectedMetric(metricKey)}
                  onChangeMetric={(next) => changeSlotMetric(slotIndex, next)}
                />
              );
            })}
            <button
              type="button"
              className="flex min-h-[88px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-600"
              aria-label="Add metric card"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        {/* Chart controls */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <Switch
              size="sm"
              checked={dimensionOn}
              onCheckedChange={setDimensionOn}
              aria-label="Toggle dimension"
              className="data-checked:bg-brand-500"
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700"
            >
              Dimension : {summary.dimensionLabel}
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            <span className="text-slate-300">|</span>
            <span className="cursor-not-allowed text-slate-400">Sort By</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <Switch
              size="sm"
              checked={plotTrend}
              onCheckedChange={setPlotTrend}
              aria-label="Plot trend line"
              className="data-checked:bg-brand-500"
            />
            <span>
              Plot Trend line
              {comparisonRange ? (
                <span className="text-slate-500">
                  {" "}
                  of {comparisonRange.replace(/^vs\.\s*/, "")}
                </span>
              ) : null}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-7 gap-1.5 border-slate-200 bg-white px-2 text-xs shadow-none"
            >
              <CalendarDays className="size-3.5 text-slate-500" />
              Roll up by: Days
              <ChevronDown className="size-3.5 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer
          config={CHART_CONFIG}
          className="aspect-[2.6/1] h-[280px] w-full bg-white"
        >
          <LineChart
            data={[...chartData]}
            margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tickMargin={8}
              minTickGap={24}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, yMax]}
              tickCount={8}
              tickFormatter={formatSpendAxis}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="date"
                  formatter={(value) => formatSpendAxis(Number(value))}
                />
              }
            />
            {plotTrend ? (
              <Line
                type="monotone"
                dataKey="spend"
                stroke="var(--color-spend)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: TEAL }}
              />
            ) : null}
          </LineChart>
        </ChartContainer>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="size-3.5" />
          {summary.lastRefreshed}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Database className="size-3.5" />
          Gbo Budget Pacing
        </span>
      </footer>
    </section>
  );
}

function MetricTile({
  label,
  value,
  delta,
  metricKey,
  selected,
  onSelectCard,
  onChangeMetric,
}: {
  label: string;
  value: string;
  delta?: string;
  metricKey: MetricKey;
  selected?: boolean;
  onSelectCard: () => void;
  onChangeMetric: (next: MetricKey) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelectCard}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectCard();
        }
      }}
      className={cn(
        "flex min-h-[88px] flex-col justify-center rounded-md border border-slate-200 bg-white px-4 py-3 text-left transition-colors",
        selected
          ? "border-t-[3px] border-t-[hsl(174_58%_39%)] shadow-sm"
          : "hover:border-slate-300",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Change metric, currently ${label}`}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-slate-400" aria-hidden />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className="w-56 gap-0.5 p-1"
        >
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={cn(
                "flex w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                opt.key === metricKey
                  ? "bg-brand-50 font-medium text-brand-600"
                  : "text-slate-700 hover:bg-slate-50",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onChangeMetric(opt.key);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <p className="text-xl font-semibold tabular-nums text-slate-900">
          {value}
        </p>
        {delta ? (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
            <span aria-hidden>↓</span>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
