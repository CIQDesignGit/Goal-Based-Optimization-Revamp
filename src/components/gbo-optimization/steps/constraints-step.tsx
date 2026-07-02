"use client";

import { type FocusEvent, type KeyboardEvent, useMemo, useRef, useState } from "react";
import { ChevronDown, CircleHelp, Eye, History, Plus, Search, TrendingUp, X } from "lucide-react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CAMPAIGN_PERCENT_FIELDS,
  formatPercentNumber,
  MAX_PERCENT_VALUE,
  parsePercent,
  PERCENT_DEVIATION_THRESHOLD,
  redistributePercentFields,
  SPEND_PERCENT_FIELDS,
  validatePercentEdit,
  type CampaignPercentField,
  type PercentField,
  type PercentValidationIssue,
  type SpendPercentField,
} from "@/lib/gbo-optimization/constraint-distribution";
import {
  CONSTRAINTS_SCOPE_ROWS,
  type ConstraintLast30Days,
  type ConstraintRow,
} from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

const SPEND_CONSTRAINT_COL_COUNT = 7;
const CAMPAIGN_CONSTRAINT_COL_COUNT = 8;
const SCOPE_COL_WIDTH = 200;
const DATA_COL_WIDTH = 100;
const SPEND_TOTAL_COL_WIDTH = 132;
const SPEND_TOTAL_DISPLAY = "100% / 100%";

const scopeStickyClass =
  "sticky left-0 z-20 border-r border-slate-200 bg-white group-hover:bg-slate-50/50";
const scopeStickyHeaderClass =
  "sticky left-0 z-30 border-r border-slate-200 bg-slate-50";
const dataColClass = "w-[100px] min-w-[100px] max-w-[100px] px-2";
const spendTotalColClass =
  "w-[132px] min-w-[132px] max-w-[132px] px-2 whitespace-nowrap";
const totalColClass = "text-right";
const cellInputClass =
  "h-8 w-full min-w-0 border-transparent px-1 text-center text-sm tabular-nums shadow-none hover:border-slate-200 focus-visible:border-brand-300 focus-visible:bg-white";

/** Select numeric portion on focus — keeps $ prefix and % suffix out of selection. */
function selectEditablePortion(input: HTMLInputElement) {
  const { value } = input;
  const start = value.startsWith("$") ? 1 : 0;
  const end = value.endsWith("%")
    ? Math.max(start, value.length - 1)
    : value.length;

  if (end > start) {
    input.setSelectionRange(start, end);
  } else if (value.length > 0) {
    input.select();
  }
}

function handleConstraintInputFocus(
  event: FocusEvent<HTMLInputElement>,
  onFocus?: () => void,
) {
  onFocus?.();
  requestAnimationFrame(() => {
    selectEditablePortion(event.currentTarget);
  });
}

function handleConstraintInputKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  options?: { showConfirm?: boolean; onConfirm?: () => void },
) {
  if (event.key !== "Enter") return;

  event.preventDefault();
  if (options?.showConfirm && options.onConfirm) {
    options.onConfirm();
  }
  event.currentTarget.blur();
}

type ConstraintValues = {
  goalValue: string;
  genericKeyword: string;
  clientBrandedKeyword: string;
  competitorKeyword: string;
  competitorProduct: string;
  auto: string;
  others: string;
  campaignSp: string;
  campaignSb: string;
  campaignSd: string;
  bidFloor: string;
  bidCeiling: string;
  budgetFloor: string;
  budgetCeiling: string;
};

type ConstraintValueField = keyof ConstraintValues;

type PercentGroup = "spend" | "campaign";

function editSessionKey(rowId: string, field: ConstraintValueField): string {
  return `${rowId}:${field}`;
}

type PendingPercentWarning = {
  rowId: string;
  field: PercentField;
  group: PercentGroup;
  previousValue: string;
  proposedValue: number;
};

type InlineBlockAlert = {
  rowId: string;
  field: ConstraintValueField;
  message: string;
};

function inlineBlockMessage(
  issue: Extract<PercentValidationIssue, { type: "over_max" | "under_min" }>,
): string {
  if (issue.type === "over_max") {
    return `Max ${issue.max}%`;
  }
  return "Min 0%";
}

type ConstraintRowState = {
  values: ConstraintValues;
  historicPercents: Record<PercentField, number>;
  overridden: Partial<Record<ConstraintValueField, boolean>>;
};

function emptyValues(): ConstraintValues {
  return {
    goalValue: "",
    genericKeyword: "",
    clientBrandedKeyword: "",
    competitorKeyword: "",
    competitorProduct: "",
    auto: "",
    others: "",
    campaignSp: "",
    campaignSb: "",
    campaignSd: "",
    bidFloor: "",
    bidCeiling: "",
    budgetFloor: "",
    budgetCeiling: "",
  };
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildHistoricPercents(
  values: ConstraintValues,
): Record<PercentField, number> {
  return Object.fromEntries(
    [...SPEND_PERCENT_FIELDS, ...CAMPAIGN_PERCENT_FIELDS].map((field) => [
      field,
      parsePercent(values[field]),
    ]),
  ) as Record<PercentField, number>;
}

function buildRowStateFromHistoric(last30Days: ConstraintLast30Days = {}): ConstraintRowState {
  const values: ConstraintValues = {
    ...emptyValues(),
    goalValue: last30Days.goalValue ?? "",
    genericKeyword: last30Days.genericKeyword ?? "",
    clientBrandedKeyword: last30Days.clientBrandedKeyword ?? "",
    competitorKeyword: last30Days.competitorKeyword ?? "",
    competitorProduct: last30Days.competitorProduct ?? "",
    auto: last30Days.auto ?? "",
    others: last30Days.others ?? "",
    campaignSp: last30Days.campaignSp ?? "",
    campaignSb: last30Days.campaignSb ?? "",
    campaignSd: last30Days.campaignSd ?? "",
    bidFloor: last30Days.bidFloor ?? "",
    bidCeiling: last30Days.bidCeiling ?? "",
    budgetFloor: last30Days.budgetFloor ?? "",
    budgetCeiling: last30Days.budgetCeiling ?? "",
  };

  const historicPercents = buildHistoricPercents(values);
  const spendDistributed = redistributePercentFields(
    SPEND_PERCENT_FIELDS,
    historicPercents,
    {},
  );
  const campaignDistributed = redistributePercentFields(
    CAMPAIGN_PERCENT_FIELDS,
    historicPercents,
    {},
  );

  return {
    values: {
      ...values,
      ...spendDistributed,
      ...campaignDistributed,
    },
    historicPercents,
    overridden: {},
  };
}

function createInitialRowState(): Record<string, ConstraintRowState> {
  return Object.fromEntries(
    CONSTRAINTS_SCOPE_ROWS.map((row) => [
      row.id,
      buildRowStateFromHistoric(row.last30Days),
    ]),
  );
}

function getLockedPercents(
  fields: readonly PercentField[],
  values: ConstraintValues,
  overridden: Partial<Record<ConstraintValueField, boolean>>,
): Partial<Record<PercentField, number>> {
  const locked: Partial<Record<PercentField, number>> = {};

  for (const field of fields) {
    if (overridden[field]) {
      locked[field] = parsePercent(values[field]);
    }
  }

  return locked;
}

function rowHasOverrides(state: ConstraintRowState): boolean {
  return Object.keys(state.overridden).length > 0;
}

function getCellVisualState(
  state: ConstraintRowState,
  field: ConstraintValueField,
): "historic" | "adjusted" | "edited" {
  if (state.overridden[field]) return "edited";
  if (rowHasOverrides(state)) return "adjusted";
  return "historic";
}

function cellInputVisualClass(
  state: ConstraintRowState,
  field: ConstraintValueField,
  extra?: string,
): string {
  const visual = getCellVisualState(state, field);

  return cn(
    cellInputClass,
    visual === "historic" &&
      "bg-slate-50 text-slate-400 italic placeholder:text-slate-300",
    visual === "adjusted" && "bg-sky-50/60 text-slate-600",
    visual === "edited" && "bg-white font-medium text-slate-900",
    extra,
  );
}

function ConstraintDataColgroup({
  showCampaignConstraints,
}: {
  showCampaignConstraints: boolean;
}) {
  return (
    <colgroup>
      <col style={{ width: SCOPE_COL_WIDTH }} />
      <col style={{ width: DATA_COL_WIDTH }} />
      <col style={{ width: DATA_COL_WIDTH }} />
      {Array.from({ length: SPEND_CONSTRAINT_COL_COUNT }).map((_, index) => (
        <col
          key={`spend-${index}`}
          style={{
            width:
              index === SPEND_CONSTRAINT_COL_COUNT - 1
                ? SPEND_TOTAL_COL_WIDTH
                : DATA_COL_WIDTH,
          }}
        />
      ))}
      {showCampaignConstraints &&
        Array.from({ length: CAMPAIGN_CONSTRAINT_COL_COUNT }).map((_, index) => (
          <col key={`campaign-${index}`} style={{ width: DATA_COL_WIDTH }} />
        ))}
    </colgroup>
  );
}

type PercentConstraintCellProps = {
  rowId: string;
  field: PercentField;
  value: string;
  state: ConstraintRowState;
  ariaLabel: string;
  title?: string;
  pendingWarning: PendingPercentWarning | null;
  blockAlert: InlineBlockAlert | null;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onConfirmPending: () => void;
  onDismissPending: () => void;
};

function PercentConstraintCell({
  rowId,
  field,
  value,
  state,
  ariaLabel,
  title,
  pendingWarning,
  blockAlert,
  onChange,
  onFocus,
  onBlur,
  onConfirmPending,
  onDismissPending,
}: PercentConstraintCellProps) {
  const showConfirm =
    pendingWarning?.rowId === rowId && pendingWarning.field === field;
  const showBlock = blockAlert?.rowId === rowId && blockAlert.field === field;

  return (
    <div className="py-0.5">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => handleConstraintInputFocus(event, onFocus)}
        onClick={(event) => selectEditablePortion(event.currentTarget)}
        onKeyDown={(event) =>
          handleConstraintInputKeyDown(event, {
            showConfirm,
            onConfirm: onConfirmPending,
          })
        }
        onBlur={onBlur}
        aria-label={ariaLabel}
        aria-invalid={showConfirm || showBlock}
        title={title}
        className={cn(
          cellInputVisualClass(state, field),
          showConfirm &&
            "border-amber-400 bg-amber-50/80 ring-1 ring-amber-200 focus-visible:border-amber-400",
          showBlock &&
            !showConfirm &&
            "border-amber-500 ring-1 ring-amber-200 focus-visible:border-amber-500",
        )}
      />
      {showConfirm && pendingWarning && (
        <div
          role="alert"
          className="mt-1 rounded border border-amber-200 bg-amber-50/90 px-1.5 py-1 text-left"
        >
          <p className="text-[10px] leading-snug text-amber-950">
            Far from{" "}
            <span className="font-medium">{pendingWarning.previousValue || "0%"}</span>
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
            <button
              type="button"
              className="font-medium text-brand-600 hover:underline"
              onMouseDown={(event) => {
                event.preventDefault();
                onConfirmPending();
              }}
            >
              Keep
            </button>
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <button
              type="button"
              className="text-slate-600 hover:underline"
              onMouseDown={(event) => {
                event.preventDefault();
                onDismissPending();
              }}
            >
              Revert
            </button>
          </div>
        </div>
      )}
      {showBlock && blockAlert && !showConfirm && (
        <p className="mt-0.5 text-[10px] leading-tight text-amber-700">
          {blockAlert.message}
        </p>
      )}
    </div>
  );
}

type EditableConstraintCellProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  ariaLabel: string;
  className?: string;
  title?: string;
};

function EditableConstraintCell({
  value,
  onChange,
  onFocus,
  onBlur,
  ariaLabel,
  className,
  title,
}: EditableConstraintCellProps) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={(event) => handleConstraintInputFocus(event, onFocus)}
      onClick={(event) => selectEditablePortion(event.currentTarget)}
      onKeyDown={(event) => handleConstraintInputKeyDown(event)}
      onBlur={onBlur}
      aria-label={ariaLabel}
      title={title}
      className={className}
    />
  );
}

export function ConstraintsStep() {
  const { optimizerType } = useSetupContext();
  const isRuleBased = optimizerType === "rule-based";
  const [showCampaignConstraints, setShowCampaignConstraints] = useState(false);
  const [rowState, setRowState] = useState(createInitialRowState);
  const editSessionsRef = useRef<Record<string, string>>({});
  const [pendingWarning, setPendingWarning] =
    useState<PendingPercentWarning | null>(null);
  const [blockAlert, setBlockAlert] = useState<InlineBlockAlert | null>(null);
  const [historicHintDismissed, setHistoricHintDismissed] = useState(false);

  const updateValue = (
    rowId: string,
    field: ConstraintValueField,
    value: string,
  ) => {
    setRowState((current) => ({
      ...current,
      [rowId]: {
        ...current[rowId],
        values: {
          ...current[rowId].values,
          [field]: value,
        },
      },
    }));
  };

  const restoreFieldValue = (
    rowId: string,
    field: ConstraintValueField,
    previousValue: string,
  ) => {
    setRowState((current) => ({
      ...current,
      [rowId]: {
        ...current[rowId],
        values: {
          ...current[rowId].values,
          [field]: previousValue,
        },
      },
    }));
  };

  const applyPercentCommit = (
    rowId: string,
    field: PercentField,
    group: PercentGroup,
    editedValue: number,
  ) => {
    const fields =
      group === "spend" ? SPEND_PERCENT_FIELDS : CAMPAIGN_PERCENT_FIELDS;

    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const nextOverridden = { ...row.overridden, [field]: true };
      const locked = getLockedPercents(
        fields,
        {
          ...row.values,
          [field]: formatPercentNumber(editedValue),
        },
        nextOverridden,
      );
      const redistributed = redistributePercentFields(
        fields,
        row.historicPercents,
        locked,
      );

      return {
        ...current,
        [rowId]: {
          ...row,
          overridden: nextOverridden,
          values: {
            ...row.values,
            ...redistributed,
          },
        },
      };
    });
  };

  const beginEditSession = (
    rowId: string,
    field: ConstraintValueField,
    previousValue: string,
  ) => {
    setPendingWarning(null);
    setBlockAlert(null);
    editSessionsRef.current[editSessionKey(rowId, field)] = previousValue;
  };

  const getPreviousValue = (
    rowId: string,
    field: ConstraintValueField,
    fallback: string,
  ) => editSessionsRef.current[editSessionKey(rowId, field)] ?? fallback;

  const tryCommitPercent = (
    rowId: string,
    field: PercentField,
    group: PercentGroup,
  ) => {
    const row = rowState[rowId];
    if (!row) return;

    const previousValue = getPreviousValue(rowId, field, row.values[field]);
    const rawValue = row.values[field];
    const validation = validatePercentEdit(
      rawValue,
      parsePercent(previousValue),
      {
        max: MAX_PERCENT_VALUE,
        deviationThreshold: PERCENT_DEVIATION_THRESHOLD,
      },
    );
    if (!validation.ok) {
      if (validation.issue.type === "value_deviation") {
        setPendingWarning({
          rowId,
          field,
          group,
          previousValue,
          proposedValue: validation.issue.attempted,
        });
        setBlockAlert(null);
        return;
      }

      restoreFieldValue(rowId, field, previousValue);
      setBlockAlert({
        rowId,
        field,
        message: inlineBlockMessage(validation.issue),
      });
      setPendingWarning(null);
      delete editSessionsRef.current[editSessionKey(rowId, field)];
      return;
    }

    applyPercentCommit(rowId, field, group, validation.value);
    setPendingWarning(null);
    setBlockAlert(null);
    delete editSessionsRef.current[editSessionKey(rowId, field)];
  };

  const confirmPendingWarning = () => {
    if (!pendingWarning) return;

    applyPercentCommit(
      pendingWarning.rowId,
      pendingWarning.field,
      pendingWarning.group,
      pendingWarning.proposedValue,
    );
    setPendingWarning(null);
    setBlockAlert(null);
    delete editSessionsRef.current[
      editSessionKey(pendingWarning.rowId, pendingWarning.field)
    ];
  };

  const dismissPendingWarning = () => {
    if (!pendingWarning) return;

    restoreFieldValue(
      pendingWarning.rowId,
      pendingWarning.field,
      pendingWarning.previousValue,
    );
    setPendingWarning(null);
    delete editSessionsRef.current[
      editSessionKey(pendingWarning.rowId, pendingWarning.field)
    ];
  };

  const commitSpendPercent = (rowId: string, field: SpendPercentField) => {
    tryCommitPercent(rowId, field, "spend");
  };

  const commitCampaignPercent = (rowId: string, field: CampaignPercentField) => {
    tryCommitPercent(rowId, field, "campaign");
  };

  const commitCurrencyField = (rowId: string, field: ConstraintValueField) => {
    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const raw = row.values[field].trim();
      const formatted = raw
        ? raw.startsWith("$")
          ? raw
          : formatCurrency(parseCurrency(raw)) || raw
        : "";

      return {
        ...current,
        [rowId]: {
          ...row,
          overridden: { ...row.overridden, [field]: true },
          values: {
            ...row.values,
            [field]: formatted,
          },
        },
      };
    });
  };

  const historicHint = useMemo(
    () =>
      "Prefilled from last 30 days of performance. Edit any value to set your own split.",
    [],
  );

  return (
    <div className="flex min-h-full flex-col gap-4 py-4">
      {isRuleBased && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Rule-based mode — only floor and ceiling constraints apply. Other
          constraint types are used with Ally AI only (FR-015).
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by budget category level"
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Add Filters
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-brand-600">
            <Eye className="size-4" />
            View historical data
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <Switch
            checked={showCampaignConstraints}
            onCheckedChange={setShowCampaignConstraints}
          />
          <span>Set campaign constraints</span>
          <CircleHelp className="size-4 text-slate-400" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table
          className="w-full table-fixed border-collapse text-sm"
          style={{
            minWidth:
              SCOPE_COL_WIDTH +
              DATA_COL_WIDTH * 2 +
              DATA_COL_WIDTH * (SPEND_CONSTRAINT_COL_COUNT - 1) +
              SPEND_TOTAL_COL_WIDTH +
              (showCampaignConstraints
                ? DATA_COL_WIDTH * CAMPAIGN_CONSTRAINT_COL_COUNT
                : 0),
          }}
        >
          <ConstraintDataColgroup
            showCampaignConstraints={showCampaignConstraints}
          />
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <th
                rowSpan={3}
                className={cn(
                  scopeStickyHeaderClass,
                  "px-4 py-3 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
                )}
              >
                <InfoLabel label="Scope" />
              </th>
              <th
                rowSpan={3}
                className={cn(
                  dataColClass,
                  "border-r border-slate-200 py-3 text-center font-medium",
                )}
              >
                <InfoLabel label="Goal" />
              </th>
              <th
                rowSpan={3}
                className={cn(
                  dataColClass,
                  "border-r border-slate-200 py-3 text-center font-medium",
                )}
              >
                <InfoLabel label="Goal Value" />
              </th>
              <th
                colSpan={SPEND_CONSTRAINT_COL_COUNT}
                className="border-b border-slate-200 px-4 py-2 text-center font-medium"
              >
                Spend Constraints (Optional)
              </th>
              {showCampaignConstraints && (
                <th
                  colSpan={CAMPAIGN_CONSTRAINT_COL_COUNT}
                  className="border-b border-l border-slate-200 px-4 py-2 text-center font-medium"
                >
                  <InfoLabel label="Campaign Constraints" />
                </th>
              )}
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
              <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center")}>
                Generic
              </th>
              <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center")}>
                Client Branded
              </th>
              <th
                colSpan={2}
                className="border-r border-slate-200 px-2 py-2 text-center"
              >
                Competitor Branded
              </th>
              <th
                rowSpan={2}
                className={cn(dataColClass, "border-r border-slate-200 py-2 text-center")}
              >
                Auto
              </th>
              <th
                rowSpan={2}
                className={cn(dataColClass, "border-r border-slate-200 py-2 text-center")}
              >
                Others
              </th>
              <th
                rowSpan={2}
                className={cn(
                  spendTotalColClass,
                  totalColClass,
                  "border-r border-slate-200 py-2",
                  !showCampaignConstraints && "border-r-0",
                )}
              >
                Total
              </th>
              {showCampaignConstraints && (
                <>
                  <th
                    colSpan={4}
                    className="border-r border-l border-slate-200 px-2 py-2 text-center"
                  >
                    <InfoLabel label="Campaign Type" />
                  </th>
                  <th colSpan={2} className="border-r border-slate-200 px-2 py-2 text-center">
                    Bid
                  </th>
                  <th colSpan={2} className="px-2 py-2 text-center">
                    Budget
                  </th>
                </>
              )}
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                Keyword Targeting
              </th>
              <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                Keyword Targeting
              </th>
              <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                Keyword Targeting
              </th>
              <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                Product Targeting
              </th>
              {showCampaignConstraints && (
                <>
                  <th className={cn(dataColClass, "border-r border-l border-slate-200 py-2 text-center font-normal")}>
                    SP
                  </th>
                  <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                    SB
                  </th>
                  <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                    SD
                  </th>
                  <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                    Total
                  </th>
                  <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                    Floor
                  </th>
                  <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                    Ceiling
                  </th>
                  <th className={cn(dataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                    Floor
                  </th>
                  <th className={cn(dataColClass, "py-2 text-center font-normal")}>
                    Ceiling
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {CONSTRAINTS_SCOPE_ROWS.map((row: ConstraintRow) => {
              const state = rowState[row.id];
              const isEditableRow = Boolean(row.indent);

              return (
                <tr
                  key={row.id}
                  className="group border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td
                    className={cn(
                      scopeStickyClass,
                      "overflow-hidden px-4 py-3 font-medium text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex min-w-0 items-center gap-1",
                        row.indent && "pl-6",
                      )}
                      title={row.name}
                    >
                      {!row.indent && (
                        <ChevronDown className="size-4 shrink-0 text-slate-400" />
                      )}
                      <span className="truncate">{row.name}</span>
                    </span>
                  </td>
                  <td className={cn(dataColClass, "border-r border-slate-100 py-3 text-center")}>
                    {row.indent && (
                      <span className="inline-flex items-center justify-center gap-1 text-slate-700">
                        <TrendingUp className="size-4 text-success-500" />
                        ROAS
                      </span>
                    )}
                  </td>
                  <td className={cn(dataColClass, "border-r border-slate-100 p-1 text-center")}>
                    {isEditableRow && state ? (
                      <EditableConstraintCell
                        value={state.values.goalValue}
                        onChange={(value) => updateValue(row.id, "goalValue", value)}
                        onFocus={() =>
                          beginEditSession(row.id, "goalValue", state.values.goalValue)
                        }
                        onBlur={() => commitCurrencyField(row.id, "goalValue")}
                        ariaLabel={`Goal value for ${row.name}`}
                        title={
                          getCellVisualState(state, "goalValue") === "historic"
                            ? historicHint
                            : undefined
                        }
                        className={cellInputVisualClass(state, "goalValue", "text-brand-600")}
                      />
                    ) : null}
                  </td>
                  {SPEND_PERCENT_FIELDS.map((field) => (
                    <td
                      key={field}
                      className={cn(dataColClass, "border-r border-slate-100 p-1 text-center")}
                    >
                      {isEditableRow && state ? (
                        <PercentConstraintCell
                          rowId={row.id}
                          field={field}
                          value={state.values[field]}
                          state={state}
                          onChange={(value) => updateValue(row.id, field, value)}
                          onFocus={() =>
                            beginEditSession(row.id, field, state.values[field])
                          }
                          onBlur={() => commitSpendPercent(row.id, field)}
                          onConfirmPending={confirmPendingWarning}
                          onDismissPending={dismissPendingWarning}
                          pendingWarning={pendingWarning}
                          blockAlert={blockAlert}
                          ariaLabel={`${field} for ${row.name}`}
                          title={
                            getCellVisualState(state, field) === "historic"
                              ? historicHint
                              : getCellVisualState(state, field) === "adjusted"
                                ? "Auto-adjusted to keep the total at 100%"
                                : undefined
                          }
                        />
                      ) : null}
                    </td>
                  ))}
                  <td
                    className={cn(
                      spendTotalColClass,
                      totalColClass,
                      "border-r border-slate-100 py-3 font-medium text-slate-700",
                      !showCampaignConstraints && "border-r-0",
                    )}
                  >
                    {isEditableRow ? SPEND_TOTAL_DISPLAY : null}
                  </td>
                  {showCampaignConstraints && (
                    <>
                      {CAMPAIGN_PERCENT_FIELDS.map((field) => (
                        <td
                          key={field}
                          className={cn(
                            dataColClass,
                            "border-r border-slate-100 p-1 text-center",
                            field === "campaignSp" && "border-l",
                          )}
                        >
                          {isEditableRow && state ? (
                            <PercentConstraintCell
                              rowId={row.id}
                              field={field}
                              value={state.values[field]}
                              state={state}
                              onChange={(value) => updateValue(row.id, field, value)}
                              onFocus={() =>
                                beginEditSession(row.id, field, state.values[field])
                              }
                              onBlur={() => commitCampaignPercent(row.id, field)}
                              onConfirmPending={confirmPendingWarning}
                              onDismissPending={dismissPendingWarning}
                              pendingWarning={pendingWarning}
                              blockAlert={blockAlert}
                              ariaLabel={`${field} for ${row.name}`}
                              title={
                                getCellVisualState(state, field) === "historic"
                                  ? historicHint
                                  : getCellVisualState(state, field) === "adjusted"
                                    ? "Auto-adjusted to keep the total at 100%"
                                    : undefined
                              }
                            />
                          ) : null}
                        </td>
                      ))}
                      <td
                        className={cn(
                          dataColClass,
                          totalColClass,
                          "border-r border-slate-100 py-3 font-medium text-slate-700",
                        )}
                      >
                        {isEditableRow ? SPEND_TOTAL_DISPLAY : null}
                      </td>
                      {(
                        [
                          "bidFloor",
                          "bidCeiling",
                          "budgetFloor",
                          "budgetCeiling",
                        ] as const
                      ).map((field) => (
                        <td
                          key={field}
                          className={cn(
                            dataColClass,
                            "border-r border-slate-100 p-1 text-center",
                            field === "budgetCeiling" && "border-r-0",
                          )}
                        >
                          {isEditableRow && state ? (
                            <EditableConstraintCell
                              value={state.values[field]}
                              onChange={(value) => updateValue(row.id, field, value)}
                              onFocus={() =>
                                beginEditSession(row.id, field, state.values[field])
                              }
                              onBlur={() => commitCurrencyField(row.id, field)}
                              ariaLabel={`${field} for ${row.name}`}
                              title={
                                getCellVisualState(state, field) === "historic"
                                  ? historicHint
                                  : undefined
                              }
                              className={cellInputVisualClass(state, field)}
                            />
                          ) : null}
                        </td>
                      ))}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!historicHintDismissed && (
        <div className="sticky bottom-0 z-20 mt-auto shrink-0 -mx-2 border-t border-slate-200 bg-slate-50/95 px-4 py-3 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <History className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <p className="flex-1 pr-2">
              Gray italic values are based on your{" "}
              <span className="font-medium text-slate-700">last 30 days</span> of
              spend distribution. Edit any cell to override it — the remaining
              columns will rebalance so the total always stays at{" "}
              <span className="font-medium text-slate-700">100%</span> of the
              budget you set in the previous step.
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
