"use client";

import {
  ChevronDown,
  Info,
  Plus,
  Search,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { ChangedCellTooltip, formatCellDiffValue } from "@/components/gbo-optimization/changed-cell-tooltip";
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
  getNextBudgetMonthIndex,
  getScopeRowDefaultMonthlyBudget,
  GOALS_GOAL_EDITABLE_ROWS,
  GOALS_SCOPE_ROWS,
  ENTIRE_BUSINESS_SCOPE_ID,
  GOAL_TYPE_OPTIONS,
  isBudgetMonthLocked,
  isBudgetCurrentMonth,
  isBudgetFutureMonth,
  isBudgetNextMonth,
  getGoalTypeLabel,
  isRoasGoalMetric,
  RULE_BASED_OPTIMIZER_NOTICE,
  type GoalType,
} from "@/lib/gbo-optimization/setup-data";
import {
  getGoalsBudgetFieldKey,
  getLatestCellChange,
  recordGoalsBudgetChange,
  recordGoalsGoalChange,
  recordGoalsGoalMetricChange,
  useSetupSessionStore,
  type GoalsRowState,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const ROW_BORDER = "border-b border-slate-100";
const HEAD_ROW_BORDER = "border-b border-slate-200";

const NUM_HEAD =
  "border-r border-slate-200 px-3 py-2 text-right text-xs font-medium text-slate-600";
const NUM_CELL = cn("border-r border-slate-100 p-1.5 text-right", ROW_BORDER);
const BUDGET_COL_WIDTH_NORMAL =
  "w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] whitespace-nowrap";
const BUDGET_COL_WIDTH_NUDGE =
  "w-[9rem] min-w-[9rem] max-w-[9rem] whitespace-normal";
const BUDGET_COL_WIDTH_CLASS = BUDGET_COL_WIDTH_NORMAL;
const BUDGET_HEAD_BASE =
  "border-r border-slate-200 px-2 py-2 text-right text-xs font-medium text-slate-600";
const BUDGET_MONTH_HEADER_WITH_NUDGE_CLASS = "min-h-[4.5rem]";
const BUDGET_MONTH_NUDGE_FOOTER_CLASS =
  "min-h-[1.75rem] text-right text-[10px] font-normal leading-snug text-slate-500";
const BUDGET_HEAD = cn(BUDGET_COL_WIDTH_CLASS, BUDGET_HEAD_BASE);
const BUDGET_CELL_BASE =
  "overflow-visible border-r border-slate-100 p-1 text-right";
const BUDGET_CELL = cn(BUDGET_COL_WIDTH_CLASS, BUDGET_CELL_BASE);
const TARGET_HEAD =
  "w-28 min-w-28 border-r border-slate-200 px-2 py-2 text-right text-xs font-medium text-slate-600";
const TARGET_CELL = cn(
  "w-28 min-w-28 overflow-visible border-r border-slate-100 p-1 text-right",
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
const METRIC_COL_WIDTH_PX = 220;
const TARGET_COL_WIDTH_PX = 112;
const LAST_30_COL_WIDTH_PX = 120;
/** Sticky Goal group: metric only until a goal unlocks target + last-30. */
function getGoalSectionWidthPx(showGoalDetailColumns: boolean): number {
  return showGoalDetailColumns
    ? METRIC_COL_WIDTH_PX + TARGET_COL_WIDTH_PX + LAST_30_COL_WIDTH_PX
    : METRIC_COL_WIDTH_PX;
}
const BUDGET_MONTH_COL_WIDTH_PX = 104;
const BUDGET_NUDGE_MONTH_COL_WIDTH_PX = 144;
const FY_COLUMN_WIDTH_PX = 104;

function isBudgetNudgeColumn(monthIndex: number, showNudge: boolean): boolean {
  return showNudge && isBudgetNextMonth(monthIndex);
}

function budgetColumnWidthClass(monthIndex: number, showNudge: boolean): string {
  return isBudgetNudgeColumn(monthIndex, showNudge)
    ? BUDGET_COL_WIDTH_NUDGE
    : BUDGET_COL_WIDTH_NORMAL;
}
const METRIC_HEAD = cn(
  "border-r border-slate-200 px-4 py-2 text-left text-xs font-medium text-slate-600",
);
const METRIC_CELL = cn("border-r border-slate-100 p-1.5 text-left", ROW_BORDER);
const LAST_30_HEAD = cn(
  NUM_HEAD,
  "border-r border-slate-200 px-2",
);
const LAST_30_CELL = cn(
  "border-r border-slate-100 p-1.5 text-right px-2",
  ROW_BORDER,
);

const GOAL_METRIC_SELECT_OPTIONS = GOAL_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));
const BULK_CLEAR_GOAL_VALUE = "__clear-goal__";
const BULK_GOAL_METRIC_SELECT_OPTIONS = [
  { value: BULK_CLEAR_GOAL_VALUE, label: "Select goal" },
  ...GOAL_METRIC_SELECT_OPTIONS,
];
const GOAL_METRIC_MENU_MIN_WIDTH_PX = 220;
const METRIC_SELECT_TRIGGER_CLASS =
  "h-auto w-auto gap-1 border-0 bg-transparent p-0 text-sm font-medium text-slate-700 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 hover:bg-transparent";
const BULK_METRIC_SELECT_TRIGGER_CLASS =
  "flex h-8 w-full items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 shadow-none hover:border-slate-300 focus-visible:border-brand-300 focus-visible:ring-2 focus-visible:ring-brand-500/20";
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
const BUDGET_GOAL_REQUIRED_HINT =
  "Select a goal before entering budget.";
const HISTORIC_PREFILL_TOAST =
  "Prefilled values are based on your last 30 days performance. Click on the cell to edit them.";
const PARENT_BUDGET_VALUE_CLASS = "font-semibold text-slate-700";
/** Shown when Next is clicked without goals on every row. */
const MISSING_GOAL_HIGHLIGHT_CLASS =
  "bg-amber-50 ring-2 ring-inset ring-amber-200";

function rowNeedsNextMonthBudget(
  row: GoalsRowState,
  nextMonthIndex: number,
): boolean {
  if (!row.goalMetric) return false;
  return !(row.monthlyBudgets[nextMonthIndex]?.trim() ?? "");
}

function getBulkGoalMetric(
  rowState: Record<string, GoalsRowState>,
): GoalType | null | typeof BULK_CLEAR_GOAL_VALUE {
  const metrics = GOALS_GOAL_EDITABLE_ROWS.map(
    (row) => rowState[row.id]?.goalMetric ?? null,
  );

  if (metrics.every((metric) => metric === null)) {
    return BULK_CLEAR_GOAL_VALUE;
  }

  const first = metrics[0];

  if (first && metrics.every((metric) => metric === first)) {
    return first;
  }

  return null;
}

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
  const input = event.currentTarget;
  requestAnimationFrame(() => {
    selectEditablePortion(input);
  });
}

function handleGoalsInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter") return;

  event.preventDefault();
  event.currentTarget.blur();
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

function getBudgetCellDiff(
  scopeId: string,
  state: GoalsRowState,
  monthIndex: number,
): { from: string; to: string } {
  const fieldKey = getGoalsBudgetFieldKey(monthIndex);
  const entry = getLatestCellChange(scopeId, fieldKey);
  const to = state.monthlyBudgets[monthIndex] ?? "";

  if (entry) {
    return { from: entry.from, to: entry.to };
  }

  const historicValue = state.historicMonthlyBudgets[monthIndex] ?? "";
  const scopeRow = GOALS_SCOPE_ROWS.find((item) => item.id === scopeId);
  const last30DayBudgetDefault = scopeRow
    ? normalizeCurrencyDisplay(getScopeRowDefaultMonthlyBudget(scopeRow))
    : "";
  const from = isBudgetFutureMonth(monthIndex)
    ? normalizeCurrencyDisplay(historicValue)
    : normalizeCurrencyDisplay(historicValue) || last30DayBudgetDefault;

  return { from, to };
}

function getBudgetCellTooltipVisual(
  state: GoalsRowState,
  monthIndex: number,
): "historic" | "edited" {
  if (state.editedMonthlyBudgets[monthIndex]) {
    return "edited";
  }

  return monthMatchesHistoric(state, monthIndex) ? "historic" : "edited";
}

function buildBudgetHoverTitle(
  visual: "historic" | "edited",
  from: string,
  to: string,
): string | undefined {
  if (visual === "historic") {
    return undefined;
  }

  if (normalizeCurrencyDisplay(from) === normalizeCurrencyDisplay(to)) {
    return undefined;
  }

  return `Changed from ${formatCellDiffValue(from)} to ${formatCellDiffValue(to)}`;
}

function budgetMonthHeadClass(
  monthIndex: number,
  highlightNextMonth = false,
  showNextMonthNudge = false,
): string {
  const isCurrent = isBudgetCurrentMonth(monthIndex);
  const isNextMonth = isBudgetNextMonth(monthIndex);
  const isNudgeColumn = isBudgetNudgeColumn(monthIndex, showNextMonthNudge);

  return cn(
    BUDGET_HEAD_BASE,
    budgetColumnWidthClass(monthIndex, showNextMonthNudge),
    HEAD_ROW_BORDER,
    isNudgeColumn && "overflow-visible",
    showNextMonthNudge && BUDGET_MONTH_HEADER_WITH_NUDGE_CLASS,
    isBudgetMonthLocked(monthIndex) && "bg-slate-100 text-slate-400",
    !isBudgetMonthLocked(monthIndex) &&
      !isCurrent &&
      !highlightNextMonth &&
      "bg-white text-slate-600",
    highlightNextMonth &&
      isNextMonth &&
      "next-month-column-nudge bg-amber-50/70 text-amber-900",
    isCurrent &&
      !highlightNextMonth &&
      "border-r-0 border-b-2 border-brand-500 bg-brand-50 font-semibold text-brand-700",
    isCurrent &&
      highlightNextMonth &&
      "border-r-0 border-b-2 border-brand-500 bg-brand-50/80 font-semibold text-brand-700",
  );
}

function budgetMonthTdClass(
  visual: BudgetMonthVisual,
  monthIndex: number,
  goalLocked = false,
  showNextMonthNudge = false,
): string {
  const isCurrent = isBudgetCurrentMonth(monthIndex);

  if (goalLocked) {
    return cn(
      BUDGET_CELL_BASE,
      budgetColumnWidthClass(monthIndex, showNextMonthNudge),
      ROW_BORDER,
      "bg-slate-100",
    );
  }

  return cn(
    BUDGET_CELL_BASE,
    budgetColumnWidthClass(monthIndex, showNextMonthNudge),
    ROW_BORDER,
    visual === "locked" && "bg-slate-100",
    isCurrent && visual !== "locked" && "border-r-0 bg-brand-50/40",
    visual === "edited" &&
      "[&_input]:font-medium [&_input]:text-brand-600 [&_input]:not-italic",
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
    "bg-white not-italic placeholder:text-slate-400",
    // Match budget/constraint edited styling (blue = user changed).
    visual === "edited"
      ? "font-medium text-brand-600"
      : "text-slate-900",
  );
}

/** Goal metric starts empty — selecting one is a session change (blue). */
function getGoalMetricVisualState(
  state: GoalsRowState,
): "historic" | "edited" {
  return state.goalMetric ? "edited" : "historic";
}

function goalMetricTriggerClass(state: GoalsRowState): string {
  const visual = getGoalMetricVisualState(state);

  return cn(
    METRIC_SELECT_TRIGGER_CLASS,
    "w-full min-w-0",
    visual === "edited" && "font-medium text-brand-600",
  );
}

function budgetInputVisualClass(
  state: GoalsRowState,
  monthIndex: number,
  isAggregateRow = false,
): string {
  const value = state.monthlyBudgets[monthIndex]?.trim() ?? "";
  if (isBudgetFutureMonth(monthIndex) && !value) {
    return cn(
      budgetCellInputClass,
      "bg-white text-slate-700 placeholder:text-slate-300",
      isAggregateRow && PARENT_BUDGET_VALUE_CLASS,
    );
  }

  const visual = getBudgetMonthVisualState(state, monthIndex);

  return cn(
    budgetCellInputClass,
    visual === "prefilled" &&
      "bg-slate-50 text-slate-700 italic placeholder:text-slate-300",
    visual === "edited" && "bg-white font-medium text-brand-600",
    isAggregateRow && visual !== "edited" && PARENT_BUDGET_VALUE_CLASS,
    isAggregateRow && visual === "edited" && "font-semibold",
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
  const optionalStepsHintDismissed = useSetupSessionStore(
    (state) => state.goalsOptionalStepsHintDismissed,
  );
  const setOptionalStepsHintDismissed = useSetupSessionStore(
    (state) => state.setGoalsOptionalStepsHintDismissed,
  );
  const showToggleHint = !optionalStepsHintDismissed;

  const dismissToggleHint = useCallback(() => {
    setOptionalStepsHintDismissed(true);
  }, [setOptionalStepsHintDismissed]);

  useEffect(() => {
    if (!showToggleHint) return;

    const timer = window.setTimeout(dismissToggleHint, 8_000);
    return () => window.clearTimeout(timer);
  }, [showToggleHint, dismissToggleHint]);

  const toggleLabelClass = showToggleHint ? "toggle-label-shimmer" : "";

  const scopeMinWidth = isRuleBased
    ? SCOPE_COLUMN_RULE_BASED_MIN_WIDTH
    : SCOPE_COLUMN_MIN_WIDTH;
  const scopeDefaultWidth = isRuleBased
    ? SCOPE_COLUMN_RULE_BASED_DEFAULT_WIDTH
    : SCOPE_COLUMN_DEFAULT_WIDTH;
  const rowState = useSetupSessionStore((state) => state.goalsRowState);
  const missingGoalHighlightRowIds = useSetupSessionStore(
    (state) => state.missingGoalHighlightRowIds,
  );
  const hasMissingGoalHighlight = missingGoalHighlightRowIds.length > 0;
  const setRowState = useSetupSessionStore((state) => state.setGoalsRowState);
  const historicHintDismissed = useSetupSessionStore(
    (state) => state.goalsHistoricHintDismissed,
  );
  const setHistoricHintDismissed = useSetupSessionStore(
    (state) => state.setGoalsHistoricHintDismissed,
  );
  const showSetupToast = useSetupSessionStore((state) => state.showSetupToast);
  const ruleBasedNoticeDismissed = useSetupSessionStore(
    (state) => state.goalsRuleBasedNoticeDismissed,
  );
  const setRuleBasedNoticeDismissed = useSetupSessionStore(
    (state) => state.setGoalsRuleBasedNoticeDismissed,
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

  const nextMonthIndex = useMemo(() => getNextBudgetMonthIndex(), []);

  // At least one row has a goal → unlock Target / Last 30 / Budget columns.
  const hasAnyGoalSelected = useMemo(
    () =>
      GOALS_GOAL_EDITABLE_ROWS.some((row) =>
        Boolean(rowState[row.id]?.goalMetric),
      ),
    [rowState],
  );
  const showGoalDetailColumns = hasAnyGoalSelected;
  const showBudgetColumns = !isRuleBased && hasAnyGoalSelected;

  // After the first goal is set, toast the prefill tip once from the bottom.
  useEffect(() => {
    if (!hasAnyGoalSelected || historicHintDismissed || isRuleBased) {
      return;
    }

    // Mark dismissed first so React Strict Mode cannot fire the toast twice.
    setHistoricHintDismissed(true);
    showSetupToast(HISTORIC_PREFILL_TOAST);
  }, [
    hasAnyGoalSelected,
    historicHintDismissed,
    isRuleBased,
    showSetupToast,
    setHistoricHintDismissed,
  ]);

  const hasUnfilledNextMonthBudget = useMemo(() => {
    if (!showBudgetColumns || nextMonthIndex === null) return false;
    if (!visibleMonthIndices.includes(nextMonthIndex)) return false;

    return GOALS_GOAL_EDITABLE_ROWS.some((row) => {
      const state = rowState[row.id];
      return state && rowNeedsNextMonthBudget(state, nextMonthIndex);
    });
  }, [
    showBudgetColumns,
    nextMonthIndex,
    rowState,
    visibleMonthIndices,
  ]);

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
    const goalSectionWidth =
      scopeColumnWidth + getGoalSectionWidthPx(showGoalDetailColumns);

    if (!showBudgetColumns) {
      return goalSectionWidth;
    }

    const nudgeColumnExtraWidth =
      hasUnfilledNextMonthBudget &&
      nextMonthIndex !== null &&
      visibleMonthIndices.includes(nextMonthIndex)
        ? BUDGET_NUDGE_MONTH_COL_WIDTH_PX - BUDGET_MONTH_COL_WIDTH_PX
        : 0;

    return (
      goalSectionWidth +
      visibleMonthIndices.length * BUDGET_MONTH_COL_WIDTH_PX +
      nudgeColumnExtraWidth +
      FY_COLUMN_WIDTH_PX
    );
  }, [
    scopeColumnWidth,
    visibleMonthIndices,
    showGoalDetailColumns,
    showBudgetColumns,
    hasUnfilledNextMonthBudget,
    nextMonthIndex,
  ]);

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
    setRowState((current) => {
      const row = current[rowId];
      if (!row?.goalMetric) return current;

      const isRoasTarget = isRoasGoalMetric(row.goalMetric);
      const nextRow: GoalsRowState = {
        ...row,
        goalValue: value,
        // Mark edited while typing so blue styling shows immediately.
        editedGoalValue: true,
      };
      nextRow.editedGoalValue = !goalMatchesHistoric(nextRow, isRoasTarget);

      return {
        ...current,
        [rowId]: nextRow,
      };
    });
  };

  const updateGoalMetric = (rowId: string, value: string) => {
    const previous = rowState[rowId]?.goalMetric ?? null;
    const nextMetric = value as GoalType;

    setRowState((current) => ({
      ...current,
      [rowId]: {
        ...current[rowId],
        goalMetric: nextMetric,
      },
    }));

    if (previous !== nextMetric) {
      recordGoalsGoalMetricChange(rowId, previous, nextMetric);
    }
  };

  const applyGoalToAllRows = (value: string) => {
    const nextMetric =
      value === BULK_CLEAR_GOAL_VALUE ? null : (value as GoalType);
    const previousByRow = GOALS_GOAL_EDITABLE_ROWS.map((row) => ({
      rowId: row.id,
      previous: rowState[row.id]?.goalMetric ?? null,
    }));

    setRowState((current) => {
      const next = { ...current };

      for (const row of GOALS_GOAL_EDITABLE_ROWS) {
        if (!next[row.id]) continue;
        next[row.id] = {
          ...next[row.id],
          goalMetric: nextMetric,
        };
      }

      return next;
    });

    for (const { rowId, previous } of previousByRow) {
      if (previous !== nextMetric) {
        recordGoalsGoalMetricChange(rowId, previous, nextMetric);
      }
    }
  };

  const formatGoalValue = (rowId: string) => {
    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const isRoasTarget = row.goalMetric
        ? isRoasGoalMetric(row.goalMetric)
        : true;
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
      if (!row?.goalMetric) return current;

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
      if (!row?.goalMetric) return current;

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
          historicOrDefault,
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

  const hasMissingGoals = useMemo(
    () =>
      GOALS_GOAL_EDITABLE_ROWS.some((row) => !rowState[row.id]?.goalMetric),
    [rowState],
  );

  const bulkGoalMetric = useMemo(
    () => getBulkGoalMetric(rowState),
    [rowState],
  );

  return (
    <div className="flex flex-col gap-3 py-4">
      {isRuleBased && !ruleBasedNoticeDismissed && (
        <ImpactBanner
          title="Rule-based — goals only"
          onDismiss={() => setRuleBasedNoticeDismissed(true)}
        >
          {RULE_BASED_OPTIMIZER_NOTICE}
        </ImpactBanner>
      )}

      <div className="flex flex-col gap-3">
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

          <div className="flex flex-wrap items-center gap-4">
            {!isRuleBased && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <Switch
                  checked={includeSeasonality}
                  onCheckedChange={(checked) => {
                    dismissToggleHint();
                    setIncludeSeasonality(checked === true);
                  }}
                />
                <span className={toggleLabelClass}>Seasonality</span>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Switch
                checked={includeConstraints}
                onCheckedChange={(checked) => {
                  dismissToggleHint();
                  setIncludeConstraints(checked === true);
                }}
              />
              <span className={toggleLabelClass}>Constraints</span>
            </label>
          </div>
        </div>

        {!isRuleBased && hasMissingGoals ? (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Info className="size-3.5 text-amber-600" aria-hidden />
            </span>
            Goals must be selected to add or edit budgets.
          </p>
        ) : null}

      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div
          ref={tableScrollRef}
          className={cn(showBudgetColumns && "overflow-x-auto")}
        >
          <table
            className="w-full table-fixed overflow-visible border-separate border-spacing-0 text-sm"
            style={{ minWidth: tableMinWidth }}
          >
          <colgroup>
            <col style={{ width: scopeColumnWidth }} />
            <col style={{ width: METRIC_COL_WIDTH_PX }} />
            {showGoalDetailColumns ? (
              <>
                <col style={{ width: TARGET_COL_WIDTH_PX }} />
                <col style={{ width: LAST_30_COL_WIDTH_PX }} />
              </>
            ) : null}
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-600">
              <ScopeColumnHeader
                width={scopeColumnWidth}
                minWidth={scopeMinWidth}
                onResizeStart={onScopeResizeStart}
              />
              <th
                colSpan={showGoalDetailColumns ? 3 : 1}
                style={stickyColumnStyle(
                  goalStickyOffsets.goalSection,
                  getGoalSectionWidthPx(showGoalDetailColumns),
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
              {showBudgetColumns && (
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
                className={cn(
                  METRIC_HEAD,
                  HEAD_ROW_BORDER,
                  STICKY_GOAL_HEAD,
                  "overflow-visible",
                  !showGoalDetailColumns && STICKY_GOAL_EDGE,
                  hasMissingGoalHighlight && MISSING_GOAL_HIGHLIGHT_CLASS,
                )}
              >
                <div className="flex flex-col gap-1.5">
                  <InfoLabel label="Metric to optimize" />
                  <SetupInlineSelect
                    hideLabel
                    label="Apply goal to all rows"
                    value={bulkGoalMetric}
                    options={BULK_GOAL_METRIC_SELECT_OPTIONS}
                    placeholder="Apply to all"
                    menuMinWidth={GOAL_METRIC_MENU_MIN_WIDTH_PX}
                    onValueChange={applyGoalToAllRows}
                    triggerClassName={BULK_METRIC_SELECT_TRIGGER_CLASS}
                  />
                </div>
              </th>
              {showGoalDetailColumns ? (
                <>
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
                </>
              ) : null}
              {showBudgetColumns &&
                visibleMonthIndices.map((monthIndex) => {
                  const isCurrent = isBudgetCurrentMonth(monthIndex);
                  const isNextMonth = isBudgetNextMonth(monthIndex);
                  const highlightNextMonth =
                    hasUnfilledNextMonthBudget && isNextMonth;

                  return (
                    <th
                      key={BUDGET_MONTHS[monthIndex]}
                      className={budgetMonthHeadClass(
                        monthIndex,
                        highlightNextMonth,
                        hasUnfilledNextMonthBudget,
                      )}
                      title={isCurrent ? "Current month" : undefined}
                      aria-current={isCurrent ? "date" : undefined}
                    >
                      {hasUnfilledNextMonthBudget ? (
                        <div className="flex h-full flex-col justify-between gap-1">
                          <div className="flex flex-1 items-center justify-end">
                            <span className="inline-flex items-center justify-end gap-1">
                              {isCurrent ? (
                                <span
                                  className="size-1.5 shrink-0 rounded-full bg-brand-500"
                                  aria-hidden
                                />
                              ) : highlightNextMonth ? (
                                <span
                                  className="size-1.5 shrink-0 rounded-full bg-amber-500"
                                  aria-hidden
                                />
                              ) : null}
                              {BUDGET_MONTHS[monthIndex]}
                            </span>
                          </div>
                          {highlightNextMonth ? (
                            <span
                              className={cn(
                                BUDGET_MONTH_NUDGE_FOOTER_CLASS,
                                "whitespace-normal",
                              )}
                            >
                              Set {BUDGET_MONTHS[monthIndex]} before month-end
                            </span>
                          ) : (
                            <span
                              className={BUDGET_MONTH_NUDGE_FOOTER_CLASS}
                              aria-hidden
                            />
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex w-full items-center justify-end gap-1">
                          {isCurrent ? (
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-brand-500"
                              aria-hidden
                            />
                          ) : null}
                          {BUDGET_MONTHS[monthIndex]}
                        </span>
                      )}
                    </th>
                  );
                })}
              {showBudgetColumns && (
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
              const isParent = row.id === ENTIRE_BUSINESS_SCOPE_ID;
              const editable = rowState[row.id];
              const fyTotal = fyTotals[row.id] ?? 0;
              const canEditGoal = !isParent;
              const isRoasTarget = editable?.goalMetric
                ? isRoasGoalMetric(editable.goalMetric)
                : true;
              const canEditBudget = isParent
                ? showBudgetColumns
                : Boolean(editable?.goalMetric);
              const isMissingGoalHighlighted =
                canEditGoal &&
                missingGoalHighlightRowIds.includes(row.id);

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
                      !showGoalDetailColumns && STICKY_GOAL_EDGE,
                      !canEditGoal && "bg-slate-100 group-hover:bg-slate-100",
                      isMissingGoalHighlighted && MISSING_GOAL_HIGHLIGHT_CLASS,
                    )}
                  >
                    {editable && canEditGoal ? (
                      <div className="min-w-0">
                        <ChangedCellTooltip
                          visual={getGoalMetricVisualState(editable)}
                          {...getGoalsCellDiff(
                            row.id,
                            "goalMetric",
                            "None",
                            editable.goalMetric
                              ? getGoalTypeLabel(editable.goalMetric)
                              : "None",
                          )}
                        >
                          <SetupInlineSelect
                            hideLabel
                            label={`Metric to optimize for ${row.name}`}
                            value={editable.goalMetric}
                            options={GOAL_METRIC_SELECT_OPTIONS}
                            placeholder="Select goal"
                            menuMinWidth={GOAL_METRIC_MENU_MIN_WIDTH_PX}
                            onValueChange={(value) =>
                              updateGoalMetric(row.id, value)
                            }
                            triggerClassName={goalMetricTriggerClass(editable)}
                          />
                        </ChangedCellTooltip>
                      </div>
                    ) : null}
                  </td>
                  {showGoalDetailColumns ? (
                    <>
                      <td
                        style={stickyColumnStyle(
                          goalStickyOffsets.target,
                          TARGET_COL_WIDTH_PX,
                        )}
                        className={cn(
                          TARGET_CELL,
                          STICKY_GOAL_CELL,
                          canEditGoal && canEditBudget
                            ? "bg-white group-hover:bg-white"
                            : "bg-slate-100 group-hover:bg-slate-100",
                        )}
                      >
                        {editable && canEditGoal && canEditBudget ? (
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
                              onKeyDown={handleGoalsInputKeyDown}
                              onBlur={() => formatGoalValue(row.id)}
                              aria-label={`Target value for ${row.name}`}
                              className={goalInputVisualClass(
                                editable,
                                isRoasTarget,
                              )}
                            />
                          </ChangedCellTooltip>
                        ) : editable && canEditGoal ? (
                          <span
                            className="block h-8 px-1.5 py-1.5"
                            title={BUDGET_GOAL_REQUIRED_HINT}
                            aria-label={`Target value for ${row.name} (select a goal first)`}
                          />
                        ) : null}
                      </td>
                      <td
                        style={stickyColumnStyle(
                          goalStickyOffsets.last30,
                          LAST_30_COL_WIDTH_PX,
                        )}
                        className={cn(
                          LAST_30_CELL,
                          STICKY_GOAL_CELL,
                          STICKY_GOAL_EDGE,
                          canEditGoal && canEditBudget
                            ? "bg-white group-hover:bg-slate-50"
                            : "bg-slate-100 group-hover:bg-slate-100",
                        )}
                      >
                        <span className="block px-2 py-1.5 tabular-nums text-slate-700">
                          {canEditGoal && canEditBudget ? row.last30Days : ""}
                        </span>
                      </td>
                    </>
                  ) : null}
                  {showBudgetColumns &&
                    visibleMonthIndices.map((monthIndex) => {
                      // No goal on this row → keep month cells empty (headers may still show).
                      if (!canEditBudget) {
                        return (
                          <td
                            key={`${row.id}-${monthIndex}`}
                            className={budgetMonthTdClass(
                              "locked",
                              monthIndex,
                              true,
                              hasUnfilledNextMonthBudget,
                            )}
                            title={BUDGET_GOAL_REQUIRED_HINT}
                            aria-label={`${BUDGET_MONTHS[monthIndex]} budget for ${row.name} (select a goal first)`}
                          />
                        );
                      }

                      const monthVisual = editable
                        ? getBudgetMonthVisualState(editable, monthIndex)
                        : "locked";
                      const budgetValue =
                        editable?.monthlyBudgets[monthIndex] ?? "";
                      const budgetDiff = editable
                        ? getBudgetCellDiff(row.id, editable, monthIndex)
                        : null;
                      const budgetTooltipVisual = editable
                        ? getBudgetCellTooltipVisual(editable, monthIndex)
                        : "historic";
                      const budgetHoverTitle = budgetDiff
                        ? buildBudgetHoverTitle(
                            budgetTooltipVisual,
                            budgetDiff.from,
                            budgetDiff.to,
                          )
                        : undefined;

                      return (
                        <td
                          key={`${row.id}-${monthIndex}`}
                          className={budgetMonthTdClass(
                            monthVisual,
                            monthIndex,
                            false,
                            hasUnfilledNextMonthBudget,
                          )}
                        >
                          {editable && monthVisual === "locked" ? (
                            <span
                              className={cn(
                                "block px-2 py-1.5 tabular-nums text-slate-500",
                                isParent && PARENT_BUDGET_VALUE_CLASS,
                              )}
                              title={BUDGET_LOCKED_HINT}
                              aria-label={`${BUDGET_MONTHS[monthIndex]} budget for ${row.name} (locked)`}
                            >
                              {budgetValue || "—"}
                            </span>
                          ) : editable && budgetDiff ? (
                            <ChangedCellTooltip
                              visual={budgetTooltipVisual}
                              from={budgetDiff.from}
                              to={budgetDiff.to}
                            >
                              <Input
                                value={budgetValue}
                                title={budgetHoverTitle}
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
                                onKeyDown={handleGoalsInputKeyDown}
                                onBlur={() =>
                                  formatMonthlyBudget(row.id, monthIndex)
                                }
                                aria-label={`${BUDGET_MONTHS[monthIndex]} budget for ${row.name}`}
                                className={budgetInputVisualClass(
                                  editable,
                                  monthIndex,
                                  isParent,
                                )}
                              />
                            </ChangedCellTooltip>
                          ) : null}
                        </td>
                      );
                    })}
                  {showBudgetColumns && (
                    <td
                      className={cn(
                        BUDGET_CELL,
                        "border-r-0 px-2 py-2.5 tabular-nums text-slate-900",
                        ROW_BORDER,
                        STICKY_FY_CELL,
                        isParent && PARENT_BUDGET_VALUE_CLASS,
                        !canEditBudget &&
                          !isParent &&
                          "bg-slate-100 text-transparent group-hover:bg-slate-100",
                      )}
                    >
                      {canEditBudget ? formatCurrency(fyTotal) || "—" : ""}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
