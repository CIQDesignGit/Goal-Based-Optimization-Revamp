/**
 * Nested Scope tree for Goals & Budgets / Constraints / Optimizer.
 * Entire Business stays row 0. Level 1 parents (e.g. Brand) nest Level 2 children.
 */

import {
  BUDGET_MONTHS,
  ENTIRE_BUSINESS_SCOPE_ID,
  SEASONALITY_LEVEL2_SCOPE_ID,
  getScopeTaxonomyValue,
  isBudgetCurrentMonth,
  isBudgetFutureMonth,
  resolveInitialMonthlyBudgets,
  type ScopeRow,
  type TaxonomyScopeLike,
} from "@/lib/gbo-optimization/setup-data";

/** Who owns goals/budgets for a Level 1 group. */
export type ScopeEditMode = "parent" | "children";

export type NestedScopeKind =
  | "entire-business"
  | "level1-parent"
  | "level2-child";

/** One visible table row in the nested Scope column. */
export type NestedScopeRow = {
  id: string;
  kind: NestedScopeKind;
  label: string;
  /** Shared for a parent and its children; null for Entire Business. */
  groupId: string | null;
  childIds: string[];
  depth: 0 | 1;
  expandable: boolean;
};

export const LEVEL1_PARENT_ID_PREFIX = "l1:";

export function makeLevel1ParentId(level1Value: string): string {
  return `${LEVEL1_PARENT_ID_PREFIX}${level1Value}`;
}

export function isLevel1ParentId(id: string): boolean {
  return id.startsWith(LEVEL1_PARENT_ID_PREFIX);
}

export function getLevel1LabelFromParentId(id: string): string {
  return decodeURIComponent(id.slice(LEVEL1_PARENT_ID_PREFIX.length));
}

/** Stable parent id from the Level 1 display label. */
export function makeLevel1ParentIdFromLabel(level1Label: string): string {
  return makeLevel1ParentId(encodeURIComponent(level1Label));
}

function parseCurrencyAmount(value: string): number {
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return 0;
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Profile-style names in mock data look like “Coastal Select — East”.
 * UI shows only the name before the em dash.
 */
export function formatScopeLevel2DisplayLabel(value: string): string {
  const separator = " — ";
  const index = value.indexOf(separator);
  if (index === -1) return value;
  return value.slice(0, index).trim();
}

function formatCurrencyAmount(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Flatten taxonomy into: Entire Business → Level 1 parent → indented Level 2 children.
 */
export function buildNestedScopeRows(
  rows: readonly TaxonomyScopeLike[],
  level1Key: string,
  level2Key: string,
): NestedScopeRow[] {
  const entire = rows.find((row) => row.id === ENTIRE_BUSINESS_SCOPE_ID);
  const leaves = rows.filter((row) => row.id !== ENTIRE_BUSINESS_SCOPE_ID);

  const groups = new Map<string, TaxonomyScopeLike[]>();
  for (const leaf of leaves) {
    const key = getScopeTaxonomyValue(leaf, level1Key);
    const list = groups.get(key) ?? [];
    list.push(leaf);
    groups.set(key, list);
  }

  const sortedGroupKeys = [...groups.keys()].sort((a, b) =>
    a.localeCompare(b),
  );

  const result: NestedScopeRow[] = [];

  if (entire) {
    result.push({
      id: entire.id,
      kind: "entire-business",
      label: entire.name,
      groupId: null,
      childIds: [],
      depth: 0,
      expandable: false,
    });
  }

  for (const groupKey of sortedGroupKeys) {
    const children = [...(groups.get(groupKey) ?? [])].sort((a, b) =>
      getScopeTaxonomyValue(a, level2Key).localeCompare(
        getScopeTaxonomyValue(b, level2Key),
      ),
    );
    const parentId = makeLevel1ParentIdFromLabel(groupKey);

    result.push({
      id: parentId,
      kind: "level1-parent",
      label: groupKey,
      groupId: parentId,
      childIds: children.map((child) => child.id),
      depth: 0,
      expandable: true,
    });

    for (const child of children) {
      result.push({
        id: child.id,
        kind: "level2-child",
        label: formatScopeLevel2DisplayLabel(
          getScopeTaxonomyValue(child, level2Key),
        ),
        groupId: parentId,
        childIds: [],
        depth: 1,
        expandable: false,
      });
    }
  }

  return result;
}

/** Groups and their child leaf ids (excludes Entire Business). */
export function listLevel1Groups(
  nestedRows: readonly NestedScopeRow[],
): { groupId: string; label: string; childIds: string[] }[] {
  return nestedRows
    .filter((row) => row.kind === "level1-parent")
    .map((row) => ({
      groupId: row.id,
      label: row.label,
      childIds: row.childIds,
    }));
}

/**
 * Rows that must have a goal for the current edit modes.
 * Parent mode → parent id; children mode → each child id.
 */
export function getActiveGoalEditableRowIds(
  nestedRows: readonly NestedScopeRow[],
  editModeByGroup: Record<string, ScopeEditMode>,
): string[] {
  const ids: string[] = [];

  for (const row of nestedRows) {
    if (row.kind === "level1-parent") {
      const mode = editModeByGroup[row.id] ?? "parent";
      if (mode === "parent") ids.push(row.id);
      continue;
    }

    if (row.kind === "level2-child" && row.groupId) {
      const mode = editModeByGroup[row.groupId] ?? "parent";
      if (mode === "children") ids.push(row.id);
    }
  }

  return ids;
}

export function getScopeEditMode(
  groupId: string | null | undefined,
  editModeByGroup: Record<string, ScopeEditMode>,
): ScopeEditMode {
  if (!groupId) return "parent";
  return editModeByGroup[groupId] ?? "parent";
}

/** Default edit mode map — every Level 1 group starts in parent mode. */
export function createInitialScopeEditModeByGroup(
  nestedRows: readonly NestedScopeRow[],
): Record<string, ScopeEditMode> {
  return Object.fromEntries(
    listLevel1Groups(nestedRows).map((group) => [group.groupId, "parent"]),
  );
}

/**
 * Build initial GoalsRowState for a Level 1 parent from its children
 * (past months = sum of children; current/future stay empty).
 */
export function createParentGoalsRowState(
  childLeaves: readonly ScopeRow[],
): {
  goalMetric: null;
  goalValue: string;
  monthlyBudgets: string[];
  historicGoalValue: string;
  historicMonthlyBudgets: string[];
  editedGoalValue: boolean;
  editedMonthlyBudgets: boolean[];
} {
  const childBudgets = childLeaves.map((leaf) =>
    resolveInitialMonthlyBudgets(leaf),
  );

  const monthlyBudgets = Array.from(
    { length: BUDGET_MONTHS.length },
    (_, monthIndex) => {
      if (
        isBudgetFutureMonth(monthIndex) ||
        isBudgetCurrentMonth(monthIndex)
      ) {
        return "";
      }

      const sum = childBudgets.reduce(
        (total, budgets) =>
          total + parseCurrencyAmount(budgets[monthIndex] ?? ""),
        0,
      );
      return formatCurrencyAmount(sum);
    },
  );

  return {
    goalMetric: null,
    goalValue: "",
    monthlyBudgets,
    historicGoalValue: "",
    historicMonthlyBudgets: [...monthlyBudgets],
    editedGoalValue: false,
    editedMonthlyBudgets: Array.from(
      { length: BUDGET_MONTHS.length },
      () => false,
    ),
  };
}

/** Sum one month across many budget strings. */
export function sumBudgetMonthValues(values: string[]): string {
  const total = values.reduce(
    (sum, value) => sum + parseCurrencyAmount(value),
    0,
  );
  return formatCurrencyAmount(total);
}

/** Sum FY total across rows that have monthlyBudgets. */
export function sumFyFromMonthlyBudgets(
  monthlyBudgetsList: string[][],
): number {
  return monthlyBudgetsList.reduce(
    (total, budgets) =>
      total +
      budgets.reduce(
        (monthTotal, budget) => monthTotal + parseCurrencyAmount(budget),
        0,
      ),
    0,
  );
}

/** Where a change was applied in the nested Scope tree. */
export type ScopeEditLevel = "entire-business" | "level1" | "level2";

/** Display identity for Summary line items (primary name + hierarchy cue). */
export type ScopeIdentity = {
  editLevel: ScopeEditLevel;
  /** Exact line item that was changed (L1 name or L2 name). */
  primaryName: string;
  level1Label: string;
  level2Label: string;
  level1Value: string;
  level2Value: string | null;
};

/**
 * Resolve primary name + Level 1 / Level 2 context for a scope id
 * (leaf id, `l1:…` parent id, or Entire Business).
 */
export function getScopeIdentity(
  scopeId: string,
  level1Key: string,
  level2Key: string,
  level1Label: string,
  level2Label: string,
  rows: readonly TaxonomyScopeLike[] = [],
): ScopeIdentity {
  if (scopeId === ENTIRE_BUSINESS_SCOPE_ID) {
    const entire = rows.find((row) => row.id === ENTIRE_BUSINESS_SCOPE_ID);
    return {
      editLevel: "entire-business",
      primaryName: entire?.name ?? "Entire Business",
      level1Label,
      level2Label,
      level1Value: entire?.name ?? "Entire Business",
      level2Value: null,
    };
  }

  // Seasonality Level 2 scope — outline badge style, no taxonomy leaf.
  if (scopeId === SEASONALITY_LEVEL2_SCOPE_ID) {
    return {
      editLevel: "level2",
      primaryName: level2Label,
      level1Label,
      level2Label,
      level1Value: "",
      level2Value: level2Label,
    };
  }

  if (isLevel1ParentId(scopeId)) {
    const level1Value = getLevel1LabelFromParentId(scopeId);
    return {
      editLevel: "level1",
      primaryName: level1Value,
      level1Label,
      level2Label,
      level1Value,
      level2Value: null,
    };
  }

  const leaf = rows.find((row) => row.id === scopeId);
  if (!leaf) {
    return {
      editLevel: "level2",
      primaryName: scopeId,
      level1Label,
      level2Label,
      level1Value: "",
      level2Value: null,
    };
  }

  const level1Value = getScopeTaxonomyValue(leaf, level1Key).trim();
  const level2Value = formatScopeLevel2DisplayLabel(
    getScopeTaxonomyValue(leaf, level2Key).trim(),
  );

  return {
    editLevel: "level2",
    primaryName: level2Value || leaf.name,
    level1Label,
    level2Label,
    level1Value,
    level2Value: level2Value || leaf.name,
  };
}

/** Short label for the edit level badge. */
export function getScopeEditLevelBadgeLabel(
  editLevel: ScopeEditLevel,
  level1Label: string,
  level2Label: string,
): string {
  if (editLevel === "entire-business") return "Entire Business";
  if (editLevel === "level1") return `Level 1 · ${level1Label}`;
  return `Level 2 · ${level2Label}`;
}
