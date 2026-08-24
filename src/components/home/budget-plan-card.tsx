"use client";

import {
  Download,
  EllipsisVertical,
  Filter,
  Info,
  PencilLine,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PeriodDatePresetPicker } from "@/components/home/period-date-preset-picker";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BUDGET_PLAN_GROUPS,
  BUDGET_PLAN_TOTAL_ROW,
  formatPlanUsd,
  type BudgetPlanLeafRow,
} from "@/lib/home/budget-plan-data";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";
import {
  formatPacingPercent,
  getPacingBandStatus,
  pacingStatusLabel,
  ratioToPercent,
  type PacingBandStatus,
} from "@/lib/home/pacing-status";
import { cn } from "@/lib/utils";

const COL_COUNT = 11;

type BudgetViewMode = "absolute" | "cumulative";

/**
 * Budget Plan table — Level 1 groups + Level 2 rows with pacing / iROAS colors.
 * Includes product Consolidated Total row + Current Budget column.
 */
export function BudgetPlanCard() {
  const [viewMode, setViewMode] = useState<BudgetViewMode>("absolute");
  const periodDatePreset = usePacingDashboardStore((s) => s.periodDatePreset);
  const setPeriodDatePreset = usePacingDashboardStore(
    (s) => s.setPeriodDatePreset,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Budget Plan</h2>
          <Tooltip>
            <TooltipTrigger
              className="inline-flex text-slate-400 transition-colors hover:text-slate-600"
              aria-label="About Budget Plan"
            >
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-[280px] flex-col items-start gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-800 shadow-md [&>div:last-child]:hidden"
            >
              <p className="text-sm font-semibold text-slate-900">Budget Plan</p>
              <p className="text-xs font-normal leading-relaxed text-slate-600">
                MTD pacing by Level 1 / Level 2 — On Plan at 97–102%. Switch
                Cumulative to see running totals within each Level 1 group.
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

          {/* Same control pattern as Budget Optimizer BudgetModeToggle */}
          <BudgetViewToggle value={viewMode} onChange={setViewMode} />

          <PeriodDatePresetPicker
            value={periodDatePreset}
            onChange={setPeriodDatePreset}
            align="end"
          />

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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Level 1
              </th>
              <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Level 2
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Current Budget
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Planned MTD
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Actual MTD
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Pacing %
              </th>
              <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Goal
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Goal Value
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                iROAS
              </th>
              <th className="px-3 py-2.5 text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Budget/Bid Opt
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                % Time in Budget
              </th>
            </tr>
          </thead>
          <tbody>
            <ConsolidatedTotalRow />
            {BUDGET_PLAN_GROUPS.map((group) => (
              <GroupRows
                key={group.level1}
                group={group}
                viewMode={viewMode}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Segmented control — same chrome as Budget Optimizer BudgetModeToggle.
 * Absolute = each row’s own dollars; Cumulative = running total in the group.
 */
function BudgetViewToggle({
  value,
  onChange,
}: {
  value: BudgetViewMode;
  onChange: (mode: BudgetViewMode) => void;
}) {
  return (
    <div
      className="inline-flex h-8 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-0.5"
      role="group"
      aria-label="Budget view mode"
    >
      <button
        type="button"
        onClick={() => onChange("cumulative")}
        className={cn(
          "h-full rounded px-2.5 text-xs font-medium transition-colors",
          value === "cumulative"
            ? "bg-white text-brand-500 shadow-sm"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        Cumulative
      </button>
      <button
        type="button"
        onClick={() => onChange("absolute")}
        className={cn(
          "h-full rounded px-2.5 text-xs font-medium transition-colors",
          value === "absolute"
            ? "bg-white text-brand-500 shadow-sm"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        Absolute
      </button>
    </div>
  );
}

/** Product rollup row — money columns filled; goal / opt columns show NA. */
function ConsolidatedTotalRow() {
  const total = BUDGET_PLAN_TOTAL_ROW;

  return (
    <tr className="border-b border-slate-100 bg-white">
      <td
        colSpan={2}
        className="max-w-[240px] truncate px-3 py-2.5 font-semibold text-slate-900"
        title={total.label}
      >
        {total.label}
      </td>
      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
        {formatPlanUsd(total.currentBudget)}
      </td>
      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
        {formatPlanUsd(total.plannedMtd)}
      </td>
      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
        {formatPlanUsd(total.actualMtd)}
      </td>
      <td className="px-3 py-2.5 text-right text-slate-400">NA</td>
      <td className="px-3 py-2.5 text-slate-400">NA</td>
      <td className="px-3 py-2.5 text-right text-slate-400">NA</td>
      <td className="px-3 py-2.5 text-right text-slate-400">NA</td>
      <td className="px-3 py-2.5 text-slate-400">NA</td>
      <td className="px-3 py-2.5 text-right text-slate-400">NA</td>
    </tr>
  );
}

function GroupRows({
  group,
  viewMode,
}: {
  group: { level1: string; rows: BudgetPlanLeafRow[] };
  viewMode: BudgetViewMode;
}) {
  // Running totals within this Level 1 group when Cumulative is on
  const displayRows = useMemo(() => {
    if (viewMode === "absolute") return group.rows;

    let runBudget = 0;
    let runPlanned = 0;
    let runActual = 0;
    return group.rows.map((row) => {
      runBudget += row.currentBudget;
      runPlanned += row.plannedMtd;
      runActual += row.actualMtd;
      return {
        ...row,
        currentBudget: runBudget,
        plannedMtd: runPlanned,
        actualMtd: runActual,
      };
    });
  }, [group.rows, viewMode]);

  return (
    <>
      {/* Level 1 banner — light blue bar like the reference */}
      <tr className="bg-brand-50">
        <td
          colSpan={COL_COUNT}
          className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-brand-800"
        >
          {group.level1}
        </td>
      </tr>
      {displayRows.map((row) => (
        <PlanRow key={row.id} row={row} />
      ))}
    </>
  );
}

function PlanRow({ row }: { row: BudgetPlanLeafRow }) {
  const pct = ratioToPercent(row.actualMtd, row.plannedMtd);
  const status = pct === null ? null : getPacingBandStatus(pct);
  const pacingTone =
    pct === null || status === null ? null : planPacingTone(pct, status);

  // Green when iROAS meets/beats goal; red when under goal
  const metricTone =
    row.actualMetricValue >= row.goalValue
      ? "text-success-700"
      : "text-error-600";

  return (
    <tr className="border-b border-slate-100 last:border-b-0 bg-white">
      <td className="px-3 py-2.5 text-slate-800" />
      <td className="px-3 py-2.5 text-slate-800">{row.level2}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {formatPlanUsd(row.currentBudget)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {formatPlanUsd(row.plannedMtd)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {formatPlanUsd(row.actualMtd)}
      </td>
      <td className="px-3 py-2.5 text-right">
        {pct === null || status === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className={cn("font-semibold tabular-nums", pacingTone)}>
            {pacingStatusLabel(status)} ({formatPacingPercent(pct)})
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-slate-700">{row.goalMetric}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {row.goalValue.toFixed(2)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right font-semibold tabular-nums",
          metricTone,
        )}
      >
        {row.actualMetricValue.toFixed(2)}
      </td>
      <td className="px-3 py-2.5 text-slate-800">
        {row.budgetOpt} / {row.bidOpt}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
        {row.percentTimeInBudget === null
          ? "—"
          : `${row.percentTimeInBudget.toFixed(1)}%`}
      </td>
    </tr>
  );
}

/**
 * Color coding from the reference screenshot:
 * - On Plan → green
 * - Ahead → orange
 * - Behind (mild, ≥85%) → orange
 * - Behind (severe, <85%) → red
 */
function planPacingTone(pct: number, status: PacingBandStatus): string {
  if (status === "on-plan") return "text-success-700";
  if (status === "ahead") return "text-warning-600";
  if (pct >= 85) return "text-warning-600";
  return "text-error-600";
}
