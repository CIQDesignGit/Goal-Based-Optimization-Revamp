"use client";

import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CircleHelp,
  Eye,
  EyeOff,
  History,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";

import { useSetupContext } from "@/components/gbo-optimization/setup-context";
import {
  ChangedCellTooltip,
  type CellVisualState,
} from "@/components/gbo-optimization/changed-cell-tooltip";
import { InfoLabel } from "@/components/gbo-optimization/info-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CAMPAIGN_PERCENT_FIELDS,
  formatPercentNumber,
  formatPercentTotalDisplay,
  isPercentGroupBlocked,
  isPercentGroupValid,
  MAX_PERCENT_VALUE,
  parsePercent,
  PERCENT_DEVIATION_THRESHOLD,
  rebalancePercentGroup,
  SPEND_PERCENT_FIELDS,
  sumPercentFields,
  type CampaignPercentField,
  type PercentField,
  type PercentValidationIssue,
  type SpendPercentField,
} from "@/lib/gbo-optimization/constraint-distribution";
import {
  CONSTRAINTS_SCOPE_ROWS,
  ENTIRE_BUSINESS_SCOPE_ID,
  type ConstraintRow,
} from "@/lib/gbo-optimization/setup-data";
import {
  TAXONOMY_LEVEL1_COL_WIDTH,
  TAXONOMY_LEVEL2_COL_WIDTH,
  TaxonomyScopeCells,
  TaxonomyScopeHeader,
  shouldShowTaxonomyLevel1Label,
  useSortedTaxonomyRows,
  useTaxonomyScopeLevels,
} from "@/components/gbo-optimization/taxonomy-scope-columns";
import {
  getMidMonthConstraintInlineHint,
  shouldWarnMidMonthConstraintTiming,
} from "@/lib/gbo-optimization/mid-month-timing";
import {
  getLatestCellChange,
  recordConstraintFieldChange,
  useSetupSessionStore,
  type ConstraintRowState,
  type ConstraintValueField,
  type ConstraintValues,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const SPEND_CONSTRAINT_COL_COUNT = 7;
const CAMPAIGN_CONSTRAINT_COL_COUNT = 8;
const CAMPAIGN_TOTAL_COL_INDEX = 3;
const RULE_BASED_FLOOR_CEILING_COL_COUNT = 4;
const FLOOR_CEILING_FIELDS = [
  "bidFloor",
  "bidCeiling",
  "budgetFloor",
  "budgetCeiling",
] as const;
const SCOPE_COL_WIDTH =
  TAXONOMY_LEVEL1_COL_WIDTH + TAXONOMY_LEVEL2_COL_WIDTH;
const DATA_COL_WIDTH = 100;
const HISTORY_DATA_COL_WIDTH = 128;
const SPEND_TOTAL_COL_WIDTH = 132;
const PERCENT_TOTAL_TARGET = 100;

const dataColClass = "w-[100px] min-w-[100px] max-w-[100px] px-2";
const dataColClassExpanded =
  "w-[128px] min-w-[128px] max-w-[128px] px-2";
const spendTotalColClass =
  "w-[132px] min-w-[132px] max-w-[132px] px-2 whitespace-nowrap";
const totalColClass = "text-right";
const cellInputClass =
  "h-8 w-full min-w-0 px-1 text-center text-sm tabular-nums shadow-none border border-transparent hover:border-slate-200 focus-visible:border-brand-300 focus-visible:bg-white";

/** Select numeric portion on focus — keeps ~ / $ prefixes and % suffix out of selection. */
function selectEditablePortion(input: HTMLInputElement) {
  const { value } = input;
  let start = 0;
  if (value.startsWith("~")) start += 1;
  if (value.charAt(start) === "$") start += 1;
  const end = value.endsWith("%")
    ? Math.max(start, value.length - 1)
    : value.length;

  if (end > start) {
    input.setSelectionRange(start, end);
  } else if (value.length > 0) {
    input.select();
  }
}

/** Prefilled / historic values are approximate — show "~" in front (not stored in state). */
function withApproxPrefix(value: string): string {
  const cleaned = value.trim();
  if (!cleaned || cleaned === "—" || cleaned.startsWith("~")) return cleaned;
  return `~${cleaned}`;
}

function stripApproxPrefix(value: string): string {
  const trimmed = value.trimStart();
  return trimmed.startsWith("~") ? trimmed.slice(1) : value;
}

function formatConstraintInputDisplay(
  value: string,
  visual: CellVisualState,
): string {
  return visual === "historic" ? withApproxPrefix(value) : value;
}

function handleConstraintInputFocus(
  event: FocusEvent<HTMLInputElement>,
  onFocus?: () => void,
) {
  onFocus?.();
  const input = event.currentTarget;
  requestAnimationFrame(() => {
    selectEditablePortion(input);
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

/** Renders alert content fixed below the cell — no row height change, no scroll clipping. */
function FloatingCellAlert({
  anchorRef,
  active,
  children,
  className,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      setStyle(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 240),
        width: "max-content",
        maxWidth: 320,
        zIndex: 50,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [active, anchorRef]);

  if (!active || !style || typeof document === "undefined") return null;

  return createPortal(
    <div role="alert" className={className} style={style}>
      {children}
    </div>,
    document.body,
  );
}

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
  previousValue: string;
};

/** Soft ±15% guidance — shown after commit; does not block Next. */
type SoftDeviationAlert = {
  rowId: string;
  field: PercentField;
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

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[~$,\s]/g, "");
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

function isPercentField(field: ConstraintValueField): field is PercentField {
  return (
    SPEND_PERCENT_FIELDS.includes(field as SpendPercentField) ||
    CAMPAIGN_PERCENT_FIELDS.includes(field as CampaignPercentField)
  );
}

function normalizeCurrencyDisplay(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  return formatCurrency(parseCurrency(raw));
}

function fieldMatchesHistoric(
  state: ConstraintRowState,
  field: ConstraintValueField,
): boolean {
  if (isPercentField(field)) {
    return parsePercent(state.values[field]) === state.historicPercents[field];
  }

  return (
    normalizeCurrencyDisplay(state.values[field]) ===
    normalizeCurrencyDisplay(state.historicValues[field])
  );
}

function rowHasManualEditsOnOtherFields(
  state: ConstraintRowState,
  excludeField: ConstraintValueField,
): boolean {
  for (const field of Object.keys(state.overridden) as ConstraintValueField[]) {
    if (field === excludeField || !state.overridden[field]) continue;
    if (!fieldMatchesHistoric(state, field)) return true;
  }

  return false;
}

function getCellVisualState(
  state: ConstraintRowState,
  field: ConstraintValueField,
): CellVisualState {
  if (state.overridden[field]) {
    return "edited";
  }

  if (state.adjusted[field]) {
    return "adjusted";
  }

  const matchesHistoric = fieldMatchesHistoric(state, field);

  if (!matchesHistoric && rowHasManualEditsOnOtherFields(state, field)) {
    return "adjusted";
  }

  if (!matchesHistoric) {
    return "edited";
  }

  return "historic";
}

function getConstraintCellDiff(
  scopeId: string,
  field: ConstraintValueField,
  historicFrom: string,
  currentTo: string,
): { from: string; to: string } {
  const entry = getLatestCellChange(scopeId, field);

  if (entry) {
    return { from: entry.from, to: entry.to };
  }

  return { from: historicFrom, to: currentTo };
}

function buildConstraintCellTooltipProps(
  rowId: string,
  field: ConstraintValueField,
  state: ConstraintRowState,
) {
  const historicFrom = isPercentField(field)
    ? formatPercentNumber(state.historicPercents[field])
    : state.historicValues[field];

  const diff = getConstraintCellDiff(
    rowId,
    field,
    historicFrom,
    state.values[field],
  );

  return {
    cellVisual: getCellVisualState(state, field),
    diffFrom: diff.from,
    diffTo: diff.to,
  };
}

function percentTotalClassName(
  values: ConstraintValues,
  fields: readonly PercentField[],
  state?: ConstraintRowState,
): string {
  const sum = Math.round(sumPercentFields(values, fields));
  const blocked =
    state &&
    isPercentGroupBlocked(
      values,
      fields,
      state.historicPercents,
      state.overridden,
    );

  return cn(
    "font-medium",
    sum === PERCENT_TOTAL_TARGET && !blocked
      ? "text-slate-700"
      : "text-destructive",
  );
}

function getHistoricPercentDeviation(
  state: ConstraintRowState,
  field: PercentField,
): number {
  return Math.abs(
    parsePercent(state.values[field]) - state.historicPercents[field],
  );
}

/** User-edited percent more than ±15 points from historical — soft warning (not blocking). */
function isHistoricDeviationWarning(
  state: ConstraintRowState,
  field: ConstraintValueField,
): boolean {
  if (!isPercentField(field) || !state.overridden[field]) return false;
  if (fieldMatchesHistoric(state, field)) return false;
  return getHistoricPercentDeviation(state, field) > PERCENT_DEVIATION_THRESHOLD;
}

function historicDeviationWarningMessage(historicPercent: number): string {
  return `Stay within ±${PERCENT_DEVIATION_THRESHOLD}% of historical (${withApproxPrefix(formatPercentNumber(historicPercent))})`;
}

function cellInputVisualClass(
  state: ConstraintRowState,
  field: ConstraintValueField,
  extra?: string,
): string {
  const visual = getCellVisualState(state, field);

  // Edited vs historical: blue within ±15%, soft red beyond (warning only — does not block Next).
  const editedDeviationClass =
    visual === "edited" && isPercentField(field)
      ? isHistoricDeviationWarning(state, field)
        ? "bg-error-50 font-medium !text-destructive"
        : "bg-sky-50/60 font-medium !text-sky-700"
      : visual === "edited"
        ? "bg-white font-medium !text-brand-600"
        : null;

  return cn(
    cellInputClass,
    visual === "historic" &&
      "bg-slate-50 text-slate-400 italic placeholder:text-slate-300",
    visual === "adjusted" && "bg-sky-50/60 text-slate-600",
    editedDeviationClass,
    extra,
  );
}

function getHistoricDisplayValue(
  state: ConstraintRowState,
  field: ConstraintValueField,
): string {
  if (isPercentField(field)) {
    return withApproxPrefix(formatPercentNumber(state.historicPercents[field]));
  }

  const historic = state.historicValues[field].trim();
  return historic ? withApproxPrefix(historic) : "—";
}

function HistoricValueLabel({ value }: { value: string }) {
  return (
    <span
      className="shrink-0 text-[0.65rem] leading-none text-slate-400 tabular-nums"
      aria-hidden
    >
      {value}
    </span>
  );
}

function ConstraintCellValueRow({
  showHistoricalData,
  historicDisplay,
  children,
}: {
  showHistoricalData?: boolean;
  historicDisplay?: string;
  children: ReactNode;
}) {
  const showHistoric =
    showHistoricalData && historicDisplay && historicDisplay !== "—";

  if (!showHistoric) {
    return (
      <div className="flex items-center justify-center">{children}</div>
    );
  }

  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5">
      <div className="min-w-0 shrink">{children}</div>
      <HistoricValueLabel value={historicDisplay} />
    </div>
  );
}

function ConstraintDataColgroup({
  isRuleBased,
  showCampaignConstraints,
  showHistoricalData,
}: {
  isRuleBased: boolean;
  showCampaignConstraints: boolean;
  showHistoricalData: boolean;
}) {
  const dataWidth = showHistoricalData
    ? HISTORY_DATA_COL_WIDTH
    : DATA_COL_WIDTH;

  return (
    <colgroup>
      <col style={{ width: TAXONOMY_LEVEL1_COL_WIDTH }} />
      <col style={{ width: TAXONOMY_LEVEL2_COL_WIDTH }} />
      <col style={{ width: dataWidth }} />
      {!isRuleBased &&
        Array.from({ length: SPEND_CONSTRAINT_COL_COUNT }).map((_, index) => (
          <col
            key={`spend-${index}`}
            style={{
              width:
                index === SPEND_CONSTRAINT_COL_COUNT - 1
                  ? SPEND_TOTAL_COL_WIDTH
                  : dataWidth,
            }}
          />
        ))}
      {showCampaignConstraints && !isRuleBased &&
        Array.from({ length: CAMPAIGN_CONSTRAINT_COL_COUNT }).map((_, index) => (
          <col
            key={`campaign-${index}`}
            style={{
              width:
                index === CAMPAIGN_TOTAL_COL_INDEX
                  ? SPEND_TOTAL_COL_WIDTH
                  : dataWidth,
            }}
          />
        ))}
      {showCampaignConstraints && isRuleBased &&
        Array.from({ length: RULE_BASED_FLOOR_CEILING_COL_COUNT }).map(
          (_, index) => (
            <col key={`floor-ceiling-${index}`} style={{ width: dataWidth }} />
          ),
        )}
    </colgroup>
  );
}

type PercentConstraintCellProps = {
  rowId: string;
  field: PercentField;
  value: string;
  state: ConstraintRowState;
  ariaLabel: string;
  cellVisual: CellVisualState;
  diffFrom: string;
  diffTo: string;
  showHistoricalData?: boolean;
  historicDisplay?: string;
  pendingWarning: PendingPercentWarning | null;
  blockAlert: InlineBlockAlert | null;
  softDeviationAlert: SoftDeviationAlert | null;
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
  cellVisual,
  diffFrom,
  diffTo,
  showHistoricalData = false,
  historicDisplay,
  pendingWarning,
  blockAlert,
  softDeviationAlert,
  onChange,
  onFocus,
  onBlur,
  onConfirmPending,
  onDismissPending,
}: PercentConstraintCellProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const showConfirm =
    pendingWarning?.rowId === rowId && pendingWarning.field === field;
  const showBlock = blockAlert?.rowId === rowId && blockAlert.field === field;
  const showSoftDeviation =
    softDeviationAlert?.rowId === rowId && softDeviationAlert.field === field;

  return (
    <div
      ref={anchorRef}
      className={cn(
        "py-0.5",
        showConfirm && "rounded-lg ring-2 ring-amber-300/80",
        showBlock && !showConfirm && "rounded-lg ring-2 ring-destructive/40",
      )}
      data-constraint-cell={`${rowId}:${field}`}
    >
      <ConstraintCellValueRow
        showHistoricalData={showHistoricalData}
        historicDisplay={historicDisplay}
      >
        <ChangedCellTooltip
          visual={cellVisual}
          from={diffFrom}
          to={diffTo}
        >
          <Input
            value={formatConstraintInputDisplay(value, cellVisual)}
            onChange={(event) =>
              onChange(stripApproxPrefix(event.target.value))
            }
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
            aria-invalid={showBlock && !showConfirm}
            className={cn(
              cellInputVisualClass(state, field),
              showHistoricalData &&
                historicDisplay &&
                historicDisplay !== "—" &&
                "max-w-[58px] px-0.5",
              showConfirm &&
                "!border-amber-400 bg-amber-50/50 !ring-2 !ring-amber-200 hover:!border-amber-400 hover:bg-amber-50/50 focus-visible:!border-amber-500 focus-visible:!ring-amber-200 focus-visible:bg-white",
              showBlock &&
                !showConfirm &&
                "!border-destructive bg-error-50 !ring-2 !ring-destructive/25 hover:!border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/25",
            )}
          />
        </ChangedCellTooltip>
      </ConstraintCellValueRow>
      {showConfirm && pendingWarning && (
        <FloatingCellAlert
          anchorRef={anchorRef}
          active
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          <p className="whitespace-nowrap text-sm leading-snug text-slate-600">
            Far from{" "}
            <span className="font-medium text-slate-700">
              {pendingWarning.previousValue || "0%"}
            </span>
          </p>
          <div className="flex items-center gap-3 text-sm">
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
        </FloatingCellAlert>
      )}
      {showBlock && blockAlert && !showConfirm && (
        <FloatingCellAlert
          anchorRef={anchorRef}
          active
          className="rounded-lg border border-destructive/30 bg-white p-3 text-left text-sm leading-snug text-destructive shadow-lg"
        >
          {blockAlert.message}
        </FloatingCellAlert>
      )}
      {/* Soft guidance only — does not block Next */}
      {showSoftDeviation && softDeviationAlert && !showConfirm && !showBlock && (
        <FloatingCellAlert
          anchorRef={anchorRef}
          active
          className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm leading-snug text-slate-700 shadow-lg"
        >
          {softDeviationAlert.message}
        </FloatingCellAlert>
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
  cellVisual: CellVisualState;
  diffFrom: string;
  diffTo: string;
  showHistoricalData?: boolean;
  historicDisplay?: string;
};

function EditableConstraintCell({
  value,
  onChange,
  onFocus,
  onBlur,
  ariaLabel,
  className,
  cellVisual,
  diffFrom,
  diffTo,
  showHistoricalData = false,
  historicDisplay,
}: EditableConstraintCellProps) {
  return (
    <ConstraintCellValueRow
      showHistoricalData={showHistoricalData}
      historicDisplay={historicDisplay}
    >
      <ChangedCellTooltip
        visual={cellVisual}
        from={diffFrom}
        to={diffTo}
      >
        <Input
          value={formatConstraintInputDisplay(value, cellVisual)}
          onChange={(event) =>
            onChange(stripApproxPrefix(event.target.value))
          }
          onFocus={(event) => handleConstraintInputFocus(event, onFocus)}
          onClick={(event) => selectEditablePortion(event.currentTarget)}
          onKeyDown={(event) => handleConstraintInputKeyDown(event)}
          onBlur={onBlur}
          aria-label={ariaLabel}
          className={cn(
            className,
            showHistoricalData &&
              historicDisplay &&
              historicDisplay !== "—" &&
              "max-w-[58px] px-0.5",
          )}
        />
      </ChangedCellTooltip>
    </ConstraintCellValueRow>
  );
}

export function ConstraintsStep() {
  const { optimizerType, setConstraintsStepValid } = useSetupContext();
  const isRuleBased = optimizerType === "rule-based";
  const [showCampaignConstraints, setShowCampaignConstraints] = useState(false);
  const rowState = useSetupSessionStore((state) => state.constraintsRowState);
  const setRowState = useSetupSessionStore(
    (state) => state.setConstraintsRowState,
  );
  const editSessionsRef = useRef<Record<string, string>>({});
  const [pendingWarning, setPendingWarning] =
    useState<PendingPercentWarning | null>(null);
  const [blockAlert, setBlockAlert] = useState<InlineBlockAlert | null>(null);
  const [softDeviationAlert, setSoftDeviationAlert] =
    useState<SoftDeviationAlert | null>(null);
  const [historicHintDismissed, setHistoricHintDismissed] = useState(false);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [constraintMidMonthActivity, setConstraintMidMonthActivity] =
    useState(false);

  // Soft ±15% tip dismisses on the next click/tap outside (does not block Next).
  useEffect(() => {
    if (!softDeviationAlert) {
      return;
    }

    const dismiss = () => {
      setSoftDeviationAlert(null);
    };

    // Wait until after the blur/commit that opened the tip, so that same click
    // does not immediately close it.
    const timerId = window.setTimeout(() => {
      document.addEventListener("pointerdown", dismiss, true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("pointerdown", dismiss, true);
    };
  }, [softDeviationAlert]);

  const markMidMonthConstraintActivity = () => {
    if (shouldWarnMidMonthConstraintTiming()) {
      setConstraintMidMonthActivity(true);
    }
  };

  const showMidMonthWarning =
    shouldWarnMidMonthConstraintTiming() && constraintMidMonthActivity;

  const constraintsStepValid = useMemo(() => {
    if (pendingWarning || blockAlert) return false;

    return CONSTRAINTS_SCOPE_ROWS.filter((row) => row.indent).every((row) => {
      const state = rowState[row.id];
      if (!state) return true;

      if (!isRuleBased) {
        if (
          isPercentGroupBlocked(
            state.values,
            SPEND_PERCENT_FIELDS,
            state.historicPercents,
            state.overridden,
          )
        ) {
          return false;
        }

        if (!isPercentGroupValid(state.values, SPEND_PERCENT_FIELDS)) {
          return false;
        }
      }

      if (showCampaignConstraints && !isRuleBased) {
        if (
          isPercentGroupBlocked(
            state.values,
            CAMPAIGN_PERCENT_FIELDS,
            state.historicPercents,
            state.overridden,
          )
        ) {
          return false;
        }

        if (!isPercentGroupValid(state.values, CAMPAIGN_PERCENT_FIELDS)) {
          return false;
        }
      }

      return true;
    });
  }, [rowState, showCampaignConstraints, pendingWarning, blockAlert, isRuleBased]);

  useEffect(() => {
    setConstraintsStepValid(constraintsStepValid);
    return () => setConstraintsStepValid(true);
  }, [constraintsStepValid, setConstraintsStepValid]);

  const applyPercentGroupRebalance = (
    rowId: string,
    field: PercentField,
    group: PercentGroup,
    rawValue: string,
  ) => {
    const fields =
      group === "spend" ? SPEND_PERCENT_FIELDS : CAMPAIGN_PERCENT_FIELDS;

    setRowState((current) => {
      const row = current[rowId];
      if (!row) return current;

      const result = rebalancePercentGroup(fields, row, field, rawValue);

      return {
        ...current,
        [rowId]: {
          ...row,
          values: {
            ...row.values,
            ...result.values,
          },
          overridden: result.overridden,
          adjusted: result.adjusted,
        },
      };
    });
  };

  const updatePercentValue = (
    rowId: string,
    field: PercentField,
    group: PercentGroup,
    value: string,
  ) => {
    applyPercentGroupRebalance(rowId, field, group, value);
  };

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
    if (!isPercentField(field)) {
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
      return;
    }

    const group: PercentGroup = SPEND_PERCENT_FIELDS.includes(
      field as SpendPercentField,
    )
      ? "spend"
      : "campaign";
    applyPercentGroupRebalance(rowId, field, group, previousValue);
  };

  /** Commit a percent edit, rebalance unlocked defaults, and track session changes. */
  const applyPercentCommit = (
    rowId: string,
    field: PercentField,
    group: PercentGroup,
    editedValue: number,
  ) => {
    const row = rowState[rowId];
    const formattedValue = formatPercentNumber(editedValue);

    if (row && editedValue !== row.historicPercents[field]) {
      markMidMonthConstraintActivity();
      recordConstraintFieldChange(
        rowId,
        field,
        formatPercentNumber(row.historicPercents[field]),
        formattedValue,
      );
    }

    applyPercentGroupRebalance(rowId, field, group, formattedValue);
  };

  const beginEditSession = (
    rowId: string,
    field: ConstraintValueField,
    previousValue: string,
  ) => {
    if (
      pendingWarning &&
      (pendingWarning.rowId !== rowId || pendingWarning.field !== field)
    ) {
      applyPercentCommit(
        pendingWarning.rowId,
        pendingWarning.field,
        pendingWarning.group,
        pendingWarning.proposedValue,
      );
      setPendingWarning(null);
    }

    if (
      blockAlert &&
      (blockAlert.rowId !== rowId || blockAlert.field !== field)
    ) {
      setBlockAlert(null);
    }

    if (
      softDeviationAlert &&
      (softDeviationAlert.rowId !== rowId || softDeviationAlert.field !== field)
    ) {
      setSoftDeviationAlert(null);
    }

    const sessionPrevious =
      blockAlert?.rowId === rowId && blockAlert.field === field
        ? blockAlert.previousValue
        : previousValue;
    editSessionsRef.current[editSessionKey(rowId, field)] = sessionPrevious;
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
    const rawValue = row.values[field].trim();

    if (!rawValue) {
      restoreFieldValue(rowId, field, previousValue);
      setPendingWarning(null);
      setBlockAlert(null);
      delete editSessionsRef.current[editSessionKey(rowId, field)];
      return;
    }

    const parsed = Number.parseFloat(rawValue.replace(/%/g, ""));
    if (Number.isNaN(parsed)) {
      restoreFieldValue(rowId, field, previousValue);
      setPendingWarning(null);
      setBlockAlert(null);
      delete editSessionsRef.current[editSessionKey(rowId, field)];
      return;
    }

    if (parsed > MAX_PERCENT_VALUE) {
      setBlockAlert({
        rowId,
        field,
        message: inlineBlockMessage({
          type: "over_max",
          attempted: parsed,
          max: MAX_PERCENT_VALUE,
        }),
        previousValue,
      });
      setPendingWarning(null);
      return;
    }

    if (parsed < 0) {
      setBlockAlert({
        rowId,
        field,
        message: inlineBlockMessage({ type: "under_min", attempted: parsed }),
        previousValue,
      });
      setPendingWarning(null);
      return;
    }

    // Beyond ±15% of historical is a soft warning only — still commit and allow Next.
    applyPercentCommit(rowId, field, group, parsed);
    const historicBaseline = row.historicPercents[field];
    if (Math.abs(parsed - historicBaseline) > PERCENT_DEVIATION_THRESHOLD) {
      setSoftDeviationAlert({
        rowId,
        field,
        message: historicDeviationWarningMessage(historicBaseline),
      });
    } else {
      setSoftDeviationAlert((current) =>
        current?.rowId === rowId && current.field === field ? null : current,
      );
    }
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
    const row = rowState[rowId];
    if (!row) return;

    const raw = row.values[field].trim();
    const formatted = raw
      ? raw.startsWith("$")
        ? raw
        : formatCurrency(parseCurrency(raw)) || raw
      : "";
    const historic = row.historicValues[field];

    if (
      normalizeCurrencyDisplay(historic) !== normalizeCurrencyDisplay(formatted)
    ) {
      markMidMonthConstraintActivity();
      recordConstraintFieldChange(rowId, field, historic, formatted);
    }

    setRowState((current) => {
      const currentRow = current[rowId];
      if (!currentRow) return current;

      const nextOverridden = { ...currentRow.overridden };
      if (
        normalizeCurrencyDisplay(formatted) ===
        normalizeCurrencyDisplay(currentRow.historicValues[field])
      ) {
        delete nextOverridden[field];
      } else {
        nextOverridden[field] = true;
      }

      return {
        ...current,
        [rowId]: {
          ...currentRow,
          overridden: nextOverridden,
          values: {
            ...currentRow.values,
            [field]: formatted,
          },
        },
      };
    });
  };

  const dataColWidth = showHistoricalData
    ? HISTORY_DATA_COL_WIDTH
    : DATA_COL_WIDTH;
  const activeDataColClass = showHistoricalData
    ? dataColClassExpanded
    : dataColClass;
  const tableMinWidth =
    SCOPE_COL_WIDTH +
    dataColWidth +
    (isRuleBased
      ? 0
      : dataColWidth * (SPEND_CONSTRAINT_COL_COUNT - 1) + SPEND_TOTAL_COL_WIDTH) +
    (showCampaignConstraints && !isRuleBased
      ? dataColWidth * (CAMPAIGN_CONSTRAINT_COL_COUNT - 1) + SPEND_TOTAL_COL_WIDTH
      : 0) +
    (showCampaignConstraints && isRuleBased
      ? dataColWidth * RULE_BASED_FLOOR_CEILING_COL_COUNT
      : 0);
  const scopeHeaderRowSpan = isRuleBased
    ? showCampaignConstraints
      ? 2
      : 1
    : 3;

  const { level1Key, level2Key, level1Label, level2Label } =
    useTaxonomyScopeLevels();
  const sortedConstraintRows = useSortedTaxonomyRows(CONSTRAINTS_SCOPE_ROWS);

  return (
    <div className="flex min-h-full flex-col gap-4 py-4">
      {isRuleBased && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Rule-based mode — only floor and ceiling constraints apply. Other
          constraint types are used with Ally AI only.
        </p>
      )}

      {showMidMonthWarning ? (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-slate-600">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-amber-100">
            <AlertTriangle className="size-3 text-amber-600" />
          </span>
          <span>{getMidMonthConstraintInlineHint()}</span>
        </div>
      ) : null}

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
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5",
              showHistoricalData
                ? "bg-muted text-foreground"
                : "text-brand-600",
            )}
            aria-pressed={showHistoricalData}
            onClick={() => setShowHistoricalData((current) => !current)}
          >
            {showHistoricalData ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {showHistoricalData
              ? "Hide historical data"
              : "View historical data"}
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <Switch
            checked={showCampaignConstraints}
            onCheckedChange={(checked) => {
              if (checked === true) {
                markMidMonthConstraintActivity();
              }
              setShowCampaignConstraints(checked === true);
            }}
          />
          <span>
            {isRuleBased
              ? "Set floor and ceiling limits"
              : "Set campaign constraints"}
          </span>
          <CircleHelp className="size-4 text-slate-400" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table
          className="w-full table-fixed border-collapse text-sm"
          style={{ minWidth: tableMinWidth }}
        >
          <ConstraintDataColgroup
            isRuleBased={isRuleBased}
            showCampaignConstraints={showCampaignConstraints}
            showHistoricalData={showHistoricalData}
          />
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
              <TaxonomyScopeHeader
                label={level1Label}
                width={TAXONOMY_LEVEL1_COL_WIDTH}
                left={0}
                sticky
                isLeading
                rowSpan={scopeHeaderRowSpan}
              />
              <TaxonomyScopeHeader
                label={level2Label}
                width={TAXONOMY_LEVEL2_COL_WIDTH}
                left={TAXONOMY_LEVEL1_COL_WIDTH}
                sticky
                rowSpan={scopeHeaderRowSpan}
              />
              <th
                rowSpan={scopeHeaderRowSpan}
                className={cn(
                  activeDataColClass,
                  "border-r border-slate-200 py-3 text-center font-medium",
                  isRuleBased && !showCampaignConstraints && "border-r-0",
                )}
              >
                <InfoLabel label="Goal" />
              </th>
              {!isRuleBased && (
                <th
                  colSpan={SPEND_CONSTRAINT_COL_COUNT}
                  className="border-b border-slate-200 px-4 py-2 text-center font-medium"
                >
                  Spend Constraints (Optional)
                </th>
              )}
              {showCampaignConstraints && !isRuleBased && (
                <th
                  colSpan={CAMPAIGN_CONSTRAINT_COL_COUNT}
                  className="border-b border-l border-slate-200 px-4 py-2 text-center font-medium"
                >
                  <InfoLabel label="Campaign Constraints" />
                </th>
              )}
              {showCampaignConstraints && isRuleBased && (
                <th
                  colSpan={RULE_BASED_FLOOR_CEILING_COL_COUNT}
                  className="border-b border-slate-200 px-4 py-2 text-center font-medium"
                >
                  Floor &amp; Ceiling Limits
                </th>
              )}
            </tr>
            {!isRuleBased && (
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}>
                  Generic
                </th>
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}>
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
                  className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}
                >
                  Auto
                </th>
                <th
                  rowSpan={2}
                  className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}
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
            )}
            {isRuleBased && showCampaignConstraints && (
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}>
                  Bid Floor
                </th>
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}>
                  Bid Ceiling
                </th>
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center")}>
                  Budget Floor
                </th>
                <th className={cn(activeDataColClass, "border-r-0 py-2 text-center")}>
                  Budget Ceiling
                </th>
              </tr>
            )}
            {!isRuleBased && (
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                  Keyword Targeting
                </th>
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                  Keyword Targeting
                </th>
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                  Keyword Targeting
                </th>
                <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                  Product Targeting
                </th>
                {showCampaignConstraints && (
                  <>
                    <th className={cn(activeDataColClass, "border-r border-l border-slate-200 py-2 text-center font-normal")}>
                      SP
                    </th>
                    <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                      SB
                    </th>
                    <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                      SD
                    </th>
                    <th
                      className={cn(
                        spendTotalColClass,
                        totalColClass,
                        "border-r border-slate-200 py-2 text-center font-normal",
                      )}
                    >
                      Total
                    </th>
                    <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                      Floor
                    </th>
                    <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                      Ceiling
                    </th>
                    <th className={cn(activeDataColClass, "border-r border-slate-200 py-2 text-center font-normal")}>
                      Floor
                    </th>
                    <th className={cn(activeDataColClass, "py-2 text-center font-normal")}>
                      Ceiling
                    </th>
                  </>
                )}
              </tr>
            )}
          </thead>
          <tbody>
            {sortedConstraintRows.map((row: ConstraintRow, rowIndex) => {
              const state = rowState[row.id];
              const isEditableRow = row.id !== ENTIRE_BUSINESS_SCOPE_ID;
              const showLevel1Label = shouldShowTaxonomyLevel1Label(
                sortedConstraintRows,
                rowIndex,
                level1Key,
              );

              return (
                <tr
                  key={row.id}
                  className="group border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <TaxonomyScopeCells
                    row={row}
                    level1Key={level1Key}
                    level2Key={level2Key}
                    showLevel1Label={showLevel1Label}
                    sticky
                  />
                  <td className={cn(activeDataColClass, "border-r border-slate-100 py-3 text-center")}>
                    {isEditableRow && (
                      <span className="inline-flex items-center justify-center gap-1 text-slate-700">
                        <TrendingUp className="size-4 text-success-500" />
                        ROAS
                      </span>
                    )}
                  </td>
                  {!isRuleBased &&
                    SPEND_PERCENT_FIELDS.map((field) => (
                      <td
                        key={field}
                        className={cn(activeDataColClass, "border-r border-slate-100 p-1 text-center")}
                      >
                        {isEditableRow && state ? (
                          <PercentConstraintCell
                            rowId={row.id}
                            field={field}
                            value={state.values[field]}
                            state={state}
                            onChange={(value) =>
                              updatePercentValue(row.id, field, "spend", value)
                            }
                            onFocus={() =>
                              beginEditSession(row.id, field, state.values[field])
                            }
                            onBlur={() => commitSpendPercent(row.id, field)}
                            onConfirmPending={confirmPendingWarning}
                            onDismissPending={dismissPendingWarning}
                            pendingWarning={pendingWarning}
                            blockAlert={blockAlert}
                            softDeviationAlert={softDeviationAlert}
                            ariaLabel={`${field} for ${row.name}`}
                            showHistoricalData={showHistoricalData}
                            historicDisplay={getHistoricDisplayValue(state, field)}
                            {...buildConstraintCellTooltipProps(
                              row.id,
                              field,
                              state,
                            )}
                          />
                        ) : null}
                      </td>
                    ))}
                  {!isRuleBased && (
                    <td
                      className={cn(
                        spendTotalColClass,
                        totalColClass,
                        "border-r border-slate-100 py-3",
                        !showCampaignConstraints && "border-r-0",
                        isEditableRow &&
                          state &&
                          percentTotalClassName(
                            state.values,
                            SPEND_PERCENT_FIELDS,
                            state,
                          ),
                      )}
                    >
                      {isEditableRow && state
                        ? formatPercentTotalDisplay(
                            state.values,
                            SPEND_PERCENT_FIELDS,
                          )
                        : null}
                    </td>
                  )}
                  {showCampaignConstraints && !isRuleBased && (
                    <>
                      {CAMPAIGN_PERCENT_FIELDS.map((field) => (
                        <td
                          key={field}
                          className={cn(
                            activeDataColClass,
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
                              onChange={(value) =>
                                updatePercentValue(row.id, field, "campaign", value)
                              }
                              onFocus={() =>
                                beginEditSession(row.id, field, state.values[field])
                              }
                              onBlur={() => commitCampaignPercent(row.id, field)}
                              onConfirmPending={confirmPendingWarning}
                              onDismissPending={dismissPendingWarning}
                              pendingWarning={pendingWarning}
                              blockAlert={blockAlert}
                              softDeviationAlert={softDeviationAlert}
                              ariaLabel={`${field} for ${row.name}`}
                              showHistoricalData={showHistoricalData}
                              historicDisplay={getHistoricDisplayValue(state, field)}
                              {...buildConstraintCellTooltipProps(
                                row.id,
                                field,
                                state,
                              )}
                            />
                          ) : null}
                        </td>
                      ))}
                      <td
                        className={cn(
                          spendTotalColClass,
                          totalColClass,
                          "border-r border-slate-100 py-3",
                          isEditableRow &&
                            state &&
                            percentTotalClassName(
                              state.values,
                              CAMPAIGN_PERCENT_FIELDS,
                              state,
                            ),
                        )}
                      >
                        {isEditableRow && state
                          ? formatPercentTotalDisplay(
                              state.values,
                              CAMPAIGN_PERCENT_FIELDS,
                            )
                          : null}
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
                            activeDataColClass,
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
                              className={cellInputVisualClass(state, field)}
                              showHistoricalData={showHistoricalData}
                              historicDisplay={getHistoricDisplayValue(state, field)}
                              {...buildConstraintCellTooltipProps(
                                row.id,
                                field,
                                state,
                              )}
                            />
                          ) : null}
                        </td>
                      ))}
                    </>
                  )}
                  {showCampaignConstraints &&
                    isRuleBased &&
                    FLOOR_CEILING_FIELDS.map((field) => (
                      <td
                        key={field}
                        className={cn(
                          activeDataColClass,
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
                            className={cellInputVisualClass(state, field)}
                            showHistoricalData={showHistoricalData}
                            historicDisplay={getHistoricDisplayValue(state, field)}
                            {...buildConstraintCellTooltipProps(
                              row.id,
                              field,
                              state,
                            )}
                          />
                        ) : null}
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!historicHintDismissed && !isRuleBased && (
        <div className="sticky bottom-0 z-20 mt-auto shrink-0 -mx-2 border-t border-slate-200 bg-slate-50/95 px-4 py-3 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <History className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <p className="flex-1 pr-2">
              Default values with a{" "}
              <span className="font-medium text-slate-700">~</span> are
              approximate, based on your{" "}
              <span className="font-medium text-slate-700">last 30 days</span> of
              spend.{" "}
              <span className="font-medium text-slate-700">
                Values you enter stick
              </span>
              ; other cells follow historical spend on a best-effort basis and
              rebalance automatically to keep the total at{" "}
              <span className="font-medium text-slate-700">100%</span>. Edits
              within{" "}
              <span className="font-medium text-sky-700">±15%</span> of
              historical show in blue; beyond that shows in{" "}
              <span className="font-medium text-destructive">red</span> as a
              warning (you can still continue).
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
