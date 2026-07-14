"use client";

import { useRef, useState } from "react";
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
  type OptimizerColumnMode,
} from "@/components/gbo-optimization/optimizer-mode-chip";
import { RuleBasedStrategyPanel } from "@/components/gbo-optimization/rule-based-strategy-panel";
import { RuleBasedStrategyStack } from "@/components/gbo-optimization/rule-based-strategy-stack";
import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import {
  NestedTaxonomyScopeCell,
  NestedTaxonomyScopeHeader,
  useNestedTaxonomyScopeRows,
} from "@/components/gbo-optimization/taxonomy-scope-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_RULE_BASED_BID_STRATEGIES,
  DEFAULT_RULE_BASED_BUDGET_STRATEGIES,
  GOAL_TYPE_OPTIONS,
  OPTIMIZER_SCOPE_ROWS,
  RULE_BASED_ITEM_MODE_TOAST,
  RULE_BASED_ITEM_SKIP_CUE,
  type GoalType,
  type OptimizerScopeRow,
} from "@/lib/gbo-optimization/setup-data";
import {
  recordGoalsGoalMetricChange,
  recordOptimizerDayPartingChange,
  recordOptimizerModeChange,
  recordOptimizerRuleStrategiesChange,
  useSetupSessionStore,
  type GoalsRowState,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const DAY_PARTING_TILE_LABEL = "Hourly Bidder";

/** Same options + styling as Goals & Budgets “Metric to optimize” column. */
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

/**
 * Goals & Budgets often stores the metric on the Level 1 parent (parent edit mode).
 * Optimizer rows are Level 2 leaves — fall back to the parent group when the leaf is empty.
 */
function resolveEffectiveGoalsState(
  leafId: string,
  groupId: string | null | undefined,
  goalsRowState: Record<string, GoalsRowState>,
): GoalsRowState | undefined {
  const leaf = goalsRowState[leafId];
  if (leaf?.goalMetric) {
    return leaf;
  }

  if (groupId) {
    const parent = goalsRowState[groupId];
    if (parent?.goalMetric) {
      return parent;
    }
  }

  return leaf ?? (groupId ? goalsRowState[groupId] : undefined);
}

/** Stored when a row has a strategy but the user has not saved panel edits yet. */
const DEFAULT_DAY_PARTING_STRATEGY = "Hourly Bidder";

/**
 * Wider than the shared taxonomy default so the rule-based skip cue
 * wraps to two lines (not three) under the brand name.
 */
const OPTIMIZER_SCOPE_COL_WIDTH = 320;
const GOALS_COL_WIDTH = 140;
const VALUE_COL_WIDTH = 96;
const BUDGET_OPT_COL_WIDTH = 220;
const BID_OPT_COL_WIDTH = 240;
/** Must fit "Hourly Bidder" tile + outlined + / refresh with cell padding. */
const DAY_PARTING_COL_WIDTH = 280;
const TARGETING_COL_WIDTH = 88;

const OPTIMIZER_TABLE_MIN_WIDTH =
  OPTIMIZER_SCOPE_COL_WIDTH +
  GOALS_COL_WIDTH +
  VALUE_COL_WIDTH +
  BUDGET_OPT_COL_WIDTH +
  BID_OPT_COL_WIDTH +
  DAY_PARTING_COL_WIDTH +
  TARGETING_COL_WIDTH;

/** Shared row layout: primary control left, action icons inside the cell on the right. */
const OPTIMIZER_CELL_ACTIONS_ROW =
  "flex w-full min-w-0 items-center justify-between gap-2";

/** Row bottom border must be on <td>/<th> — tr borders are ignored with border-separate. */
const OPTIMIZER_ROW_BORDER = "border-b border-slate-100";

/** Hide Mode column for now — keep markup so we can turn it back on later. */
const SHOW_MODE_COLUMN = false;

type RowOptimizerModes = {
  budget: OptimizerColumnMode;
  bid: OptimizerColumnMode;
};

function createInitialRowModes(): Record<string, RowOptimizerModes> {
  const initial: Record<string, RowOptimizerModes> = {};
  for (const row of OPTIMIZER_SCOPE_ROWS) {
    if (row.allyMode) {
      initial[row.id] = { budget: "ally", bid: "ally" };
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
}: {
  row: OptimizerScopeRow;
  column: "mode" | "budget" | "bid" | "dayParting" | "targeting";
  dayPartingLabel?: string;
  onOpenDayParting?: () => void;
  onResetDayParting?: () => void;
  /** Opens the "add day parting strategy" side panel from the Day Parting column. */
  onAddDayParting?: () => void;
  budgetMode?: OptimizerColumnMode;
  bidMode?: OptimizerColumnMode;
  onBudgetModeChange?: (mode: OptimizerColumnMode) => void;
  onBidModeChange?: (mode: OptimizerColumnMode) => void;
  onResetBudgetStrategies?: () => void;
  onResetBidStrategies?: () => void;
  /** Opens the Rule Based strategy side panel from the stacked rules chip. */
  onOpenRuleBasedStrategies?: () => void;
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
    const aggregate = getAggregateOptimizerMode(
      budgetMode ?? "ally",
      bidMode ?? "ally",
    );
    return <OptimizerModeChip mode={aggregate} selectable={false} />;
  }

  if (column === "bid") {
    const currentBid = bidMode ?? "ally";
    const isRuleBased = currentBid === "rule-based";
    return (
      <div className="flex w-full min-w-0 flex-col">
        {/* Mode chip + actions stay on one row; rules stack hangs under the chip */}
        <div className={OPTIMIZER_CELL_ACTIONS_ROW}>
          <div className="min-w-0 shrink">
            <OptimizerModeChip
              mode={currentBid}
              selectable
              showBoost
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
                  . This resets Bid Optimization to Ally and cannot be undone.
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
  const currentBudget = budgetMode ?? "ally";
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
                . This resets Budget Optimization to Ally and cannot be undone.
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
  // Per-row Budget / Bid modes (Mode column is derived from these).
  const [rowModes, setRowModes] = useState(createInitialRowModes);
  // Snapshot of starting modes — used for blue “edited cell” styling.
  const [baselineRowModes] = useState(createInitialRowModes);
  // Mirror so click handlers can read the previous value without nested setState.
  const rowModesRef = useRef(rowModes);
  rowModesRef.current = rowModes;

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
      budget: "ally" as const,
      bid: "ally" as const,
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
      recordOptimizerModeChange(rowId, column, previousColumnMode, nextMode);
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

  const setBudgetMode = (rowId: string, mode: OptimizerColumnMode) => {
    applyColumnMode(rowId, "budget", mode);
  };

  const setBidMode = (rowId: string, mode: OptimizerColumnMode) => {
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
    <div className="flex w-full flex-col gap-4 py-4">
      <div className="flex w-full items-center justify-between gap-3">
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

      <div className="rounded-lg border border-slate-200 bg-white">
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: OPTIMIZER_TABLE_MIN_WIDTH }}
        >
          <colgroup>
            <col style={{ width: OPTIMIZER_SCOPE_COL_WIDTH }} />
            <col style={{ width: GOALS_COL_WIDTH }} />
            <col style={{ width: VALUE_COL_WIDTH }} />
            {SHOW_MODE_COLUMN ? <col style={{ width: 160 }} /> : null}
            <col style={{ width: BUDGET_OPT_COL_WIDTH }} />
            <col style={{ width: BID_OPT_COL_WIDTH }} />
            <col style={{ width: DAY_PARTING_COL_WIDTH }} />
            <col style={{ width: TARGETING_COL_WIDTH }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-600">
              <NestedTaxonomyScopeHeader
                label={scopeHeaderLabel}
                width={OPTIMIZER_SCOPE_COL_WIDTH}
                className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50"
              />
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Metric to optimize" />
              </th>
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Value" />
              </th>
              {SHOW_MODE_COLUMN ? (
                <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                  <div className="flex items-center justify-between gap-2">
                    <InfoLabel
                      label="Mode"
                      tooltip="Shows the combined mode from Budget Optimization and Bid Optimization."
                    />
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      Collapse
                    </button>
                  </div>
                </th>
              ) : null}
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Budget Optimization" />
              </th>
              <th className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                <InfoLabel label="Bid Optimization" />
              </th>
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
                budget: "ally" as const,
                bid: "ally" as const,
              };
              const baseline = baselineRowModes[nestedRow.id] ?? {
                budget: "ally" as const,
                bid: "ally" as const,
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
              const goalTargetValue = goalsState?.goalValue?.trim() ?? "";

              return (
                <tr
                  key={nestedRow.id}
                  className="hover:bg-slate-50/50"
                >
                  <NestedTaxonomyScopeCell
                    row={nestedRow}
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
                          label={`Metric to optimize for ${sourceRow.name}`}
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
                    {isLeaf && goalTargetValue ? (
                      <span className="font-medium text-blue-600">
                        {goalTargetValue}
                      </span>
                    ) : null}
                  </td>
                  {SHOW_MODE_COLUMN ? (
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
                  ) : null}
                  <td
                    className={cn(
                      OPTIMIZER_ROW_BORDER,
                      "overflow-hidden border-r border-slate-100 px-3 py-3",
                      // Changed mode → highlight the whole cell, not the chip.
                      budgetEdited && "bg-blue-50 ring-1 ring-inset ring-blue-500",
                    )}
                  >
                    {isLeaf && sourceRow ? (
                      <OptimizerCell
                        row={sourceRow}
                        column="budget"
                        budgetMode={modes.budget}
                        onBudgetModeChange={(mode) =>
                          setBudgetMode(nestedRow.id, mode)
                        }
                        onResetBudgetStrategies={() => {
                          setBudgetMode(nestedRow.id, "ally");
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
                      bidEdited && "bg-blue-50 ring-1 ring-inset ring-blue-500",
                    )}
                  >
                    {isLeaf && sourceRow ? (
                      <OptimizerCell
                        row={sourceRow}
                        column="bid"
                        bidMode={modes.bid}
                        onBidModeChange={(mode) =>
                          setBidMode(nestedRow.id, mode)
                        }
                        onResetBidStrategies={() => {
                          setBidMode(nestedRow.id, "ally");
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
