"use client";

import {
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  BUDGET_PLAN_PAGE_SIZE,
  BUDGET_PLAN_TOTAL_COUNT,
  BUDGET_PLAN_TOTAL_ROW,
  formatPlanMetric,
  formatPlanUsd,
  getBudgetPlanPage,
  type BudgetPlanRow,
} from "@/lib/home/budget-plan-data";
import { usePacingDashboardStore } from "@/lib/home/pacing-dashboard-store";
import { cn } from "@/lib/utils";

/**
 * Budget Plan table widget — matches the product reference below Budget Pacing.
 */
export function BudgetPlanCard() {
  const [page, setPage] = useState(1);
  const periodDatePreset = usePacingDashboardStore((s) => s.periodDatePreset);
  const setPeriodDatePreset = usePacingDashboardStore(
    (s) => s.setPeriodDatePreset,
  );
  const pageSize = BUDGET_PLAN_PAGE_SIZE;
  const totalPages = Math.ceil(BUDGET_PLAN_TOTAL_COUNT / pageSize);
  const pageRows = useMemo(() => getBudgetPlanPage(page, pageSize), [page]);

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, BUDGET_PLAN_TOTAL_COUNT);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      {/* Header — same chrome as Budget Pacing */}
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
        <table className="w-full min-w-[920px] border-collapse text-sm [&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Budget Category - CIQ
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="inline-flex items-center justify-end gap-1">
                  Goal
                  <span className="inline-flex size-4 items-center justify-center rounded-full border border-slate-300 text-slate-400">
                    <ArrowDown className="size-2.5" aria-hidden />
                  </span>
                </span>
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Value
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Actual
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Current Budget
              </th>
              <th className="px-3 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Planned budget till date
              </th>
              <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Actual Spend till date
              </th>
            </tr>
          </thead>
          <tbody>
            <PlanRow row={BUDGET_PLAN_TOTAL_ROW} emphasize />
            {pageRows.map((row) => (
              <PlanRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <footer className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-600">
        <div className="inline-flex items-center gap-1.5">
          <span>Rows per page:</span>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 font-medium text-slate-800"
            aria-label="Rows per page"
          >
            {pageSize}
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>
        </div>

        <span className="tabular-nums text-slate-700">
          {rangeStart} - {rangeEnd} / {BUDGET_PLAN_TOTAL_COUNT}
        </span>

        <nav
          className="inline-flex items-center gap-1"
          aria-label="Budget Plan pagination"
        >
          <PageIconButton
            label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </PageIconButton>

          <PageNumberButton
            active={page === 1}
            onClick={() => setPage(1)}
            label="Page 1"
          >
            1
          </PageNumberButton>

          {totalPages >= 2 ? (
            <PageNumberButton
              active={page === 2}
              onClick={() => setPage(2)}
              label="Page 2"
            >
              2
            </PageNumberButton>
          ) : null}

          {totalPages > 3 ? (
            <span className="px-1 text-slate-400" aria-hidden>
              ...
            </span>
          ) : null}

          {totalPages > 2 ? (
            <PageNumberButton
              active={page === totalPages}
              onClick={() => setPage(totalPages)}
              label={`Page ${totalPages}`}
            >
              {totalPages}
            </PageNumberButton>
          ) : null}

          <PageIconButton
            label="Next page"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </PageIconButton>
        </nav>
      </footer>
    </section>
  );
}

function PlanRow({
  row,
  emphasize = false,
}: {
  row: BudgetPlanRow;
  emphasize?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 last:border-b-0",
        emphasize && "bg-white",
      )}
    >
      <td
        className={cn(
          "max-w-[240px] truncate px-4 py-2.5 text-slate-800",
          emphasize ? "font-semibold text-slate-900" : "font-medium",
        )}
        title={row.category}
      >
        {row.category}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
        {row.goal ?? "NA"}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
        {formatPlanMetric(row.value)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
        {formatPlanMetric(row.actual)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right tabular-nums text-slate-800",
          emphasize && "font-semibold",
        )}
      >
        {formatPlanUsd(row.currentBudget)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right tabular-nums text-slate-800",
          emphasize && "font-semibold",
        )}
      >
        {formatPlanUsd(row.plannedTillDate)}
      </td>
      <td
        className={cn(
          "px-4 py-2.5 text-right tabular-nums text-slate-800",
          emphasize && "font-semibold",
        )}
      >
        {formatPlanUsd(row.actualSpendTillDate)}
      </td>
    </tr>
  );
}

function PageNumberButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-xs font-medium tabular-nums transition-colors",
        active
          ? "text-brand-500"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      {children}
    </button>
  );
}

function PageIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}
