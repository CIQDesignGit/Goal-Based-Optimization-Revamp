"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Search,
  Settings2,
} from "lucide-react";

import {
  DayPartingTile,
  HourlyBidderPanel,
} from "@/components/gbo-optimization/hourly-bidder-panel";
import { InfoLabel } from "@/components/gbo-optimization/info-label";
import {
  getAggregateOptimizerMode,
  OptimizerModeChip,
  type OptimizerColumnMode,
} from "@/components/gbo-optimization/optimizer-mode-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  OPTIMIZER_SCOPE_ROWS,
  RULE_BASED_ITEM_MODE_TOAST,
  RULE_BASED_ITEM_SKIP_CUE,
} from "@/lib/gbo-optimization/setup-data";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

type OptimizerScopeRow = (typeof OPTIMIZER_SCOPE_ROWS)[number];

const DEFAULT_DAY_PARTING_LABEL = "Hourly Bid...";

/** Hide Mode column for now — keep markup so we can turn it back on later. */
const SHOW_MODE_COLUMN = false;

type RowOptimizerModes = {
  budget: OptimizerColumnMode;
  bid: OptimizerColumnMode;
};

function createInitialRowModes(): Record<string, RowOptimizerModes> {
  const initial: Record<string, RowOptimizerModes> = {};
  for (const row of OPTIMIZER_SCOPE_ROWS) {
    if ("allyMode" in row && row.allyMode) {
      initial[row.id] = { budget: "ally", bid: "ally" };
    }
  }
  return initial;
}

/** Ally-mode brands start with a day-parting strategy already set (prototype). */
function createInitialDayPartingLabels(): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const row of OPTIMIZER_SCOPE_ROWS) {
    if ("allyMode" in row && row.allyMode) {
      initial[row.id] = DEFAULT_DAY_PARTING_LABEL;
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
}) {
  // Targeting: always show add (+) — including rows without Ally mode.
  if (column === "targeting") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Add targeting for ${row.name}`}
        title="Add targeting"
        className="text-slate-400 hover:text-slate-600"
      >
        <Plus className="size-3.5" />
      </Button>
    );
  }

  if (!("allyMode" in row) || !row.allyMode) {
    return null;
  }

  if (column === "dayParting") {
    return (
      <DayPartingTile
        scopeName={row.name}
        label={dayPartingLabel ?? DEFAULT_DAY_PARTING_LABEL}
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
    return (
      <OptimizerModeChip
        mode={bidMode ?? "ally"}
        selectable
        showBoost
        onChange={onBidModeChange}
      />
    );
  }

  // Budget Optimization — selectable Ally / Rule Based / None
  return (
    <OptimizerModeChip
      mode={budgetMode ?? "ally"}
      selectable
      onChange={onBudgetModeChange}
    />
  );
}

export function OptimizerStep() {
  // Per-row Budget / Bid modes (Mode column is derived from these).
  const [rowModes, setRowModes] = useState(createInitialRowModes);
  // Mirror so click handlers can read the previous value without nested setState.
  const rowModesRef = useRef(rowModes);
  rowModesRef.current = rowModes;

  const showSetupToast = useSetupSessionStore((state) => state.showSetupToast);

  // Which brand row the side panel is editing/adding (null = closed).
  const [activeDayPartingRowId, setActiveDayPartingRowId] = useState<
    string | null
  >(null);
  // edit = Day Parting tile; add = Bid Optimization "+" button.
  const [dayPartingPanelMode, setDayPartingPanelMode] = useState<
    "edit" | "add"
  >("edit");
  // Tile label per row — key present means a strategy exists for that row.
  const [dayPartingLabels, setDayPartingLabels] = useState(
    createInitialDayPartingLabels,
  );

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
    DEFAULT_DAY_PARTING_LABEL;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search"
            className="h-9 border-slate-200 pl-9 shadow-none"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-600">
          <Plus className="size-4" />
          Add Filters
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Optimizer settings"
          className="ml-auto text-slate-500 hover:text-slate-700"
        >
          <Settings2 className="size-4" />
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
              {SHOW_MODE_COLUMN ? (
                <th className="border-r border-slate-200 px-4 py-3 font-medium">
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
            {OPTIMIZER_SCOPE_ROWS.map((row) => {
              const modes = rowModes[row.id] ?? {
                budget: "ally" as const,
                bid: "ally" as const,
              };
              const isRuleBasedItem = rowHasRuleBasedMode(modes);

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="border-r border-slate-100 px-4 py-3 font-medium text-slate-900">
                    <div
                      className={cn(
                        "flex min-w-0 flex-col gap-1",
                        "indent" in row && row.indent && "pl-6",
                      )}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1">
                        {"expandable" in row && row.expandable && (
                          <ChevronDown className="size-4 shrink-0 text-slate-400" />
                        )}
                        <span className="truncate">{row.name}</span>
                      </span>
                      {/* Persistent cue while this item uses rule-based */}
                      {isRuleBasedItem ? (
                        <span className="text-2xs font-medium leading-snug text-amber-700">
                          {RULE_BASED_ITEM_SKIP_CUE}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3 text-slate-700">
                    {"goal" in row ? row.goal : ""}
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    {"value" in row && row.value ? (
                      <span className="font-medium text-brand-600">
                        {row.value}
                      </span>
                    ) : null}
                  </td>
                  {SHOW_MODE_COLUMN ? (
                    <td className="border-r border-slate-100 px-4 py-3">
                      <OptimizerCell
                        row={row}
                        column="mode"
                        budgetMode={modes.budget}
                        bidMode={modes.bid}
                      />
                    </td>
                  ) : null}
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell
                      row={row}
                      column="budget"
                      budgetMode={modes.budget}
                      onBudgetModeChange={(mode) =>
                        setBudgetMode(row.id, mode)
                      }
                    />
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell
                      row={row}
                      column="bid"
                      bidMode={modes.bid}
                      onBidModeChange={(mode) => setBidMode(row.id, mode)}
                    />
                  </td>
                  <td className="border-r border-slate-100 px-4 py-3">
                    <OptimizerCell
                      row={row}
                      column="dayParting"
                      dayPartingLabel={dayPartingLabels[row.id]}
                      onOpenDayParting={() =>
                        openDayPartingPanel(row.id, "edit")
                      }
                      onAddDayParting={() =>
                        openDayPartingPanel(row.id, "add")
                      }
                      onResetDayParting={() =>
                        setDayPartingLabels((current) => {
                          const next = { ...current };
                          delete next[row.id];
                          return next;
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <OptimizerCell row={row} column="targeting" />
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
          setDayPartingLabels((current) => ({
            ...current,
            [activeDayPartingRowId]: label,
          }));
        }}
      />
    </div>
  );
}
