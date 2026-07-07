/**
 * Constraint percent distribution helpers.
 *
 * Product rules (see also instructions.md — Constraints step):
 * - Manual edits lock; prefilled columns rebalance by historic weight to 100%.
 * - Error only when locked sum > 100 or all columns are manual and sum ≠ 100.
 */
export const SPEND_PERCENT_FIELDS = [
  "genericKeyword",
  "clientBrandedKeyword",
  "competitorKeyword",
  "competitorProduct",
  "auto",
  "others",
] as const;

export const CAMPAIGN_PERCENT_FIELDS = [
  "campaignSp",
  "campaignSb",
  "campaignSd",
] as const;

export type SpendPercentField = (typeof SPEND_PERCENT_FIELDS)[number];
export type CampaignPercentField = (typeof CAMPAIGN_PERCENT_FIELDS)[number];
export type PercentField = SpendPercentField | CampaignPercentField;

export const MAX_PERCENT_VALUE = 100;
export const PERCENT_DEVIATION_THRESHOLD = 10;

export type PercentValidationIssue =
  | { type: "over_max"; attempted: number; max: number }
  | { type: "under_min"; attempted: number }
  | {
      type: "value_deviation";
      attempted: number;
      baseline: number;
      threshold: number;
    };

export function parsePercent(value: string): number {
  const cleaned = value.trim().replace(/%/g, "");
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatPercentNumber(value: number): string {
  const rounded = Math.round(value);
  return `${rounded}%`;
}

export function sumPercentFields(
  values: Record<string, string>,
  fields: readonly PercentField[],
): number {
  return fields.reduce(
    (total, field) => total + parsePercent(values[field] ?? ""),
    0,
  );
}

/** Total column label: sum of row percent fields over 100. */
export function formatPercentTotalDisplay(
  values: Record<string, string>,
  fields: readonly PercentField[],
): string {
  return `${Math.round(sumPercentFields(values, fields))}% / 100%`;
}

export function isPercentGroupValid(
  values: Record<string, string>,
  fields: readonly PercentField[],
): boolean {
  return Math.round(sumPercentFields(values, fields)) === MAX_PERCENT_VALUE;
}

/** Locked manual values alone exceed 100%, or every column is manual and sum ≠ 100. */
export function isPercentGroupBlocked(
  values: Record<string, string>,
  fields: readonly PercentField[],
  historic: Record<PercentField, number>,
  overridden: Partial<Record<PercentField, boolean>>,
): boolean {
  const locked = buildLockedPercentMap(
    fields,
    values,
    historic,
    overridden,
    null,
    "",
  );
  const lockedSum = sumLockedPercents(locked);

  if (lockedSum > MAX_PERCENT_VALUE) {
    return true;
  }

  const allManual = fields.every((field) => Boolean(overridden[field]));
  return allManual && !isPercentGroupValid(values, fields);
}

export function buildLockedPercentMap(
  fields: readonly PercentField[],
  values: Record<string, string>,
  historic: Record<PercentField, number>,
  overridden: Partial<Record<PercentField, boolean>>,
  activeField: PercentField | null,
  activeRawValue: string,
): Partial<Record<PercentField, number>> {
  const locked: Partial<Record<PercentField, number>> = {};

  for (const field of fields) {
    if (field === activeField) {
      continue;
    }

    if (overridden[field]) {
      locked[field] = parsePercent(values[field] ?? "");
    }
  }

  if (!activeField) {
    return locked;
  }

  const activeTrimmed = activeRawValue.trim().replace(/%/g, "");
  const hasActiveParse =
    activeTrimmed !== "" && !Number.isNaN(Number.parseFloat(activeTrimmed));

  if (hasActiveParse) {
    const activeValue = parsePercent(activeRawValue);
    if (overridden[activeField] || activeValue !== historic[activeField]) {
      locked[activeField] = activeValue;
    }
  } else if (overridden[activeField]) {
    locked[activeField] = parsePercent(values[activeField] ?? "");
  }

  return locked;
}

export type PercentGroupRebalanceResult = {
  values: Record<PercentField, string>;
  overridden: Partial<Record<PercentField, boolean>>;
  adjusted: Partial<Record<PercentField, boolean>>;
  lockedSum: number;
  totalSum: number;
  blocked: boolean;
  valid: boolean;
};

/** Rebalance unlocked fields by historic weight; keep manual (overridden) values fixed. */
export function rebalancePercentGroup(
  fields: readonly PercentField[],
  row: {
    values: Record<string, string>;
    historicPercents: Record<PercentField, number>;
    overridden: Partial<Record<PercentField, boolean>>;
    adjusted: Partial<Record<PercentField, boolean>>;
  },
  activeField: PercentField,
  activeRawValue: string,
): PercentGroupRebalanceResult {
  const locked = buildLockedPercentMap(
    fields,
    row.values,
    row.historicPercents,
    row.overridden,
    activeField,
    activeRawValue,
  );
  const lockedSum = sumLockedPercents(locked);
  const activeTrimmed = activeRawValue.trim().replace(/%/g, "");
  const hasActiveParse =
    activeTrimmed !== "" && !Number.isNaN(Number.parseFloat(activeTrimmed));

  const nextOverridden = { ...row.overridden };
  if (hasActiveParse) {
    const activeValue = parsePercent(activeRawValue);
    if (activeValue === row.historicPercents[activeField]) {
      delete nextOverridden[activeField];
    } else {
      nextOverridden[activeField] = true;
    }
  } else if (activeRawValue.trim() === "") {
    delete nextOverridden[activeField];
  }

  const mergedValues = {
    ...row.values,
    [activeField]: activeRawValue,
  };

  if (lockedSum > MAX_PERCENT_VALUE) {
    return {
      values: pickPercentValues(mergedValues, fields),
      overridden: nextOverridden,
      adjusted: {},
      lockedSum,
      totalSum: Math.round(sumPercentFields(mergedValues, fields)),
      blocked: true,
      valid: false,
    };
  }

  const redistributed = redistributePercentFields(
    fields,
    row.historicPercents,
    locked,
  );

  const nextValues = {
    ...row.values,
    ...redistributed,
    [activeField]: hasActiveParse
      ? formatPercentNumber(parsePercent(activeRawValue))
      : activeRawValue,
  };

  const nextAdjusted: Partial<Record<PercentField, boolean>> = {};
  for (const field of fields) {
    if (locked[field] !== undefined) {
      continue;
    }

    const newVal = parsePercent(nextValues[field] ?? "");
    const oldVal = parsePercent(row.values[field] ?? "");
    if (newVal !== oldVal) {
      nextAdjusted[field] = true;
    }
  }

  const totalSum = Math.round(sumPercentFields(nextValues, fields));
  const allManual = fields.every((field) => Boolean(nextOverridden[field]));
  const blocked =
    lockedSum > MAX_PERCENT_VALUE ||
    (allManual && totalSum !== MAX_PERCENT_VALUE);

  return {
    values: pickPercentValues(nextValues, fields),
    overridden: nextOverridden,
    adjusted: nextAdjusted,
    lockedSum,
    totalSum,
    blocked,
    valid: totalSum === MAX_PERCENT_VALUE && !blocked,
  };
}

function pickPercentValues(
  values: Record<string, string>,
  fields: readonly PercentField[],
): Record<PercentField, string> {
  return Object.fromEntries(
    fields.map((field) => [field, values[field] ?? ""]),
  ) as Record<PercentField, string>;
}

/** Lock every manually edited field in the group plus the field being committed. */
export function buildManualLockedPercents(
  fields: readonly PercentField[],
  values: Record<string, string>,
  historic: Record<PercentField, number>,
  currentField: PercentField,
  currentValue: number,
  manualFields: Partial<Record<PercentField, boolean>>,
): Partial<Record<PercentField, number>> {
  const locked: Partial<Record<PercentField, number>> = {};

  for (const field of fields) {
    const value =
      field === currentField ? currentValue : parsePercent(values[field] ?? "");
    const isCurrentField = field === currentField;
    const isFlaggedManual = Boolean(manualFields[field]);

    if (value !== historic[field] && (isCurrentField || isFlaggedManual)) {
      locked[field] = value;
    }
  }

  return locked;
}

export function sumLockedPercents(
  locked: Partial<Record<PercentField, number>>,
): number {
  return Math.round(
    Object.values(locked).reduce((total, value) => total + value, 0),
  );
}

export function formatPercentInput(value: string): string {
  const raw = value.trim().replace(/%/g, "");
  if (!raw) return "";
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) return value;
  return formatPercentNumber(parsed);
}

export function validatePercentEdit(
  rawValue: string,
  baselinePercent: number,
  options: {
    max?: number;
    deviationThreshold?: number;
  } = {},
): { ok: true; value: number } | { ok: false; issue: PercentValidationIssue } {
  const max = options.max ?? MAX_PERCENT_VALUE;
  const deviationThreshold =
    options.deviationThreshold ?? PERCENT_DEVIATION_THRESHOLD;
  const raw = rawValue.trim().replace(/%/g, "");

  if (!raw) {
    return { ok: true, value: 0 };
  }

  const attempted = Number.parseFloat(raw);
  if (Number.isNaN(attempted)) {
    return { ok: true, value: parsePercent(rawValue) };
  }

  if (attempted > max) {
    return { ok: false, issue: { type: "over_max", attempted, max } };
  }

  if (attempted < 0) {
    return { ok: false, issue: { type: "under_min", attempted } };
  }

  const deviation = Math.abs(attempted - baselinePercent);
  if (deviation > deviationThreshold) {
    return {
      ok: false,
      issue: {
        type: "value_deviation",
        attempted,
        baseline: baselinePercent,
        threshold: deviationThreshold,
      },
    };
  }

  return { ok: true, value: attempted };
}

/** Split `remaining` across unlocked fields using historic weights; integers sum to `remaining`. */
export function redistributePercentFields(
  fields: readonly PercentField[],
  historic: Record<PercentField, number>,
  locked: Partial<Record<PercentField, number>>,
): Record<PercentField, string> {
  const lockedSum = Object.values(locked).reduce((total, value) => total + value, 0);
  const clampedLockedSum = Math.min(100, Math.max(0, lockedSum));
  const remaining = Math.max(0, 100 - clampedLockedSum);
  const unlockedFields = fields.filter((field) => locked[field] === undefined);

  const result = {} as Record<PercentField, string>;

  for (const [field, value] of Object.entries(locked) as [PercentField, number][]) {
    result[field] = formatPercentNumber(value);
  }

  if (unlockedFields.length === 0) {
    for (const field of fields) {
      if (!result[field]) {
        result[field] = "0%";
      }
    }
    return result;
  }

  const weights = unlockedFields.map((field) => historic[field] ?? 0);
  const weightSum = weights.reduce((total, weight) => total + weight, 0);

  const rawValues = unlockedFields.map((field, index) => {
    if (remaining === 0) return { field, value: 0 };
    if (weightSum === 0) {
      return { field, value: remaining / unlockedFields.length };
    }
    return {
      field,
      value: (weights[index] / weightSum) * remaining,
    };
  });

  const floored = rawValues.map(({ field, value }) => ({
    field,
    value: Math.floor(value),
    fraction: value - Math.floor(value),
  }));

  let assigned = floored.reduce((total, item) => total + item.value, 0);
  let remainder = remaining - assigned;

  const byFraction = [...floored].sort((a, b) => b.fraction - a.fraction);
  for (const item of byFraction) {
    if (remainder <= 0) break;
    item.value += 1;
    remainder -= 1;
  }

  for (const item of floored) {
    result[item.field] = formatPercentNumber(item.value);
  }

  for (const field of fields) {
    if (!result[field]) {
      result[field] = "0%";
    }
  }

  return result;
}
