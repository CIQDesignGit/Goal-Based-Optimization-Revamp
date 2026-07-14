"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { InfoLabel } from "@/components/gbo-optimization/info-label";
import {
  ENTIRE_BUSINESS_SCOPE_ID,
  getLevelLabel,
  getScopeTaxonomyValue,
  sortScopeRowsByLevels,
  type ScopeRow,
} from "@/lib/gbo-optimization/setup-data";
import {
  buildNestedScopeRows,
  type NestedScopeRow,
} from "@/lib/gbo-optimization/scope-tree";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

/** Any row that can show Level 1 / Level 2 taxonomy labels. */
export type TaxonomyScopeRow = {
  id: string;
  name: string;
  taxonomy?: ScopeRow["taxonomy"];
  indent?: boolean;
  expandable?: boolean;
};

/** Legacy two-column widths — kept for any leftover call sites. */
export const TAXONOMY_LEVEL1_COL_WIDTH = 148;
export const TAXONOMY_LEVEL2_COL_WIDTH = 172;
/** Single nested Scope column (matches Goals & Budgets). */
export const TAXONOMY_NESTED_SCOPE_COL_WIDTH = 240;

/** Reads General Level 1 / Level 2 picks for table headers and cells. */
export function useTaxonomyScopeLevels() {
  const budgetType = useSetupSessionStore(
    (state) => state.generalConfig.budgetType,
  );
  const level1Key = useSetupSessionStore((state) => state.generalConfig.level1);
  const level2Key = useSetupSessionStore((state) => state.generalConfig.level2);

  return useMemo(
    () => ({
      level1Key,
      level2Key,
      level1Label: getLevelLabel(budgetType, level1Key),
      level2Label: getLevelLabel(budgetType, level2Key),
      scopeHeaderLabel: `${getLevelLabel(budgetType, level1Key)} / ${getLevelLabel(budgetType, level2Key)}`,
    }),
    [budgetType, level1Key, level2Key],
  );
}

/** Nested Scope rows + expand/collapse state for Constraints / Optimizer. */
export function useNestedTaxonomyScopeRows<T extends TaxonomyScopeRow>(
  rows: readonly T[],
) {
  const { level1Key, level2Key, level1Label, level2Label, scopeHeaderLabel } =
    useTaxonomyScopeLevels();

  const nestedRows = useMemo(
    () => buildNestedScopeRows(rows, level1Key, level2Key),
    [rows, level1Key, level2Key],
  );

  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );

  const visibleRows = useMemo(() => {
    return nestedRows.filter((row) => {
      if (row.kind !== "level2-child" || !row.groupId) return true;
      return !collapsedGroupIds.has(row.groupId);
    });
  }, [nestedRows, collapsedGroupIds]);

  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const sourceById = useMemo(() => {
    return new Map(rows.map((row) => [row.id, row]));
  }, [rows]);

  return {
    nestedRows,
    visibleRows,
    collapsedGroupIds,
    toggleGroupCollapsed,
    sourceById,
    level1Label,
    level2Label,
    scopeHeaderLabel,
  };
}

/** Sort rows the same way as Goals & Budgets (Entire Business first). */
export function useSortedTaxonomyRows<T extends TaxonomyScopeRow>(
  rows: readonly T[],
): T[] {
  const { level1Key, level2Key } = useTaxonomyScopeLevels();

  return useMemo(
    () => sortScopeRowsByLevels(rows, level1Key, level2Key),
    [rows, level1Key, level2Key],
  );
}

type TaxonomyScopeHeaderProps = {
  label: string;
  width?: number;
  /** Left sticky offset in px (0 for Level 1, Level1 width for Level 2). */
  left?: number;
  sticky?: boolean;
  /** Soft edge when another taxonomy column sits to the right. */
  isLeading?: boolean;
  rowSpan?: number;
  className?: string;
};

/** Table header cell for Level 1 or Level 2 (label follows General pick). */
export function TaxonomyScopeHeader({
  label,
  width = TAXONOMY_LEVEL1_COL_WIDTH,
  left = 0,
  sticky = false,
  isLeading = false,
  rowSpan,
  className,
}: TaxonomyScopeHeaderProps) {
  return (
    <th
      rowSpan={rowSpan}
      style={
        sticky
          ? { left, width, minWidth: width, maxWidth: width }
          : { width, minWidth: width }
      }
      className={cn(
        "border-r border-slate-200 px-3 py-3 text-left font-medium",
        sticky && "sticky z-30 bg-slate-50",
        sticky && !isLeading && "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="truncate">
        <InfoLabel label={label} />
      </div>
    </th>
  );
}

type NestedTaxonomyScopeHeaderProps = {
  label: string;
  width?: number;
  sticky?: boolean;
  rowSpan?: number;
  className?: string;
};

/** Single nested Scope header (Level 1 / Level 2). */
export function NestedTaxonomyScopeHeader({
  label,
  width = TAXONOMY_NESTED_SCOPE_COL_WIDTH,
  sticky = false,
  rowSpan,
  className,
}: NestedTaxonomyScopeHeaderProps) {
  return (
    <th
      rowSpan={rowSpan}
      style={
        sticky
          ? { left: 0, width, minWidth: width, maxWidth: width }
          : { width, minWidth: width }
      }
      className={cn(
        "border-r border-slate-200 px-3 py-3 text-left font-medium",
        sticky &&
          "sticky top-0 z-30 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="truncate">
        <InfoLabel label={label} />
      </div>
    </th>
  );
}

type NestedTaxonomyScopeCellProps = {
  row: NestedScopeRow;
  collapsed?: boolean;
  onToggleCollapsed?: (groupId: string) => void;
  sticky?: boolean;
  width?: number;
  /** Extra under the label (e.g. rule-based skip cue on Optimizer). */
  extra?: ReactNode;
  className?: string;
};

/** One nested Scope body cell (parent or indented child). */
export function NestedTaxonomyScopeCell({
  row,
  collapsed = false,
  onToggleCollapsed,
  sticky = false,
  width = TAXONOMY_NESTED_SCOPE_COL_WIDTH,
  extra,
  className,
}: NestedTaxonomyScopeCellProps) {
  const isParent =
    row.kind === "entire-business" || row.kind === "level1-parent";
  const isChild = row.kind === "level2-child";

  return (
    <td
      style={
        sticky
          ? { left: 0, width, minWidth: width, maxWidth: width }
          : { width, minWidth: width }
      }
      className={cn(
        "overflow-hidden border-r border-b border-slate-100 px-3 py-3 text-left",
        sticky &&
          "sticky z-20 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50",
        isParent ? "font-semibold text-slate-900" : "font-medium text-slate-700",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          isChild && "pl-5",
        )}
      >
        <span className="flex min-w-0 items-center gap-1" title={row.label}>
          {row.expandable ? (
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-label={collapsed ? `Expand ${row.label}` : `Collapse ${row.label}`}
              onClick={() => onToggleCollapsed?.(row.id)}
              className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          ) : (
            <span className="inline-block size-4 shrink-0" aria-hidden />
          )}
          <span className="truncate">{row.label}</span>
        </span>
        {/* Match brand label indent (chevron/spacer + gap-1). */}
        {extra ? <div className="min-w-0 pl-5">{extra}</div> : null}
      </div>
    </td>
  );
}

type TaxonomyScopeCellsProps = {
  row: TaxonomyScopeRow;
  level1Key: string;
  level2Key: string;
  /** Show Level 1 text only on the first row of a group. */
  showLevel1Label: boolean;
  sticky?: boolean;
  level1Width?: number;
  level2Width?: number;
  /** Extra content under Level 2 (e.g. rule-based skip cue). */
  level2Extra?: ReactNode;
  className?: string;
};

/** Body cells for Level 1 + Level 2 — legacy two-column layout. */
export function TaxonomyScopeCells({
  row,
  level1Key,
  level2Key,
  showLevel1Label,
  sticky = false,
  level1Width = TAXONOMY_LEVEL1_COL_WIDTH,
  level2Width = TAXONOMY_LEVEL2_COL_WIDTH,
  level2Extra,
  className,
}: TaxonomyScopeCellsProps) {
  const isParent = row.id === ENTIRE_BUSINESS_SCOPE_ID;
  const level1Value = getScopeTaxonomyValue(row, level1Key);
  const level2Value = getScopeTaxonomyValue(row, level2Key);

  return (
    <>
      <td
        style={
          sticky
            ? {
                left: 0,
                width: level1Width,
                minWidth: level1Width,
                maxWidth: level1Width,
              }
            : undefined
        }
        className={cn(
          "overflow-hidden border-r border-slate-100 px-3 py-3 text-left",
          sticky && "sticky z-20 bg-white group-hover:bg-slate-50",
          isParent
            ? "font-semibold text-slate-900"
            : showLevel1Label
              ? "font-medium text-slate-900"
              : "font-normal text-slate-400",
          className,
        )}
      >
        <span
          className="flex min-w-0 items-center gap-1"
          title={level1Value || undefined}
        >
          {isParent && (row.expandable || !row.indent) ? (
            <ChevronDown className="size-4 shrink-0 text-slate-400" />
          ) : null}
          <span className="truncate">{showLevel1Label ? level1Value : ""}</span>
        </span>
      </td>
      <td
        style={
          sticky
            ? {
                left: level1Width,
                width: level2Width,
                minWidth: level2Width,
                maxWidth: level2Width,
              }
            : undefined
        }
        className={cn(
          "overflow-hidden border-r border-slate-100 px-3 py-3 text-left",
          sticky &&
            "sticky z-20 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50",
          isParent
            ? "font-semibold text-slate-900"
            : "font-medium text-slate-900",
          className,
        )}
      >
        {!isParent ? (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="block min-w-0 truncate" title={level2Value}>
              {level2Value}
            </span>
            {level2Extra}
          </div>
        ) : null}
      </td>
    </>
  );
}

/** Whether Level 1 label should show for this row index (hide repeats in a group). */
export function shouldShowTaxonomyLevel1Label(
  rows: readonly TaxonomyScopeRow[],
  rowIndex: number,
  level1Key: string,
): boolean {
  const row = rows[rowIndex];
  if (!row) return false;
  if (row.id === ENTIRE_BUSINESS_SCOPE_ID) return true;

  const level1Value = getScopeTaxonomyValue(row, level1Key);
  const previousLeaf = rows
    .slice(0, rowIndex)
    .reverse()
    .find((candidate) => candidate.id !== ENTIRE_BUSINESS_SCOPE_ID);

  if (!previousLeaf) return true;
  return getScopeTaxonomyValue(previousLeaf, level1Key) !== level1Value;
}
