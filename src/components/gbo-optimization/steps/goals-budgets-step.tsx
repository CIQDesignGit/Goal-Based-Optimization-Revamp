"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  BUDGET_CURRENT_MONTH_INDEX,
  BUDGET_MONTHS,
  BUDGET_MONTH_VISIBLE_COUNT,
  getDefaultBudgetWindowStart,
  GOALS_SCOPE_ROWS,
} from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

const NUM_HEAD =
  "border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600";
const NUM_CELL = "border-r border-slate-100 p-1.5 text-right";
const BUDGET_HEAD =
  "min-w-[5.5rem] whitespace-nowrap border-r border-slate-200 px-2 py-2 text-right text-xs font-medium text-slate-600";
const BUDGET_CELL =
  "min-w-[5.5rem] whitespace-nowrap border-r border-slate-100 p-1 text-right";
const TARGET_HEAD =
  "w-28 min-w-28 border-r border-brand-200 bg-brand-50 px-2 py-2 text-right text-xs font-medium text-brand-800";
const TARGET_CELL =
  "w-28 min-w-28 border-r border-brand-100 bg-brand-50/70 p-1 text-right";
const EDITABLE_INPUT_CLASS =
  "h-8 w-full min-w-0 border-transparent bg-transparent px-1.5 text-right text-sm tabular-nums shadow-none hover:border-slate-200 focus-visible:border-brand-300 focus-visible:bg-white";
const BUDGET_INPUT_CLASS =
  "h-8 w-full min-w-[4.75rem] border-transparent bg-transparent px-1.5 text-right text-sm tabular-nums shadow-none hover:border-slate-200 focus-visible:border-brand-300 focus-visible:bg-white";
const SCOPE_COLUMN_MIN_WIDTH = 200;
const SCOPE_COLUMN_DEFAULT_WIDTH = 220;

type EditableRowState = {
  goalValue: string;
  monthlyBudgets: string[];
};

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return 0;
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function formatCurrency(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function sumMonthlyBudgets(budgets: string[]): number {
  return budgets.reduce((total, budget) => total + parseCurrency(budget), 0);
}

function padMonthlyBudgets(budgets: string[]): string[] {
  return Array.from(
    { length: BUDGET_MONTHS.length },
    (_, index) => budgets[index] ?? "",
  );
}

function createInitialRowState(): Record<string, EditableRowState> {
  return Object.fromEntries(
    GOALS_SCOPE_ROWS.map((row) => [
      row.id,
      {
        goalValue: row.goalValue,
        monthlyBudgets: padMonthlyBudgets(row.monthlyBudgets),
      },
    ]),
  );
}

function getVisibleMonthIndices(
  windowStart: number,
  monthCount: number = BUDGET_MONTH_VISIBLE_COUNT,
): number[] {
  return Array.from({ length: monthCount }, (_, offset) => windowStart + offset).filter(
    (index) => index < BUDGET_MONTHS.length,
  );
}

function useResizableColumnWidth(
  minWidth: number,
  initialWidth: number,
) {
  const [width, setWidth] = useState(initialWidth);

  const onResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      const onPointerMove = (moveEvent: PointerEvent) => {
        setWidth(
          Math.max(minWidth, startWidth + moveEvent.clientX - startX),
        );
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [minWidth, width],
  );

  return { width, onResizeStart };
}

type ScopeColumnHeaderProps = {
  width: number;
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

function ScopeColumnHeader({ width, onResizeStart }: ScopeColumnHeaderProps) {
  return (
    <th
      rowSpan={2}
      style={{ width, minWidth: SCOPE_COLUMN_MIN_WIDTH, maxWidth: width }}
      className="relative border-r border-slate-200 px-4 py-2.5 text-left font-medium"
    >
      <div className="truncate pr-2">
        <InfoLabel label="Scope" />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize scope column"
        onPointerDown={onResizeStart}
        className="absolute top-0 right-0 z-10 h-full w-2 translate-x-1/2 cursor-col-resize touch-none select-none hover:bg-brand-200/80"
      />
    </th>
  );
}

export function GoalsBudgetsStep() {
  const {
    optimizerType,
    includeSeasonality,
    setIncludeSeasonality,
    includeConstraints,
    setIncludeConstraints,
  } = useSetupContext();
  const isRuleBased = optimizerType === "rule-based";
  const [rowState, setRowState] = useState(createInitialRowState);
  const [monthWindowStart, setMonthWindowStart] = useState(() =>
    getDefaultBudgetWindowStart(BUDGET_CURRENT_MONTH_INDEX),
  );
  const { width: scopeColumnWidth, onResizeStart: onScopeResizeStart } =
    useResizableColumnWidth(
      SCOPE_COLUMN_MIN_WIDTH,
      SCOPE_COLUMN_DEFAULT_WIDTH,
    );

  const scopeColumnStyle = useMemo(
    () => ({
      width: scopeColumnWidth,
      minWidth: SCOPE_COLUMN_MIN_WIDTH,
      maxWidth: scopeColumnWidth,
    }),
    [scopeColumnWidth],
  );

  const visibleMonthIndices = useMemo(
    () => getVisibleMonthIndices(monthWindowStart),
    [monthWindowStart],
  );

  const canShowPreviousMonths = monthWindowStart > 0;
  const canShowFutureMonths =
    monthWindowStart + BUDGET_MONTH_VISIBLE_COUNT < BUDGET_MONTHS.length;

  const updateGoalValue = (rowId: string, value: string) => {
    setRowState((current) => ({
      ...current,
      [rowId]: { ...current[rowId], goalValue: value },
    }));
  };

  const formatGoalValue = (rowId: string) => {
    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const raw = row.goalValue.trim();
      if (!raw) return current;

      const scopeRow = GOALS_SCOPE_ROWS.find((item) => item.id === rowId);
      const isRoasTarget = scopeRow?.goalMetric === "ROAS";

      let formatted = raw;
      if (isRoasTarget) {
        const numeric = Number.parseFloat(raw.replace(/,/g, ""));
        if (!Number.isNaN(numeric)) {
          formatted = Number.isInteger(numeric)
            ? String(numeric)
            : numeric.toFixed(1);
        }
      } else if (raw.startsWith("$")) {
        formatted = raw;
      } else {
        formatted = formatCurrency(parseCurrency(raw)) || raw;
      }

      return {
        ...current,
        [rowId]: { ...row, goalValue: formatted },
      };
    });
  };

  const updateMonthlyBudget = (
    rowId: string,
    monthIndex: number,
    value: string,
  ) => {
    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const monthlyBudgets = [...row.monthlyBudgets];
      monthlyBudgets[monthIndex] = value;

      return {
        ...current,
        [rowId]: { ...row, monthlyBudgets },
      };
    });
  };

  const formatMonthlyBudget = (rowId: string, monthIndex: number) => {
    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const monthlyBudgets = [...row.monthlyBudgets];
      const raw = monthlyBudgets[monthIndex]?.trim() ?? "";

      monthlyBudgets[monthIndex] =
        raw === "" ? "" : formatCurrency(parseCurrency(raw));

      return {
        ...current,
        [rowId]: { ...row, monthlyBudgets },
      };
    });
  };

  const fyTotals = useMemo(() => {
    return Object.fromEntries(
      Object.entries(rowState).map(([rowId, row]) => [
        rowId,
        sumMonthlyBudgets(row.monthlyBudgets),
      ]),
    );
  }, [rowState]);

  return (
    <div className="flex flex-col gap-3 py-4">
      {isRuleBased && (
        <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Rule-based mode — set goals only. Budget entry is not part of this
          step (FR-005).
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search"
              className="h-9 border-slate-200 bg-white pl-9 shadow-none"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <Plus className="size-4" />
            Add Filters
          </Button>
        </div>

        {!isRuleBased && (
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Switch
                checked={includeSeasonality}
                onCheckedChange={setIncludeSeasonality}
              />
              <span>Seasonality</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Switch
                checked={includeConstraints}
                onCheckedChange={setIncludeConstraints}
              />
              <span>Constraints</span>
            </label>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: scopeColumnWidth }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
              <ScopeColumnHeader
                width={scopeColumnWidth}
                onResizeStart={onScopeResizeStart}
              />
              <th
                colSpan={3}
                className="border-r border-slate-200 px-4 py-2 text-center font-medium"
              >
                Goal
              </th>
              {!isRuleBased && (
                <th
                  colSpan={visibleMonthIndices.length + 1}
                  className="px-4 py-2 font-medium"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      disabled={!canShowPreviousMonths}
                      onClick={() =>
                        setMonthWindowStart((start) => Math.max(0, start - 1))
                      }
                      className="h-auto shrink-0 gap-1 px-0 text-brand-600 hover:text-brand-700"
                    >
                      <ChevronLeft className="size-4" />
                      Previous months
                    </Button>
                    <span className="text-center text-xs font-medium text-slate-600">
                      <InfoLabel label="Budget FY2026" />
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      disabled={!canShowFutureMonths}
                      onClick={() =>
                        setMonthWindowStart((start) =>
                          Math.min(
                            BUDGET_MONTHS.length - BUDGET_MONTH_VISIBLE_COUNT,
                            start + 1,
                          ),
                        )
                      }
                      className="h-auto shrink-0 gap-1 px-0 text-brand-600 hover:text-brand-700"
                    >
                      Future months
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </th>
              )}
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
              <th className="border-r border-slate-200 px-4 py-2 text-left font-medium">
                <InfoLabel label="Metric to optimize" />
              </th>
              <th className={TARGET_HEAD}>
                <div>Target value</div>
                <div className="mt-0.5 flex items-center justify-end gap-1 font-normal text-brand-700/80">
                  <span className="font-medium text-brand-700">Abs</span>
                  <span className="text-brand-400">|</span>
                  <span className="text-brand-500/70">%</span>
                </div>
              </th>
              <th className={cn(NUM_HEAD, "border-r border-slate-200")}>
                <span className="inline-flex w-full justify-end">
                  <InfoLabel label="Last 30 days performance" />
                </span>
              </th>
              {!isRuleBased &&
                visibleMonthIndices.map((monthIndex) => (
                  <th key={BUDGET_MONTHS[monthIndex]} className={BUDGET_HEAD}>
                    {BUDGET_MONTHS[monthIndex]}
                  </th>
                ))}
              {!isRuleBased && (
                <th className={cn(BUDGET_HEAD, "border-r-0")}>
                  <span className="inline-flex justify-end">
                    <InfoLabel label="FY 2026" />
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {GOALS_SCOPE_ROWS.map((row) => {
              const isParent = row.id === "entire-business";
              const editable = rowState[row.id];
              const fyTotal = fyTotals[row.id] ?? 0;

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td
                    style={scopeColumnStyle}
                    className={cn(
                      "overflow-hidden border-r border-slate-100 px-4 py-2.5 text-left",
                      isParent
                        ? "font-semibold text-slate-900"
                        : "font-medium text-slate-900",
                    )}
                  >
                    <span
                      className={cn(
                        "flex min-w-0 items-center gap-1",
                        row.indent && "pl-6",
                      )}
                      title={row.name}
                    >
                      {row.expandable && (
                        <ChevronDown className="size-4 shrink-0 text-slate-400" />
                      )}
                      <span className="truncate">{row.name}</span>
                    </span>
                  </td>
                  <td className="border-r border-slate-100 px-4 py-2.5 text-left text-slate-700">
                    {row.goalMetric}
                  </td>
                  <td className={TARGET_CELL}>
                    <Input
                      value={editable?.goalValue ?? ""}
                      onChange={(event) =>
                        updateGoalValue(row.id, event.target.value)
                      }
                      onBlur={() => formatGoalValue(row.id)}
                      placeholder="Set target"
                      aria-label={`Target value for ${row.name}`}
                      className={cn(
                        EDITABLE_INPUT_CLASS,
                        "text-brand-900 placeholder:text-brand-400/70",
                      )}
                    />
                  </td>
                  <td className={cn(NUM_CELL, "border-r border-slate-200")}>
                    <span className="block px-2 py-1.5 tabular-nums text-slate-700">
                      {row.last30Days}
                    </span>
                  </td>
                  {!isRuleBased &&
                    visibleMonthIndices.map((monthIndex) => (
                      <td
                        key={`${row.id}-${monthIndex}`}
                        className={BUDGET_CELL}
                      >
                        <Input
                          value={editable?.monthlyBudgets[monthIndex] ?? ""}
                          onChange={(event) =>
                            updateMonthlyBudget(
                              row.id,
                              monthIndex,
                              event.target.value,
                            )
                          }
                          onBlur={() => formatMonthlyBudget(row.id, monthIndex)}
                          aria-label={`${BUDGET_MONTHS[monthIndex]} budget for ${row.name}`}
                          className={cn(
                            BUDGET_INPUT_CLASS,
                            "text-slate-700 placeholder:text-transparent",
                          )}
                        />
                      </td>
                    ))}
                  {!isRuleBased && (
                    <td
                      className={cn(
                        BUDGET_CELL,
                        "border-r-0 px-2 py-2.5 tabular-nums text-slate-900",
                        isParent && "font-semibold",
                      )}
                    >
                      {formatCurrency(fyTotal) || "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
