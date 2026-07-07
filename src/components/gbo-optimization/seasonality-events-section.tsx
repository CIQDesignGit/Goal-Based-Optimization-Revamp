"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Plus, X } from "lucide-react";

import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BLANK_SEASONALITY_FORM,
  PREFILLED_HOLIDAY_SEASONALITY_DRAFTS,
  SEASONALITY_SCOPE_OPTIONS,
  suggestedTemplateToDraftForm,
  type SeasonalityDraftFormState,
  type SeasonalityEvent,
  type SuggestedSeasonalityEventTemplate,
} from "@/lib/gbo-optimization/setup-data";
import { getSeasonalityBudgetContextLabel } from "@/lib/gbo-optimization/seasonality-budget-context";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

type BudgetMode = "percent" | "absolute";

type DraftRowKind = "custom" | "prefilled" | "suggestion";

type DraftEventRow = {
  id: string;
  kind: DraftRowKind;
  templateId?: string;
  initialForm: SeasonalityDraftFormState;
  form: SeasonalityDraftFormState;
  isHighlighted: boolean;
  scopeError: boolean;
};

function createPrefilledDraftRow(
  template: (typeof PREFILLED_HOLIDAY_SEASONALITY_DRAFTS)[number],
): DraftEventRow {
  return {
    id: template.id,
    kind: "prefilled",
    templateId: template.id,
    initialForm: { ...template.form },
    form: { ...template.form },
    isHighlighted: false,
    scopeError: false,
  };
}

function createBlankDraftRow(id = crypto.randomUUID()): DraftEventRow {
  return {
    id,
    kind: "custom",
    initialForm: { ...BLANK_SEASONALITY_FORM },
    form: { ...BLANK_SEASONALITY_FORM },
    isHighlighted: false,
    scopeError: false,
  };
}

function createInitialDraftRows(): DraftEventRow[] {
  return [
    createBlankDraftRow("custom"),
    ...PREFILLED_HOLIDAY_SEASONALITY_DRAFTS.map(createPrefilledDraftRow),
  ];
}

const FIELD_LABEL = "text-sm font-semibold leading-5 text-slate-900";
const FIELD_INPUT =
  "h-10 rounded-md border-slate-200 bg-white text-slate-700 shadow-none";
const FIELD_FOOTER = "flex h-5 items-center text-sm";
/** Grid columns: event | start | end | scope | budget (flex) | actions */
const ROW_LAYOUT =
  "grid grid-cols-[minmax(5.5rem,0.65fr)_9.25rem_9.25rem_9rem_minmax(13rem,1fr)_6.75rem] items-start gap-x-3 gap-y-3";
const TABLE_MIN_WIDTH = "min-w-[54rem]";
const COL_DATE_CELL = "min-w-[9.25rem] shrink-0";
const COL_ACTIONS = "flex shrink-0 flex-col gap-1.5";
const DATE_INPUT = cn(
  FIELD_INPUT,
  "min-w-[8.75rem] pl-8 text-sm whitespace-nowrap",
);

function FormFieldCell({
  className,
  footer,
  children,
}: {
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {children}
      <div className={FIELD_FOOTER}>
        {footer ?? <span className="invisible select-none">.</span>}
      </div>
    </div>
  );
}

function SeasonalityEventFormHeader() {
  return (
    <div className={cn(ROW_LAYOUT, "mb-1")}>
      <Label className={FIELD_LABEL}>Event name</Label>
      <Label className={FIELD_LABEL}>Start date</Label>
      <Label className={FIELD_LABEL}>End date</Label>
      <Label className={FIELD_LABEL}>Scope</Label>
      <Label className={FIELD_LABEL}>Budget</Label>
      <div aria-hidden className="h-5" />
    </div>
  );
}

function SeasonalityEventTable({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <div className={TABLE_MIN_WIDTH}>{children}</div>
    </div>
  );
}

function BudgetModeToggle({
  value,
  onChange,
}: {
  value: BudgetMode;
  onChange: (mode: BudgetMode) => void;
}) {
  return (
    <div
      className="inline-flex h-10 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-0.5"
      role="group"
      aria-label="Budget mode"
    >
      <button
        type="button"
        onClick={() => onChange("percent")}
        className={cn(
          "h-full rounded px-2.5 text-xs font-medium transition-colors",
          value === "percent"
            ? "bg-white text-brand-600 shadow-sm"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onChange("absolute")}
        className={cn(
          "h-full rounded px-2.5 text-xs font-medium transition-colors",
          value === "absolute"
            ? "bg-white text-brand-600 shadow-sm"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        Abs
      </button>
    </div>
  );
}

function SeasonalityEventFormRow({
  form,
  scopeError,
  budgetContextLabel,
  onChange,
  onSave,
  onClose,
}: {
  form: SeasonalityDraftFormState;
  scopeError: boolean;
  budgetContextLabel: string;
  onChange: (updates: Partial<SeasonalityDraftFormState>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className={ROW_LAYOUT}>
      <FormFieldCell className="min-w-0">
        <Textarea
          value={form.name}
          onChange={(event) => onChange({ name: event.target.value })}
          rows={1}
          className={cn(
            FIELD_INPUT,
            "field-sizing-content min-h-10 resize-none py-2 leading-snug shadow-none",
          )}
          placeholder=""
          aria-label="Event name"
        />
      </FormFieldCell>

      <FormFieldCell className={COL_DATE_CELL}>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={form.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className={DATE_INPUT}
            placeholder="Jul 01, 2026"
            aria-label="Start date"
          />
        </div>
      </FormFieldCell>

      <FormFieldCell className={COL_DATE_CELL}>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={form.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className={DATE_INPUT}
            placeholder="Jul 01, 2026"
            aria-label="End date"
          />
        </div>
      </FormFieldCell>

      <FormFieldCell
        className="min-w-0"
        footer={
          scopeError ? (
            <span className="text-error-600">Select a scope to save</span>
          ) : undefined
        }
      >
        <SetupInlineSelect
          label="Scope"
          hideLabel
          value={form.scope}
          options={SEASONALITY_SCOPE_OPTIONS}
          placeholder="Select Scope"
          onValueChange={(scope) => onChange({ scope })}
          triggerClassName={cn(
            FIELD_INPUT,
            "border-slate-200 bg-white text-slate-700",
            scopeError && "border-error-500",
          )}
        />
      </FormFieldCell>

      <FormFieldCell className="min-w-0">
        <div className="flex min-w-0 w-full items-start gap-2">
          <BudgetModeToggle
            value={form.budgetMode}
            onChange={(budgetMode) => onChange({ budgetMode })}
          />
          <div className="relative w-20 shrink-0">
            {form.budgetMode === "absolute" && (
              <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm text-slate-500">
                $
              </span>
            )}
            <Input
              value={form.budgetValue}
              onChange={(event) => onChange({ budgetValue: event.target.value })}
              className={cn(
                FIELD_INPUT,
                "text-right text-sm tabular-nums",
                form.budgetMode === "percent" ? "pr-7" : "pl-7",
              )}
              inputMode="decimal"
              aria-label="Budget value"
            />
            {form.budgetMode === "percent" && (
              <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm text-slate-500">
                %
              </span>
            )}
          </div>
          <p className="min-w-0 flex-1 self-center text-sm leading-snug text-slate-500">
            {budgetContextLabel}
          </p>
        </div>
      </FormFieldCell>

      <div className={COL_ACTIONS}>
        <div className="flex h-10 items-center gap-2">
          <Button
            type="button"
            onClick={onSave}
            className="h-10 bg-brand-600 px-5 text-white hover:bg-brand-700"
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
            aria-label="Close event form"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className={FIELD_FOOTER} aria-hidden>
          <span className="invisible select-none">.</span>
        </div>
      </div>
    </div>
  );
}

function CustomEventsSection({
  rows,
  goalsRowState,
  onUpdate,
  onSave,
  onClose,
}: {
  rows: DraftEventRow[];
  goalsRowState: ReturnType<typeof useSetupSessionStore.getState>["goalsRowState"];
  onUpdate: (rowId: string, updates: Partial<SeasonalityDraftFormState>) => void;
  onSave: (rowId: string) => void;
  onClose: (rowId: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <SeasonalityEventTable>
        <SeasonalityEventFormHeader />
        <div className="mt-3 flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(row.isHighlighted && "rounded-md ring-2 ring-brand-500")}
            >
              <SeasonalityEventFormRow
                form={row.form}
                scopeError={row.scopeError}
                budgetContextLabel={getSeasonalityBudgetContextLabel(
                  row.form.startDate,
                  row.form.budgetMode,
                  goalsRowState,
                )}
                onChange={(updates) => onUpdate(row.id, updates)}
                onSave={() => onSave(row.id)}
                onClose={() => onClose(row.id)}
              />
            </div>
          ))}
        </div>
      </SeasonalityEventTable>
    </section>
  );
}

function SuggestedHolidayEventsSection({
  rows,
  goalsRowState,
  onUpdate,
  onSave,
  onClose,
}: {
  rows: DraftEventRow[];
  goalsRowState: ReturnType<typeof useSetupSessionStore.getState>["goalsRowState"];
  onUpdate: (rowId: string, updates: Partial<SeasonalityDraftFormState>) => void;
  onSave: (rowId: string) => void;
  onClose: (rowId: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-slate-200 border-l-2 border-l-brand-200 bg-white p-4">
      <div className="mb-4 space-y-0.5">
        <p className="text-sm font-semibold text-slate-900">Suggested</p>
        <p className="text-sm text-slate-500">
          Holiday events ready to configure. Select scope and budget for each,
          then save to add them to your plan.
        </p>
      </div>

      <SeasonalityEventTable>
        <SeasonalityEventFormHeader />
        <div className="mt-3 flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(row.isHighlighted && "rounded-md ring-2 ring-brand-500")}
            >
              <SeasonalityEventFormRow
                form={row.form}
                scopeError={row.scopeError}
                budgetContextLabel={getSeasonalityBudgetContextLabel(
                  row.form.startDate,
                  row.form.budgetMode,
                  goalsRowState,
                )}
                onChange={(updates) => onUpdate(row.id, updates)}
                onSave={() => onSave(row.id)}
                onClose={() => onClose(row.id)}
              />
            </div>
          ))}
        </div>
      </SeasonalityEventTable>
    </section>
  );
}

type SeasonalityEventsSectionProps = {
  events: SeasonalityEvent[];
  onAddEvent: (event: SeasonalityEvent) => void;
  prefillRequest?: SuggestedSeasonalityEventTemplate | null;
  onPrefillHandled?: () => void;
};

export function SeasonalityEventsSection({
  events,
  onAddEvent,
  prefillRequest,
  onPrefillHandled,
}: SeasonalityEventsSectionProps) {
  const [draftRows, setDraftRows] = useState<DraftEventRow[]>(createInitialDraftRows);
  const goalsRowState = useSetupSessionStore((state) => state.goalsRowState);

  const customRows = draftRows.filter(
    (row) => row.kind === "custom" || row.kind === "suggestion",
  );
  const suggestedRows = draftRows.filter((row) => row.kind === "prefilled");

  useEffect(() => {
    if (!prefillRequest) {
      return;
    }

    const nextForm = suggestedTemplateToDraftForm(prefillRequest);
    let targetRowId: string | null = null;

    setDraftRows((current) => {
      const blankRowIndex = current.findIndex(
        (row) => row.kind === "custom" && !row.form.name.trim(),
      );

      if (blankRowIndex >= 0) {
        targetRowId = current[blankRowIndex].id;
        return current.map((row, index) =>
          index === blankRowIndex
            ? {
                ...row,
                form: nextForm,
                isHighlighted: true,
                scopeError: false,
              }
            : row,
        );
      }

      const newRow: DraftEventRow = {
        id: crypto.randomUUID(),
        kind: "suggestion",
        templateId: prefillRequest.id,
        initialForm: nextForm,
        form: nextForm,
        isHighlighted: true,
        scopeError: false,
      };
      targetRowId = newRow.id;

      return [...current, newRow];
    });

    onPrefillHandled?.();

    const highlightTimer = window.setTimeout(() => {
      if (!targetRowId) {
        return;
      }

      setDraftRows((current) =>
        current.map((row) =>
          row.id === targetRowId ? { ...row, isHighlighted: false } : row,
        ),
      );
    }, 1000);

    return () => window.clearTimeout(highlightTimer);
  }, [prefillRequest, onPrefillHandled]);

  const updateDraftRow = (rowId: string, updates: Partial<SeasonalityDraftFormState>) => {
    setDraftRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              form: { ...row.form, ...updates },
              scopeError: updates.scope ? false : row.scopeError,
            }
          : row,
      ),
    );
  };

  const handleSave = (rowId: string) => {
    const row = draftRows.find((draft) => draft.id === rowId);

    if (!row) {
      return;
    }

    const scope = row.form.scope;
    const hasName = row.form.name.trim().length > 0;

    if (!hasName || !scope) {
      setDraftRows((current) =>
        current.map((draft) =>
          draft.id === rowId
            ? { ...draft, scopeError: !scope && hasName }
            : draft,
        ),
      );
      return;
    }

    onAddEvent({
      id: crypto.randomUUID(),
      name: row.form.name.trim(),
      startDate: row.form.startDate,
      endDate: row.form.endDate,
      scope,
      budgetMode: row.form.budgetMode as BudgetMode,
      budgetValue: row.form.budgetValue,
    });

    setDraftRows((current) => {
      if (row.kind === "custom") {
        return current.map((draft) =>
          draft.id === rowId
            ? {
                ...draft,
                form: { ...BLANK_SEASONALITY_FORM },
                initialForm: { ...BLANK_SEASONALITY_FORM },
                scopeError: false,
                isHighlighted: false,
              }
            : draft,
        );
      }

      return current.filter((draft) => draft.id !== rowId);
    });
  };

  const handleClose = (rowId: string) => {
    const row = draftRows.find((draft) => draft.id === rowId);

    if (!row) {
      return;
    }

    if (row.kind === "suggestion") {
      setDraftRows((current) => current.filter((draft) => draft.id !== rowId));
      return;
    }

    setDraftRows((current) =>
      current.map((draft) =>
        draft.id === rowId
          ? {
              ...draft,
              form: { ...draft.initialForm },
              scopeError: false,
              isHighlighted: false,
            }
          : draft,
      ),
    );
  };

  const handleAddEvent = () => {
    setDraftRows((current) => [...current, createBlankDraftRow()]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <Badge
          variant="secondary"
          className="shrink-0 border border-slate-200 bg-slate-100 font-semibold text-slate-700"
        >
          Seasonality
        </Badge>
        <p className="text-sm text-slate-500">
          Add a custom event or configure the suggested holidays below. Select
          scope and budget, then save each event to add it to your plan.
        </p>
      </div>

      {events.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Saved events
          </p>
          {events.map((event) => {
            const scopeLabel =
              SEASONALITY_SCOPE_OPTIONS.find(
                (option) => option.value === event.scope,
              )?.label ?? event.scope;

            const budgetLabel =
              event.budgetMode === "percent"
                ? `${event.budgetValue}%`
                : `$${event.budgetValue}`;

            return (
              <div
                key={event.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-slate-900">{event.name}</span>
                <span className="text-slate-500">
                  {event.startDate} – {event.endDate}
                </span>
                <span className="text-slate-500">{scopeLabel}</span>
                <span className="text-slate-700">{budgetLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <CustomEventsSection
          rows={customRows}
          goalsRowState={goalsRowState}
          onUpdate={updateDraftRow}
          onSave={handleSave}
          onClose={handleClose}
        />

        <SuggestedHolidayEventsSection
          rows={suggestedRows}
          goalsRowState={goalsRowState}
          onUpdate={updateDraftRow}
          onSave={handleSave}
          onClose={handleClose}
        />
      </div>

      <Button
        type="button"
        variant="link"
        onClick={handleAddEvent}
        className="h-auto w-fit gap-1.5 px-0 text-brand-600 hover:text-brand-700"
      >
        <Plus className="size-4" />
        Add event
      </Button>
    </div>
  );
}
