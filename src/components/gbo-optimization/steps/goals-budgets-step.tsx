"use client";

import {
  ChevronDown,
  History,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { ChangedCellTooltip } from "@/components/gbo-optimization/changed-cell-tooltip";
import { ImpactBanner } from "@/components/gbo-optimization/impact-banner";
import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  BUDGET_CURRENT_MONTH_INDEX,
  BUDGET_MONTHS,
  getDefaultBudgetWindowEnd,
  getDefaultBudgetWindowStart,
  getScopeRowDefaultMonthlyBudget,
  GOALS_SCOPE_ROWS,
  isBudgetMonthLocked,
  isBudgetCurrentMonth,
  isBudgetFutureMonth,
  isRoasGoalMetric,
  PREFILL_METRIC_OPTIONS,
  RULE_BASED_OPTIMIZER_NOTICE,
  type GoalMetricValue,
} from "@/lib/gbo-optimization/setup-data";
import {
  getGoalsBudgetFieldKey,
  getLatestCellChange,
  recordGoalsBudgetChange,
  recordGoalsGoalChange,
  useSetupSessionStore,
  type GoalsRowState,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const ROW_BORDER = "border-b border-slate-100";
const HEAD_ROW_BORDER = "border-b border-slate-200";

const NUM_HEAD =
  "border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600";
const NUM_CELL = cn("border-r border-slate-100 p-1.5 text-right", ROW_BORDER);
const BUDGET_COL_WIDTH_CLASS =
  "w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] whitespace-nowrap";
const BUDGET_HEAD = cn(
  BUDGET_COL_WIDTH_CLASS,
  "border-r border-slate-200 px-2 py-2 text-right text-xs font-medium text-slate-600",
);
const BUDGET_CELL = cn(
  BUDGET_COL_WIDTH_CLASS,
  "border-r border-slate-100 p-1 text-right",
);
const TARGET_HEAD =
  "w-28 min-w-28 border-r border-slate-200 px-2 py-2 text-right text-xs font-medium text-slate-600";
const TARGET_CELL = cn(
  "w-28 min-w-28 border-r border-slate-100 p-1 text-right",
  ROW_BORDER,
);
const cellInputClass =
  "h-8 w-full min-w-0 border border-transparent px-1.5 text-right text-sm tabular-nums shadow-none hover:border-slate-200 focus-visible:border-slate-300 focus-visible:bg-white";
const budgetCellInputClass =
  "h-8 w-full min-w-0 border border-transparent px-1.5 text-right text-sm tabular-nums shadow-none hover:border-slate-200 focus-visible:border-brand-300 focus-visible:bg-white";
const SCOPE_COLUMN_MIN_WIDTH = 200;
const SCOPE_COLUMN_DEFAULT_WIDTH = 220;
/** Narrower scope column when budget months are hidden (rule-based flow). */
const SCOPE_COLUMN_RULE_BASED_MIN_WIDTH = 128;
const SCOPE_COLUMN_RULE_BASED_DEFAULT_WIDTH = 148;
const METRIC_COL_WIDTH_PX = 120;
const TARGET_COL_WIDTH_PX = 112;
const LAST_30_COL_WIDTH_PX = 120;
const GOAL_SECTION_WIDTH_PX =
  METRIC_COL_WIDTH_PX + TARGET_COL_WIDTH_PX + LAST_30_COL_WIDTH_PX;
const BUDGET_MONTH_COL_WIDTH_PX = 104;
const FY_COLUMN_WIDTH_PX = 104;
const METRIC_HEAD = cn(
  "border-r border-slate-200 px-4 py-2 text-left text-xs font-medium text-slate-600",
);
const METRIC_CELL = cn("border-r border-slate-100 p-1.5 text-left", ROW_BORDER);
const LAST_30_HEAD = cn(
  NUM_HEAD,
  "border-r border-slate-200 px-2",
);
const LAST_30_CELL = cn(NUM_CELL, "border-r border-slate-200 px-2");

const GOAL_METRIC_SELECT_OPTIONS = PREFILL_METRIC_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));
const METRIC_SELECT_TRIGGER_CLASS =
  "h-auto w-auto gap-1 border-0 bg-transparent p-0 text-sm font-medium text-slate-700 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 hover:bg-transparent";
const STICKY_SCOPE_HEAD =
  "sticky left-0 z-50 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]";
const STICKY_SCOPE_CELL =
  "sticky left-0 z-50 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50";
const STICKY_GOAL_HEAD = "sticky z-40 bg-slate-50";
const STICKY_GOAL_CELL = "sticky z-40 bg-white group-hover:bg-slate-50";
const STICKY_GOAL_EDGE =
  "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]";
const STICKY_FY_HEAD =
  "sticky right-0 z-40 bg-slate-50 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]";
const STICKY_FY_CELL =
  "sticky right-0 z-40 bg-white shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50";
const BUDGET_LOCKED_HINT = "Past months are locked and cannot be edited.";

function selectEditablePortion(input: HTMLInputElement) {
  const { value } = input;
  const start = value.startsWith("$") ? 1 : 0;
  const end = value.length;

  if (end > start) {
    input.setSelectionRange(start, end);
  } else if (value.length > 0) {
    input.select();
  }
}

function handleGoalsInputFocus(event: FocusEvent<HTMLInputElement>) {
  requestAnimationFrame(() => {
    selectEditablePortion(event.currentTarget);
  });
}

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

function normalizeCurrencyDisplay(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  return formatCurrency(parseCurrency(raw));
}

function normalizeGoalDisplay(value: string, isRoas: boolean): string {
  const raw = value.trim();
  if (!raw) return "";

  if (isRoas) {
    const numeric = Number.parseFloat(raw.replace(/,/g, ""));
    if (Number.isNaN(numeric)) return raw;
    return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
  }

  if (raw.startsWith("$")) return raw;
  return formatCurrency(parseCurrency(raw)) || raw;
}

function goalMatchesHistoric(
  state: GoalsRowState,
  isRoas: boolean,
): boolean {
  return (
    normalizeGoalDisplay(state.goalValue, isRoas) ===
    normalizeGoalDisplay(state.historicGoalValue, isRoas)
  );
}

function monthMatchesHistoric(
  state: GoalsRowState,
  monthIndex: number,
): boolean {
  return (
    normalizeCurrencyDisplay(state.monthlyBudgets[monthIndex] ?? "") ===
    normalizeCurrencyDisplay(state.historicMonthlyBudgets[monthIndex] ?? "")
  );
}

function getGoalCellVisualState(
  state: GoalsRowState,
  isRoas: boolean,
): "historic" | "edited" {
  if (state.editedGoalValue) return "edited";
  return goalMatchesHistoric(state, isRoas) ? "historic" : "edited";
}

type BudgetMonthVisual = "locked" | "prefilled" | "edited";

function getBudgetMonthVisualState(
  state: GoalsRowState,
  monthIndex: number,
): BudgetMonthVisual {
  if (isBudgetMonthLocked(monthIndex)) {
    return "locked";
  }

  if (state.editedMonthlyBudgets[monthIndex]) {
    return "edited";
  }

  return monthMatchesHistoric(state, monthIndex) ? "prefilled" : "edited";
}

function getBudgetCellTooltipVisual(
  state: GoalsRowState,
  monthIndex: number,
): "historic" | "edited" {
  const visual = getBudgetMonthVisualState(state, monthIndex);
  return visual === "prefilled" ? "historic" : "edited";
}

function budgetMonthHeadClass(monthIndex: number): string {
  const isCurrent = isBudgetCurrentMonth(monthIndex);

  return cn(
    BUDGET_HEAD,
    HEAD_ROW_BORDER,
    isBudgetMonthLocked(monthIndex) && "bg-slate-100 text-slate-400",
    !isBudgetMonthLocked(monthIndex) &&
      !isCurrent &&
      "bg-white text-slate-600",
    isCurrent &&
      "border-r-0 border-b-2 border-brand-500 bg-brand-50 font-semibold text-brand-700",
  );
}

function budgetMonthTdClass(
  visual: BudgetMonthVisual,
  monthIndex: number,
): string {
  const isCurrent = isBudgetCurrentMonth(monthIndex);

  return cn(
    BUDGET_CELL,
    ROW_BORDER,
    visual === "locked" && "bg-slate-100",
    isCurrent && visual !== "locked" && "border-r-0 bg-brand-50/40",
    visual === "edited" &&
      "[&_input]:font-medium [&_input]:!text-brand-600 [&_input]:not-italic",
  );
}

function getGoalsCellDiff(
  scopeId: string,
  fieldKey: string,
  historicFrom: string,
  currentTo: string,
): { from: string; to: string } {
  const entry = getLatestCellChange(scopeId, fieldKey);

  if (entry) {
    return { from: entry.from, to: entry.to };
  }

  return { from: historicFrom, to: currentTo };
}

function goalInputVisualClass(
  state: GoalsRowState,
  isRoas: boolean,
): string {
  const visual = getGoalCellVisualState(state, isRoas);

  return cn(
    cellInputClass,
    visual === "historic" &&
      "bg-slate-50 text-slate-500 italic placeholder:text-slate-400",
    visual === "edited" &&
      "bg-white font-medium text-slate-900 placeholder:text-slate-400",
  );
}

function budgetInputVisualClass(
  state: GoalsRowState,
  monthIndex: number,
): string {
  const value = state.monthlyBudgets[monthIndex]?.trim() ?? "";
  if (isBudgetFutureMonth(monthIndex) && !value) {
    return cn(
      budgetCellInputClass,
      "bg-white text-slate-900 placeholder:text-slate-300",
    );
  }

  const visual = getBudgetMonthVisualState(state, monthIndex);

  return cn(
    budgetCellInputClass,
    visual === "prefilled" &&
      "bg-slate-50 text-slate-400 italic placeholder:text-slate-300",
    visual === "edited" && "bg-white font-medium !text-brand-600",
  );
}

function getVisibleMonthIndices(
  windowStart: number,
  windowEnd: number,
): number[] {
  return Array.from(
    { length: windowEnd - windowStart },
    (_, offset) => windowStart + offset,
  ).filter((index) => index < BUDGET_MONTHS.length);
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

  return { width, setWidth, onResizeStart };
}

type ScopeColumnHeaderProps = {
  width: number;
  minWidth: number;
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

function stickyColumnStyle(
  left: number,
  width: number,
): { left: number; width: number; minWidth: number; maxWidth: number } {
  return { left, width, minWidth: width, maxWidth: width };
}

function MonthRangeToggle({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium transition-colors",
        pressed
          ? "bg-white text-slate-700 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {label}
    </button>
  );
}

function ScopeColumnHeader({
  width,
  minWidth,
  onResizeStart,
}: ScopeColumnHeaderProps) {
  return (
    <th
      rowSpan={2}
      style={{ width, minWidth, maxWidth: width }}
      className={cn(
        "relative border-r border-slate-200 px-4 py-2.5 text-left font-medium",
        HEAD_ROW_BORDER,
        STICKY_SCOPE_HEAD,
      )}
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
  const scopeMinWidth = isRuleBased
    ? SCOPE_COLUMN_RULE_BASED_MIN_WIDTH
    : SCOPE_COLUMN_MIN_WIDTH;
  const scopeDefaultWidth = isRuleBased
    ? SCOPE_COLUMN_RULE_BASED_DEFAULT_WIDTH
    : SCOPE_COLUMN_DEFAULT_WIDTH;
  const rowState = useSetupSessionStore((state) => state.goalsRowState);
  const setRowState = useSetupSessionStore((state) => state.setGoalsRowState);
  const historicHintDismissed = useSetupSessionStore(
    (state) => state.goalsHistoricHintDismissed,
  );
  const setHistoricHintDismissed = useSetupSessionStore(
    (state) => state.setGoalsHistoricHintDismissed,
  );
  const monthWindowStart = useSetupSessionStore(
    (state) => state.monthWindowStart,
  );
  const monthWindowEnd = useSetupSessionStore((state) => state.monthWindowEnd);
  const setMonthWindowRange = useSetupSessionStore(
    (state) => state.setMonthWindowRange,
  );
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const {
    width: scopeColumnWidth,
    setWidth: setScopeColumnWidth,
    onResizeStart: onScopeResizeStart,
  } = useResizableColumnWidth(scopeMinWidth, scopeDefaultWidth);

  useEffect(() => {
    if (!isRuleBased) return;

    setScopeColumnWidth((current) =>
      Math.max(scopeMinWidth, Math.min(current, scopeDefaultWidth)),
    );
  }, [isRuleBased, scopeMinWidth, scopeDefaultWidth, setScopeColumnWidth]);

  const scopeColumnStyle = useMemo(
    () => ({
      width: scopeColumnWidth,
      minWidth: scopeMinWidth,
      maxWidth: scopeColumnWidth,
    }),
    [scopeColumnWidth, scopeMinWidth],
  );

  const defaultMonthWindowStart = useMemo(
    () => getDefaultBudgetWindowStart(BUDGET_CURRENT_MONTH_INDEX),
    [],
  );
  const defaultMonthWindowEnd = useMemo(
    () => getDefaultBudgetWindowEnd(defaultMonthWindowStart),
    [defaultMonthWindowStart],
  );

  const visibleMonthIndices = useMemo(
    () => getVisibleMonthIndices(monthWindowStart, monthWindowEnd),
    [monthWindowStart, monthWindowEnd],
  );

  const goalStickyOffsets = useMemo(
    () => ({
      goalSection: scopeColumnWidth,
      metric: scopeColumnWidth,
      target: scopeColumnWidth + METRIC_COL_WIDTH_PX,
      last30: scopeColumnWidth + METRIC_COL_WIDTH_PX + TARGET_COL_WIDTH_PX,
    }),
    [scopeColumnWidth],
  );

  const tableMinWidth = useMemo(() => {
    const goalSectionWidth = scopeColumnWidth + GOAL_SECTION_WIDTH_PX;

    if (isRuleBased) {
      return goalSectionWidth;
    }

    return (
      goalSectionWidth +
      visibleMonthIndices.length * BUDGET_MONTH_COL_WIDTH_PX +
      FY_COLUMN_WIDTH_PX
    );
  }, [scopeColumnWidth, visibleMonthIndices.length, isRuleBased]);

  const showPreviousMonths = monthWindowStart === 0;
  const showFutureMonths = monthWindowEnd === BUDGET_MONTHS.length;

  const togglePreviousMonths = () => {
    if (showPreviousMonths) {
      setMonthWindowRange(defaultMonthWindowStart, monthWindowEnd);
      return;
    }

    setMonthWindowRange(0, monthWindowEnd);
    requestAnimationFrame(() => {
      tableScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    });
  };

  const toggleFutureMonths = () => {
    if (showFutureMonths) {
      setMonthWindowRange(monthWindowStart, defaultMonthWindowEnd);
      return;
    }

    setMonthWindowRange(monthWindowStart, BUDGET_MONTHS.length);
    requestAnimationFrame(() => {
      const container = tableScrollRef.current;
      if (!container) return;
      container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
    });
  };

  const updateGoalValue = (rowId: string, value: string) => {
    setRowState((current) => ({
      ...current,
      [rowId]: { ...current[rowId], goalValue: value },
    }));
  };

  const updateGoalMetric = (rowId: string, value: string) => {
    setRowState((current) => ({
      ...current,
      [rowId]: {
        ...current[rowId],
        goalMetric: value as GoalMetricValue,
      },
    }));
  };

  const formatGoalValue = (rowId: string) => {
    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const isRoasTarget = isRoasGoalMetric(row.goalMetric);
      const formatted = normalizeGoalDisplay(row.goalValue, isRoasTarget);
      const nextRow: GoalsRowState = {
        ...row,
        goalValue: formatted,
        editedGoalValue: false,
      };
      nextRow.editedGoalValue = !goalMatchesHistoric(nextRow, isRoasTarget);

      if (
        normalizeGoalDisplay(row.historicGoalValue, isRoasTarget) !== formatted
      ) {
        recordGoalsGoalChange(
          rowId,
          row.historicGoalValue,
          formatted,
        );
      }

      return {
        ...current,
        [rowId]: nextRow,
      };
    });
  };

  const updateMonthlyBudget = (
    rowId: string,
    monthIndex: number,
    value: string,
  ) => {
    if (isBudgetMonthLocked(monthIndex)) {
      return;
    }

    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const monthlyBudgets = [...row.monthlyBudgets];
      monthlyBudgets[monthIndex] = value;

      const historicValue = row.historicMonthlyBudgets[monthIndex] ?? "";
      const editedMonthlyBudgets = [...row.editedMonthlyBudgets];
      const trimmed = value.trim();

      if (!trimmed) {
        editedMonthlyBudgets[monthIndex] = false;
      } else {
        editedMonthlyBudgets[monthIndex] =
          normalizeCurrencyDisplay(historicValue) !==
          normalizeCurrencyDisplay(value);
      }

      return {
        ...current,
        [rowId]: { ...row, monthlyBudgets, editedMonthlyBudgets },
      };
    });
  };

  const formatMonthlyBudget = (rowId: string, monthIndex: number) => {
    if (isBudgetMonthLocked(monthIndex)) {
      return;
    }

    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const monthlyBudgets = [...row.monthlyBudgets];
      const raw = monthlyBudgets[monthIndex]?.trim() ?? "";
      const historicValue = row.historicMonthlyBudgets[monthIndex] ?? "";

      if (isBudgetFutureMonth(monthIndex) && raw === "") {
        monthlyBudgets[monthIndex] = "";
        const editedMonthlyBudgets = [...row.editedMonthlyBudgets];
        editedMonthlyBudgets[monthIndex] = false;

        return {
          ...current,
          [rowId]: { ...row, monthlyBudgets, editedMonthlyBudgets },
        };
      }

      const scopeRow = GOALS_SCOPE_ROWS.find((item) => item.id === rowId);
      const last30DayBudgetDefault = scopeRow
        ? normalizeCurrencyDisplay(
            getScopeRowDefaultMonthlyBudget(scopeRow),
          )
        : "";
      const historicOrDefault = isBudgetFutureMonth(monthIndex)
        ? normalizeCurrencyDisplay(historicValue)
        : normalizeCurrencyDisplay(historicValue) || last30DayBudgetDefault;

      monthlyBudgets[monthIndex] =
        raw === "" ? historicOrDefault : normalizeCurrencyDisplay(raw);

      const editedMonthlyBudgets = [...row.editedMonthlyBudgets];
      editedMonthlyBudgets[monthIndex] =
        normalizeCurrencyDisplay(historicValue) !==
        normalizeCurrencyDisplay(monthlyBudgets[monthIndex] ?? "");

      if (editedMonthlyBudgets[monthIndex]) {
        recordGoalsBudgetChange(
          rowId,
          monthIndex,
          historicValue,
          monthlyBudgets[monthIndex] ?? "",
        );
      }

      return {
        ...current,
        [rowId]: { ...row, monthlyBudgets, editedMonthlyBudgets },
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
        <ImpactBanner title="Rule-based — goals only">
          {RULE_BASED_OPTIMIZER_NOTICE}
        </ImpactBanner>
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

      <div
        ref={tableScrollRef}
        className={cn(
          "rounded-lg border border-slate-200 bg-white",
          !isRuleBased && "overflow-x-auto",
        )}
      >
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: tableMinWidth }}
        >
          <colgroup>
            <col style={{ width: scopeColumnWidth }} />
            <col style={{ width: METRIC_COL_WIDTH_PX }} />
            <col style={{ width: TARGET_COL_WIDTH_PX }} />
            <col style={{ width: LAST_30_COL_WIDTH_PX }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-600">
              <ScopeColumnHeader
                width={scopeColumnWidth}
                minWidth={scopeMinWidth}
                onResizeStart={onScopeResizeStart}
              />
              <th
                colSpan={3}
                style={stickyColumnStyle(
                  goalStickyOffsets.goalSection,
                  GOAL_SECTION_WIDTH_PX,
                )}
                className={cn(
                  "border-r border-slate-200 px-4 py-2 text-center font-medium",
                  HEAD_ROW_BORDER,
                  STICKY_GOAL_HEAD,
                  STICKY_GOAL_EDGE,
                )}
              >
                Goal
              </th>
              {!isRuleBased && (
                <th
                  colSpan={visibleMonthIndices.length + 1}
                  className={cn("px-4 py-2 font-medium", HEAD_ROW_BORDER)}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="inline-flex rounded-md bg-slate-100 p-0.5"
                      role="group"
                      aria-label="Show previous months"
                    >
                      <MonthRangeToggle
                        label="Previous months"
                        pressed={showPreviousMonths}
                        onClick={togglePreviousMonths}
                      />
                    </div>
                    <span className="shrink-0 text-center text-xs font-medium text-slate-600">
                      <InfoLabel label="Budget FY2026" />
                    </span>
                    <div
                      className="inline-flex rounded-md bg-slate-100 p-0.5"
                      role="group"
                      aria-label="Show future months"
                    >
                      <MonthRangeToggle
                        label="Future months"
                        pressed={showFutureMonths}
                        onClick={toggleFutureMonths}
                      />
                    </div>
                  </div>
                </th>
              )}
            </tr>
            <tr className="bg-slate-50 text-xs text-slate-600">
              <th
                style={stickyColumnStyle(
                  goalStickyOffsets.metric,
                  METRIC_COL_WIDTH_PX,
                )}
                className={cn(METRIC_HEAD, HEAD_ROW_BORDER, STICKY_GOAL_HEAD)}
              >
                <InfoLabel label="Metric to optimize" />
              </th>
              <th
                style={stickyColumnStyle(
                  goalStickyOffsets.target,
                  TARGET_COL_WIDTH_PX,
                )}
                className={cn(TARGET_HEAD, HEAD_ROW_BORDER, STICKY_GOAL_HEAD)}
              >
                <span className="inline-flex w-full justify-end">
                  <InfoLabel
                    label="Target value (Optional)"
                    tooltip="The goal value is indicative only and does not change Ally AI optimization logic."
                  />
                </span>
                <div className="mt-0.5 flex items-center justify-end gap-1 font-normal text-slate-500">
                  <span className="font-medium text-slate-600">Abs</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400">%</span>
                </div>
              </th>
              <th
                style={stickyColumnStyle(
                  goalStickyOffsets.last30,
                  LAST_30_COL_WIDTH_PX,
                )}
                className={cn(
                  LAST_30_HEAD,
                  HEAD_ROW_BORDER,
                  STICKY_GOAL_HEAD,
                  STICKY_GOAL_EDGE,
                )}
              >
                <span className="inline-flex w-full justify-end">
                  <InfoLabel label="Last 30 days performance" />
                </span>
              </th>
              {!isRuleBased &&
                visibleMonthIndices.map((monthIndex) => {
                  const isCurrent = isBudgetCurrentMonth(monthIndex);

                  return (
                    <th
                      key={BUDGET_MONTHS[monthIndex]}
                      className={budgetMonthHeadClass(monthIndex)}
                      title={isCurrent ? "Current month" : undefined}
                      aria-current={isCurrent ? "date" : undefined}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {isCurrent ? (
                          <span
                            className="size-1.5 shrink-0 rounded-full bg-brand-500"
                            aria-hidden
                          />
                        ) : null}
                        {BUDGET_MONTHS[monthIndex]}
                      </span>
                    </th>
                  );
                })}
              {!isRuleBased && (
                <th className={cn(BUDGET_HEAD, "border-r-0", HEAD_ROW_BORDER, STICKY_FY_HEAD)}>
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
              const isRoasTarget = editable
                ? isRoasGoalMetric(editable.goalMetric)
                : isRoasGoalMetric(row.goalMetric);

              return (
                <tr key={row.id} className="group hover:bg-slate-50/50">
                  <td
                    style={scopeColumnStyle}
                    className={cn(
                      "overflow-hidden border-r border-slate-100 px-4 py-2.5 text-left",
                      ROW_BORDER,
                      STICKY_SCOPE_CELL,
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
                  <td
                    style={stickyColumnStyle(
                      goalStickyOffsets.metric,
                      METRIC_COL_WIDTH_PX,
                    )}
                    className={cn(
                      METRIC_CELL,
                      STICKY_GOAL_CELL,
                      "overflow-visible",
                    )}
                  >
                    {editable ? (
                      <div className="min-w-22">
                        <SetupInlineSelect
                          hideLabel
                          label={`Metric to optimize for ${row.name}`}
                          value={editable.goalMetric}
                          options={GOAL_METRIC_SELECT_OPTIONS}
                          placeholder="Select metric"
                          onValueChange={(value) =>
                            updateGoalMetric(row.id, value)
                          }
                          triggerClassName={METRIC_SELECT_TRIGGER_CLASS}
                        />
                      </div>
                    ) : null}
                  </td>
                  <td
                    style={stickyColumnStyle(
                      goalStickyOffsets.target,
                      TARGET_COL_WIDTH_PX,
                    )}
                    className={cn(TARGET_CELL, STICKY_GOAL_CELL)}
                  >
                    {editable ? (
                      <ChangedCellTooltip
                        visual={getGoalCellVisualState(editable, isRoasTarget)}
                        {...getGoalsCellDiff(
                          row.id,
                          "goalValue",
                          editable.historicGoalValue,
                          editable.goalValue,
                        )}
                      >
                        <Input
                          value={editable.goalValue}
                          onChange={(event) =>
                            updateGoalValue(row.id, event.target.value)
                          }
                          onFocus={handleGoalsInputFocus}
                          onClick={(event) =>
                            selectEditablePortion(event.currentTarget)
                          }
                          onBlur={() => formatGoalValue(row.id)}
                          placeholder="Set target"
                          aria-label={`Target value for ${row.name}`}
                          className={goalInputVisualClass(editable, isRoasTarget)}
                        />
                      </ChangedCellTooltip>
                    ) : null}
                  </td>
                  <td
                    style={stickyColumnStyle(
                      goalStickyOffsets.last30,
                      LAST_30_COL_WIDTH_PX,
                    )}
                    className={cn(LAST_30_CELL, STICKY_GOAL_CELL, STICKY_GOAL_EDGE)}
                  >
                    <span className="block px-2 py-1.5 tabular-nums text-slate-700">
                      {row.last30Days}
                    </span>
                  </td>
                  {!isRuleBased &&
                    visibleMonthIndices.map((monthIndex) => {
                      const monthVisual = editable
                        ? getBudgetMonthVisualState(editable, monthIndex)
                        : "locked";
                      const budgetValue =
                        editable?.monthlyBudgets[monthIndex] ?? "";

                      return (
                        <td
                          key={`${row.id}-${monthIndex}`}
                          className={budgetMonthTdClass(monthVisual, monthIndex)}
                        >
                          {editable && monthVisual === "locked" ? (
                            <span
                              className="block px-2 py-1.5 tabular-nums text-slate-500"
                              title={BUDGET_LOCKED_HINT}
                              aria-label={`${BUDGET_MONTHS[monthIndex]} budget for ${row.name} (locked)`}
                            >
                              {budgetValue || "—"}
                            </span>
                          ) : editable ? (
                            <ChangedCellTooltip
                              visual={getBudgetCellTooltipVisual(
                                editable,
                                monthIndex,
                              )}
                              {...getGoalsCellDiff(
                                row.id,
                                getGoalsBudgetFieldKey(monthIndex),
                                editable.historicMonthlyBudgets[monthIndex] ??
                                  "",
                                editable.monthlyBudgets[monthIndex] ?? "",
                              )}
                            >
                              <Input
                                value={budgetValue}
                                onChange={(event) =>
                                  updateMonthlyBudget(
                                    row.id,
                                    monthIndex,
                                    event.target.value,
                                  )
                                }
                                onFocus={handleGoalsInputFocus}
                                onClick={(event) =>
                                  selectEditablePortion(event.currentTarget)
                                }
                                onBlur={() =>
                                  formatMonthlyBudget(row.id, monthIndex)
                                }
                                aria-label={`${BUDGET_MONTHS[monthIndex]} budget for ${row.name}`}
                                className={budgetInputVisualClass(
                                  editable,
                                  monthIndex,
                                )}
                              />
                            </ChangedCellTooltip>
                          ) : null}
                        </td>
                      );
                    })}
                  {!isRuleBased && (
                    <td
                      className={cn(
                        BUDGET_CELL,
                        "border-r-0 px-2 py-2.5 tabular-nums text-slate-900",
                        ROW_BORDER,
                        STICKY_FY_CELL,
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

      {!historicHintDismissed && (
        <div className="sticky bottom-0 z-20 shrink-0 -mx-2 border-t border-slate-200 bg-slate-50/95 px-4 py-3 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <History className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <p className="flex-1 pr-2">
              <span className="font-medium text-slate-500">Locked</span> past
              months (gray) cannot be edited. Gray italic values in editable
              months are based on your{" "}
              <span className="font-medium text-slate-700">last 30 days</span> of
              performance — edit any cell to override (shown in{" "}
              <span className="font-medium text-brand-600">blue</span>). The{" "}
              <span className="font-medium text-slate-700">FY 2026</span> total
              updates automatically from your monthly budgets.
            </p>
            <button
              type="button"
              onClick={() => setHistoricHintDismissed(true)}
              className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-600"
              aria-label="Dismiss hint"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
