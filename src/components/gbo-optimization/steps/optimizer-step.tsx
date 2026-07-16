"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Settings } from "lucide-react";

import {
  ClearDraftStrategiesButton,
  DayPartingTile,
  HourlyBidderPanel,
  OPTIMIZER_ACTION_ICON_CLASS,
} from "@/components/gbo-optimization/hourly-bidder-panel";
import { InfoLabel } from "@/components/gbo-optimization/info-label";
import {
  getAggregateOptimizerMode,
  OptimizerModeChip,
  type AggregatedOptimizerMode,
  type OptimizerColumnMode,
} from "@/components/gbo-optimization/optimizer-mode-chip";
import { RuleBasedStrategyPanel } from "@/components/gbo-optimization/rule-based-strategy-panel";
import { RuleBasedStrategyStack } from "@/components/gbo-optimization/rule-based-strategy-stack";
import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import {
  NestedTaxonomyScopeCell,
  NestedTaxonomyScopeHeader,
  useNestedTaxonomyScopeRows,
} from "@/components/gbo-optimization/taxonomy-scope-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_RULE_BASED_BID_STRATEGIES,
  DEFAULT_RULE_BASED_BUDGET_STRATEGIES,
  GOAL_TYPE_OPTIONS,
  OPTIMIZER_SCOPE_ROWS,
  RULE_BASED_ITEM_MODE_TOAST,
  RULE_BASED_ITEM_SKIP_CUE,
  type GoalType,
  type OptimizerScopeRow,
  type OptimizerType,
} from "@/lib/gbo-optimization/setup-data";
import {
  recordGoalsGoalMetricChange,
  recordOptimizerDayPartingChange,
  recordOptimizerModeChange,
  recordOptimizerRuleStrategiesChange,
  resolveEffectiveGoalsState,
  useSetupSessionStore,
  type GoalsRowState,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const DAY_PARTING_TILE_LABEL = "Hourly Bidder";

/** Same options + styling as Goals & Budgets “Metrics to optimize” column. */
const GOAL_METRIC_SELECT_OPTIONS = GOAL_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));
const GOAL_METRIC_MENU_MIN_WIDTH_PX = 220;
const METRIC_SELECT_TRIGGER_CLASS =
  "h-auto w-auto gap-1 border-0 bg-transparent p-0 text-sm font-medium text-slate-700 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 hover:bg-transparent";

function goalMetricTriggerClass(hasMetric: boolean): string {
  return cn(
    METRIC_SELECT_TRIGGER_CLASS,
    "w-full min-w-0",
    hasMetric && "font-medium text-blue-600",
  );
}

/** Stored when a row has a strategy but the user has not saved panel edits yet. */
const DEFAULT_DAY_PARTING_STRATEGY = "Hourly Bidder";

/**
 * Wider than the shared taxonomy default so the rule-based skip cue
 * wraps to two lines (not three) under the brand name.
 */
const OPTIMIZER_SCOPE_COL_WIDTH = 320;
const GOALS_COL_WIDTH = 220;
const MODE_COL_WIDTH = 160;
const BUDGET_OPT_COL_WIDTH = 220;
const BID_OPT_COL_WIDTH = 240;
/** Must fit "Hourly Bidder" tile + outlined + / refresh with cell padding. */
const DAY_PARTING_COL_WIDTH = 280;
const TARGETING_COL_WIDTH = 88;

/** Table min-width: Mode always; Budget + Bid when expanded. */
function getOptimizerTableMinWidth(bidBudgetExpanded: boolean): number {
  const bidBudgetWidth = bidBudgetExpanded
    ? BUDGET_OPT_COL_WIDTH + BID_OPT_COL_WIDTH
    : 0;

  return (
    OPTIMIZER_SCOPE_COL_WIDTH +
    GOALS_COL_WIDTH +
    MODE_COL_WIDTH +
    bidBudgetWidth +
    DAY_PARTING_COL_WIDTH +
    TARGETING_COL_WIDTH
  );
}

/** Shared row layout: primary control left, action icons inside the cell on the right. */
const OPTIMIZER_CELL_ACTIONS_ROW =
  "flex w-full min-w-0 items-center justify-between gap-2";

/** Row bottom border must be on <td>/<th> — tr borders are ignored with border-separate. */
const OPTIMIZER_ROW_BORDER = "border-b border-slate-100";

type RowOptimizerModes = {
  budget: OptimizerColumnMode | null;
  bid: OptimizerColumnMode | null;
};

/** Map General-page optimizer to per-row Budget / Bid defaults. */
function columnModesForOptimizerType(
  optimizerType: OptimizerType,
): RowOptimizerModes {
  if (optimizerType === "rule-based") {
    return { budget: "rule-based", bid: "rule-based" };
  }
  if (optimizerType === "custom") {
    // Empty until the user picks a mode per brand.
    return { budget: null, bid: null };
  }
  return { budget: "ally", bid: "ally" };
}

function createRowModesForOptimizer(
  optimizerType: OptimizerType,
): Record<string, RowOptimizerModes> {
  const columnPair = columnModesForOptimizerType(optimizerType);
  const initial: Record<string, RowOptimizerModes> = {};
  for (const row of OPTIMIZER_SCOPE_ROWS) {
    if (row.allyMode) {
      initial[row.id] = { ...columnPair };
    }
  }
  return initial;
}

/** Ally-mode brands start with a day-parting strategy already set (prototype). */
function createInitialDayPartingLabels(): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const row of OPTIMIZER_SCOPE_ROWS) {
    if (row.allyMode) {
      initial[row.id] = DEFAULT_DAY_PARTING_STRATEGY;
    }
  }
  return initial;
}

function rowHasRuleBasedMode(modes: RowOptimizerModes): boolean {
  return modes.budget === "rule-based" || modes.bid === "rule-based";
}

/** Mode column: empty when both unset; Custom when they differ or one is unset. */
function getModeColumnValue(
  budget: OptimizerColumnMode | null,
  bid: OptimizerColumnMode | null,
): AggregatedOptimizerMode | null {
  if (budget === null && bid === null) {
    return null;
  }
  if (budget === null || bid === null) {
    return "custom";
  }
  return getAggregateOptimizerMode(budget, bid);
}

function OptimizerCell({
  row,
  column,
  dayPartingLabel,
  onOpenDayParting,
  onResetDayParting,
  onAddDayParting,
  budgetMode,
  bidMode,
  onBudgetModeChange,
  onBidModeChange,
  onResetBudgetStrategies,
  onResetBidStrategies,
  onOpenRuleBasedStrategies,
  defaultColumnMode = "ally",
}: {
  row: OptimizerScopeRow;
  column: "mode" | "budget" | "bid" | "dayParting" | "targeting";
  dayPartingLabel?: string;
  onOpenDayParting?: () => void;
  onResetDayParting?: () => void;
  /** Opens the "add day parting strategy" side panel from the Day Parting column. */
  onAddDayParting?: () => void;
  budgetMode?: OptimizerColumnMode | null;
  bidMode?: OptimizerColumnMode | null;
  onBudgetModeChange?: (mode: OptimizerColumnMode) => void;
  onBidModeChange?: (mode: OptimizerColumnMode) => void;
  onResetBudgetStrategies?: () => void;
  onResetBidStrategies?: () => void;
  /** Opens the Rule Based strategy side panel from the stacked rules chip. */
  onOpenRuleBasedStrategies?: () => void;
  /** Portfolio default used when clearing draft strategies. */
  defaultColumnMode?: OptimizerColumnMode | null;
}) {
  // Targeting: always show add (+) — including rows without Ally mode.
  if (column === "targeting") {
    return (
      <div className={OPTIMIZER_CELL_ACTIONS_ROW}>
        <span className="min-w-0" aria-hidden />
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={`Add targeting for ${row.name}`}
          title="Add targeting"
          className={OPTIMIZER_ACTION_ICON_CLASS}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    );
  }

  if (!row.allyMode) {
    return null;
  }

  if (column === "dayParting") {
    return (
      <DayPartingTile
        scopeName={row.name}
        // Tile always shows the fixed label — panel edits update cell highlight only.
        label={DAY_PARTING_TILE_LABEL}
        hasStrategy={Boolean(dayPartingLabel)}
        onOpen={onOpenDayParting ?? (() => {})}
        onAdd={onAddDayParting ?? (() => {})}
        onReset={onResetDayParting ?? (() => {})}
      />
    );
  }

  // Mode = read-only aggregate of Budget + Bid (no chevron / no dropdown).
  if (column === "mode") {
    const aggregate = getModeColumnValue(budgetMode ?? null, bidMode ?? null);
    return <OptimizerModeChip mode={aggregate} selectable={false} />;
  }

  if (column === "bid") {
    const currentBid = bidMode ?? null;
    const isRuleBased = currentBid === "rule-based";
    return (
      <div className="flex w-full min-w-0 flex-col">
        {/* Mode chip + actions stay on one row; rules stack hangs under the chip */}
        <div className={OPTIMIZER_CELL_ACTIONS_ROW}>
          <div className="min-w-0 shrink">
            <OptimizerModeChip
              mode={currentBid}
              selectable
              showBoost={currentBid === "ally"}
              onChange={onBidModeChange}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={`Add bid optimization strategy for ${row.name}`}
              title="Add bid optimization strategy"
              className={OPTIMIZER_ACTION_ICON_CLASS}
            >
              <Plus className="size-3.5" />
            </Button>
            <ClearDraftStrategiesButton
              scopeName={row.name}
              onConfirm={onResetBidStrategies ?? (() => {})}
              description={
                <>
                  You are about to clear draft bid strategies for{" "}
                  <span className="font-semibold text-slate-800">
                    {row.name}
                  </span>
                  . This resets Bid Optimization
                  {defaultColumnMode === "rule-based"
                    ? " to Rule Based"
                    : defaultColumnMode === null
                      ? ""
                      : " to Ally"}{" "}
                  and cannot be undone.
                </>
              }
            />
          </div>
        </div>
        {isRuleBased ? (
          <RuleBasedStrategyStack
            rules={DEFAULT_RULE_BASED_BID_STRATEGIES}
            onOpen={onOpenRuleBasedStrategies}
          />
        ) : null}
      </div>
    );
  }

  // Budget Optimization — mode chip left; outlined + / refresh right-aligned
  // (Changed state is shown on the <td>, not on the chip.)
  const currentBudget = budgetMode ?? null;
  const isRuleBasedBudget = currentBudget === "rule-based";
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className={OPTIMIZER_CELL_ACTIONS_ROW}>
        <div className="min-w-0 shrink">
          <OptimizerModeChip
            mode={currentBudget}
            selectable
            onChange={onBudgetModeChange}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label={`Add budget optimization strategy for ${row.name}`}
            title="Add budget optimization strategy"
            className={OPTIMIZER_ACTION_ICON_CLASS}
          >
            <Plus className="size-3.5" />
          </Button>
          <ClearDraftStrategiesButton
            scopeName={row.name}
            onConfirm={onResetBudgetStrategies ?? (() => {})}
            description={
              <>
                You are about to clear draft budget strategies for{" "}
                <span className="font-semibold text-slate-800">{row.name}</span>
                . This resets Budget Optimization
                {defaultColumnMode === "rule-based"
                  ? " to Rule Based"
                  : defaultColumnMode === null
                    ? ""
                    : " to Ally"}{" "}
                and cannot be undone.
              </>
            }
          />
        </div>
      </div>
      {isRuleBasedBudget ? (
        <RuleBasedStrategyStack
          rules={DEFAULT_RULE_BASED_BUDGET_STRATEGIES}
          onOpen={onOpenRuleBasedStrategies}
        />
      ) : null}
    </div>
  );
}

export function OptimizerStep() {
  const { optimizerType } = useSetupContext();
  // Ally AI: start with Budget/Bid collapsed into Mode; Expand reveals them.
  const isAllyAi = optimizerType === "ally-ai";
  const [bidBudgetExpanded, setBidBudgetExpanded] = useState(!isAllyAi);
  const portfolioColumnDefaults = columnModesForOptimizerType(optimizerType);
  const defaultColumnMode = portfolioColumnDefaults.budget;

  // Per-row Budget / Bid modes — seeded from General optimizer choice.
  const [rowModes, setRowModes] = useState(() =>
    createRowModesForOptimizer(optimizerType),
  );
  // Snapshot of starting modes — used for blue “edited cell” styling.
  const [baselineRowModes, setBaselineRowModes] = useState(() =>
    createRowModesForOptimizer(optimizerType),
  );
  // Mirror so click handlers can read the previous value without nested setState.
  const rowModesRef = useRef(rowModes);
  rowModesRef.current = rowModes;

  useEffect(() => {
    // Switching optimizer on General resets expand/collapse + row modes.
    setBidBudgetExpanded(optimizerType !== "ally-ai");
    const nextModes = createRowModesForOptimizer(optimizerType);
    setRowModes(nextModes);
    setBaselineRowModes(nextModes);
    rowModesRef.current = nextModes;
  }, [optimizerType]);

  const tableMinWidth = getOptimizerTableMinWidth(bidBudgetExpanded);

  const showSetupToast = useSetupSessionStore((state) => state.showSetupToast);
  // Same target values / goal metrics users set on Goals & Budgets.
  const goalsRowState = useSetupSessionStore((state) => state.goalsRowState);
  const setGoalsRowState = useSetupSessionStore(
    (state) => state.setGoalsRowState,
  );

  const updateGoalMetric = (
    rowId: string,
    groupId: string | null | undefined,
    value: string,
  ) => {
    const previous =
      resolveEffectiveGoalsState(rowId, groupId, goalsRowState)?.goalMetric ??
      null;
    const nextMetric = value as GoalType;

    setGoalsRowState((current) => {
      const row = current[rowId];
      if (!row) return current;
      const nextRow: GoalsRowState = {
        ...row,
        goalMetric: nextMetric,
      };
      return { ...current, [rowId]: nextRow };
    });

    if (previous !== nextMetric) {
      recordGoalsGoalMetricChange(rowId, previous, nextMetric);
    }
  };

  // Which brand row the side panel is editing/adding (null = closed).
  const [activeDayPartingRowId, setActiveDayPartingRowId] = useState<
    string | null
  >(null);
  // edit = Day Parting tile; add = Bid Optimization "+" button.
  const [dayPartingPanelMode, setDayPartingPanelMode] = useState<
    "edit" | "add"
  >("edit");
  // Tile label per row — key present means a strategy exists (value kept for panel reopen).
  const [dayPartingLabels, setDayPartingLabels] = useState(
    createInitialDayPartingLabels,
  );
  // Snapshot so Apply / Clear can mark the Day Parting cell as changed.
  const [baselineDayPartingLabels] = useState(createInitialDayPartingLabels);

  // Rule Based strategy panel — opened from the stacked rules chip.
  const [activeRulePanel, setActiveRulePanel] = useState<{
    rowId: string;
    column: "budget" | "bid";
  } | null>(null);

  const openDayPartingPanel = (rowId: string, mode: "edit" | "add") => {
    setDayPartingPanelMode(mode);
    setActiveDayPartingRowId(rowId);
  };

  /** Apply a column mode change and toast the item-level skip notice when needed. */
  const applyColumnMode = (
    rowId: string,
    column: "budget" | "bid",
    nextMode: OptimizerColumnMode,
  ) => {
    const previous = rowModesRef.current[rowId] ?? {
      ...portfolioColumnDefaults,
    };
    const previousColumnMode = previous[column];
    const nextRow: RowOptimizerModes = {
      ...previous,
      [column]: nextMode,
    };

    rowModesRef.current = {
      ...rowModesRef.current,
      [rowId]: nextRow,
    };
    setRowModes((current) => ({
      ...current,
      [rowId]: nextRow,
    }));

    if (previousColumnMode !== nextMode) {
      recordOptimizerModeChange(
        rowId,
        column,
        previousColumnMode ?? "none",
        nextMode,
      );
    }

    // First time this row gains rule-based → bottom-left toast (same pattern as other setup toasts).
    if (
      nextMode === "rule-based" &&
      previousColumnMode !== "rule-based" &&
      !rowHasRuleBasedMode(previous)
    ) {
      showSetupToast(RULE_BASED_ITEM_MODE_TOAST);
    }
  };

  const setBudgetMode = (
    rowId: string,
    mode: OptimizerColumnMode | null,
  ) => {
    if (mode === null) {
      const previous = rowModesRef.current[rowId] ?? {
        ...portfolioColumnDefaults,
      };
      const nextRow: RowOptimizerModes = { ...previous, budget: null };
      rowModesRef.current = { ...rowModesRef.current, [rowId]: nextRow };
      setRowModes((current) => ({ ...current, [rowId]: nextRow }));
      return;
    }
    applyColumnMode(rowId, "budget", mode);
  };

  const setBidMode = (rowId: string, mode: OptimizerColumnMode | null) => {
    if (mode === null) {
      const previous = rowModesRef.current[rowId] ?? {
        ...portfolioColumnDefaults,
      };
      const nextRow: RowOptimizerModes = { ...previous, bid: null };
      rowModesRef.current = { ...rowModesRef.current, [rowId]: nextRow };
      setRowModes((current) => ({ ...current, [rowId]: nextRow }));
      return;
    }
    applyColumnMode(rowId, "bid", mode);
  };

  const activeRow = OPTIMIZER_SCOPE_ROWS.find(
    (row) => row.id === activeDayPartingRowId,
  );
  const activeLabel =
    (activeDayPartingRowId && dayPartingLabels[activeDayPartingRowId]) ||
    DEFAULT_DAY_PARTING_STRATEGY;

  const activeRuleRow = OPTIMIZER_SCOPE_ROWS.find(
    (row) => row.id === activeRulePanel?.rowId,
  );

  const {
    visibleRows,
    collapsedGroupIds,
    toggleGroupCollapsed,
    sourceById,
    scopeHeaderLabel,
  } = useNestedTaxonomyScopeRows(OPTIMIZER_SCOPE_ROWS);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-4">
      {/* Chrome outside table scroll — never moves sideways with wide tables. */}
      <div className="flex shrink-0 w-full min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative w-72 shrink-0">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search"
              className="h-9 border-slate-200 pl-9 shadow-none"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-slate-600"
          >
            <Plus className="size-4" />
            Add Filters
          </Button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Switch
              checked={bidBudgetExpanded}
              onCheckedChange={(checked) =>
                setBidBudgetExpanded(checked === true)
              }
              aria-controls="optimizer-bid-budget-columns"
            />
            Show bid & budget
          </label>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Optimizer settings"
          className="shrink-0 text-slate-500 hover:text-slate-700"
        >
          <Settings className="size-4" />
        </Button>
      </div>

      {/* Horizontal (+ vertical) scroll stays inside the table only. */}
      <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: tableMinWidth }}
        >
          <colgroup>
            <col style={{ width: OPTIMIZER_SCOPE_COL_WIDTH }} />
            <col style={{ width: GOALS_COL_WIDTH }} />
            <col style={{ width: MODE_COL_WIDTH }} />
            {bidBudgetExpanded ? (
              <>
                <col style={{ width: BUDGET_OPT_COL_WIDTH }} />
                <col style={{ width: BID_OPT_COL_WIDTH }} />
              </>
            ) : null}
            <col style={{ width: DAY_PARTING_COL_WIDTH }} />
            <col style={{ width: TARGETING_COL_WIDTH }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-600">
              <NestedTaxonomyScopeHeader
                label={scopeHeaderLabel}
                width={OPTIMIZER_SCOPE_COL_WIDTH}
                sticky
                className="border-b border-slate-200"
              />
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Metrics to optimize" />
              </th>
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel
                  label="Mode"
                  tooltip="Combined bid and budget mode for this scope."
                />
              </th>
              {bidBudgetExpanded ? (
                <>
                  <th
                    id="optimizer-bid-budget-columns"
                    className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium"
                  >
                    <InfoLabel label="Budget Optimization" />
                  </th>
                  <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                    <InfoLabel label="Bid Optimization" />
                  </th>
                </>
              ) : null}
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Day Parting" />
              </th>
              <th className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Targeting" />
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((nestedRow) => {
              const sourceRow = sourceById.get(nestedRow.id) as
                | OptimizerScopeRow
                | undefined;
              const isLeaf = nestedRow.kind === "level2-child";
              const modes = rowModes[nestedRow.id] ?? {
                ...portfolioColumnDefaults,
              };
              const baseline = baselineRowModes[nestedRow.id] ?? {
                ...portfolioColumnDefaults,
              };
              const isRuleBasedItem = isLeaf && rowHasRuleBasedMode(modes);
              const budgetEdited = isLeaf && modes.budget !== baseline.budget;
              const bidEdited = isLeaf && modes.bid !== baseline.bid;
              const dayPartingEdited =
                isLeaf &&
                (dayPartingLabels[nestedRow.id] ?? null) !==
                  (baselineDayPartingLabels[nestedRow.id] ?? null);

              const goalsState = resolveEffectiveGoalsState(
                nestedRow.id,
                nestedRow.groupId,
                goalsRowState,
              );

              return (
                <tr
                  key={nestedRow.id}
                  className="group hover:bg-slate-50/50"
                >
                  <NestedTaxonomyScopeCell
                    row={nestedRow}
                    sticky
                    collapsed={collapsedGroupIds.has(nestedRow.id)}
                    onToggleCollapsed={toggleGroupCollapsed}
                    width={OPTIMIZER_SCOPE_COL_WIDTH}
                    extra={
                      isRuleBasedItem ? (
                        <span className="text-2xs font-medium leading-snug text-amber-700">
                          {RULE_BASED_ITEM_SKIP_CUE}
                        </span>
                      ) : null
                    }
                  />
                  <td
                    className={cn(
                      OPTIMIZER_ROW_BORDER,
                      "border-r border-slate-100 px-3 py-2",
                    )}
                  >
                    {isLeaf && sourceRow ? (
                      <div className="min-w-0">
                        <SetupInlineSelect
                          hideLabel
                          label={`Metrics to optimize for ${sourceRow.name}`}
                          value={goalsState?.goalMetric ?? null}
                          options={GOAL_METRIC_SELECT_OPTIONS}
                          placeholder="Select goal"
                          menuMinWidth={GOAL_METRIC_MENU_MIN_WIDTH_PX}
                          onValueChange={(value) =>
                            updateGoalMetric(
                              nestedRow.id,
                              nestedRow.groupId,
                              value,
                            )
                          }
                          triggerClassName={goalMetricTriggerClass(
                            Boolean(goalsState?.goalMetric),
                          )}
                        />
                      </div>
                    ) : null}
                  </td>
                  <td
                    className={cn(
                      OPTIMIZER_ROW_BORDER,
                      "border-r border-slate-100 px-4 py-3",
                    )}
                  >
                    {isLeaf && sourceRow ? (
                      <OptimizerCell
                        row={sourceRow}
                        column="mode"
                        budgetMode={modes.budget}
                        bidMode={modes.bid}
                      />
                    ) : null}
                  </td>
                  {bidBudgetExpanded ? (
                    <>
                      <td
                        className={cn(
                          OPTIMIZER_ROW_BORDER,
                          "overflow-hidden border-r border-slate-100 px-3 py-3",
                          // Changed mode → highlight the whole cell, not the chip.
                          budgetEdited &&
                            "bg-blue-50 ring-1 ring-inset ring-blue-500",
                        )}
                      >
                        {isLeaf && sourceRow ? (
                          <OptimizerCell
                            row={sourceRow}
                            column="budget"
                            budgetMode={modes.budget}
                            defaultColumnMode={defaultColumnMode}
                            onBudgetModeChange={(mode) =>
                              setBudgetMode(nestedRow.id, mode)
                            }
                            onResetBudgetStrategies={() => {
                              setBudgetMode(nestedRow.id, defaultColumnMode);
                              showSetupToast(
                                `Draft budget strategies cleared for ${sourceRow.name}.`,
                                { variant: "success" },
                              );
                            }}
                            onOpenRuleBasedStrategies={() =>
                              setActiveRulePanel({
                                rowId: nestedRow.id,
                                column: "budget",
                              })
                            }
                          />
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          OPTIMIZER_ROW_BORDER,
                          "overflow-hidden border-r border-slate-100 px-3 py-3",
                          bidEdited &&
                            "bg-blue-50 ring-1 ring-inset ring-blue-500",
                        )}
                      >
                        {isLeaf && sourceRow ? (
                          <OptimizerCell
                            row={sourceRow}
                            column="bid"
                            bidMode={modes.bid}
                            defaultColumnMode={defaultColumnMode}
                            onBidModeChange={(mode) =>
                              setBidMode(nestedRow.id, mode)
                            }
                            onResetBidStrategies={() => {
                              setBidMode(nestedRow.id, defaultColumnMode);
                              showSetupToast(
                                `Draft bid strategies cleared for ${sourceRow.name}.`,
                                { variant: "success" },
                              );
                            }}
                            onOpenRuleBasedStrategies={() =>
                              setActiveRulePanel({
                                rowId: nestedRow.id,
                                column: "bid",
                              })
                            }
                          />
                        ) : null}
                      </td>
                    </>
                  ) : null}
                  <td
                    className={cn(
                      OPTIMIZER_ROW_BORDER,
                      "overflow-hidden border-r border-slate-100 px-3 py-3",
                      dayPartingEdited &&
                        "bg-blue-50 ring-1 ring-inset ring-blue-500",
                    )}
                  >
                    {isLeaf && sourceRow ? (
                      <OptimizerCell
                        row={sourceRow}
                        column="dayParting"
                        dayPartingLabel={dayPartingLabels[nestedRow.id]}
                        onOpenDayParting={() =>
                          openDayPartingPanel(nestedRow.id, "edit")
                        }
                        onAddDayParting={() =>
                          openDayPartingPanel(nestedRow.id, "add")
                        }
                        onResetDayParting={() => {
                          const previousLabel =
                            dayPartingLabels[nestedRow.id] ?? "";
                          setDayPartingLabels((current) => {
                            const next = { ...current };
                            delete next[nestedRow.id];
                            return next;
                          });
                          if (previousLabel) {
                            recordOptimizerDayPartingChange(
                              nestedRow.id,
                              previousLabel,
                              "",
                            );
                          }
                        }}
                      />
                    ) : null}
                  </td>
                  <td className={cn(OPTIMIZER_ROW_BORDER, "overflow-hidden px-3 py-3")}>
                    {isLeaf && sourceRow ? (
                      <OptimizerCell row={sourceRow} column="targeting" />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Side panel: Day Parting tile (edit) or Bid Optimization "+" (add) */}
      <HourlyBidderPanel
        open={activeDayPartingRowId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDayPartingRowId(null);
          }
        }}
        mode={dayPartingPanelMode}
        scopeName={activeRow?.name ?? "Selected scope"}
        strategyLabel={activeLabel}
        onApply={(label) => {
          if (!activeDayPartingRowId) {
            return;
          }
          const previousLabel =
            dayPartingLabels[activeDayPartingRowId] ?? "";
          setDayPartingLabels((current) => ({
            ...current,
            [activeDayPartingRowId]: label,
          }));
          recordOptimizerDayPartingChange(
            activeDayPartingRowId,
            previousLabel,
            label,
          );
        }}
      />

      {/* Side panel: stacked Rule Based chip → list of rules + editor */}
      <RuleBasedStrategyPanel
        open={activeRulePanel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRulePanel(null);
          }
        }}
        scopeName={activeRuleRow?.name ?? "Selected scope"}
        rowId={activeRulePanel?.rowId ?? ""}
        column={activeRulePanel?.column ?? "bid"}
        onSave={() => {
          if (activeRulePanel) {
            const columnLabel =
              activeRulePanel.column === "budget"
                ? "Budget"
                : "Bid";
            recordOptimizerRuleStrategiesChange(
              activeRulePanel.rowId,
              activeRulePanel.column,
              "Previous rules",
              `${columnLabel} rule strategies saved`,
            );
          }
          showSetupToast(
            `Rule based strategies saved for ${activeRuleRow?.name ?? "scope"}.`,
            { variant: "success" },
          );
        }}
      />
    </div>
  );
}
