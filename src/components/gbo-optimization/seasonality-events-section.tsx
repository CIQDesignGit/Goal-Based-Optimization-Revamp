"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import {
  parseSeasonalityDisplayDate,
  SeasonalityDateInput,
  syncSeasonalityEndDateWithStart,
} from "@/components/gbo-optimization/seasonality-date-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BLANK_SEASONALITY_FORM,
  PREFILLED_HOLIDAY_SEASONALITY_DRAFTS,
  SEASONALITY_SCOPE_OPTIONS,
  type SeasonalityDraftFormState,
  type SeasonalityEvent,
} from "@/lib/gbo-optimization/setup-data";
import { getSeasonalityBudgetContextLabel } from "@/lib/gbo-optimization/seasonality-budget-context";
import {
  getMidMonthSeasonalityInlineHint,
  shouldWarnMidMonthSeasonalityTiming,
} from "@/lib/gbo-optimization/mid-month-timing";
import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import type { GoalsRowState } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

type BudgetMode = "percent" | "absolute";

type DraftRowKind = "custom" | "prefilled";

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

function getPrefilledTemplateIdForEvent(event: SeasonalityEvent): string | null {
  if (event.templateId) {
    return event.templateId;
  }

  const match = PREFILLED_HOLIDAY_SEASONALITY_DRAFTS.find(
    (template) =>
      template.form.name === event.name &&
      template.form.startDate === event.startDate &&
      template.form.endDate === event.endDate,
  );

  return match?.id ?? null;
}

function eventToDraftForm(event: SeasonalityEvent): SeasonalityDraftFormState {
  return {
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    scope: event.scope,
    budgetMode: event.budgetMode,
    budgetValue: event.budgetValue,
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
  "h-10 rounded-md border border-slate-300 bg-slate-50 text-slate-700 shadow-none";
const FIELD_FOOTER = "flex items-start text-sm leading-snug";
/** Grid columns: event | start | end | scope | budget (flex) | actions */
const ROW_LAYOUT =
  "grid grid-cols-[minmax(5.5rem,0.65fr)_9.25rem_9.25rem_9rem_minmax(13rem,1fr)_6.75rem] items-start gap-x-3 gap-y-3";
const TABLE_MIN_WIDTH = "min-w-[54rem]";
const COL_DATE_CELL = "min-w-[9.25rem] shrink-0";
const COL_ACTIONS = "flex shrink-0 flex-col gap-1.5";
const DATE_PICKER_TRIGGER = cn(
  FIELD_INPUT,
  "min-w-[8.75rem] gap-1.5 px-2.5 text-sm whitespace-nowrap",
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
      {footer ? <div className={FIELD_FOOTER}>{footer}</div> : null}
    </div>
  );
}

const SAVED_ROW_LAYOUT = cn(ROW_LAYOUT, "items-center");

function formatSeasonalityBudgetDisplay(
  budgetMode: BudgetMode,
  budgetValue: string,
): string {
  const trimmed = budgetValue.trim();

  if (!trimmed) {
    return budgetMode === "percent" ? "0%" : "$0";
  }

  if (budgetMode === "percent") {
    const num = Number.parseFloat(trimmed);
    return Number.isFinite(num) ? `${num}%` : `${trimmed}%`;
  }

  const num = Number.parseFloat(trimmed.replace(/[$,\s]/g, ""));
  if (Number.isFinite(num)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  }

  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

type SeasonalityEventTiming = "active" | "upcoming" | "past";

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Classify a saved event relative to today: running now, future, or ended. */
function getSeasonalityEventTiming(
  event: SeasonalityEvent,
  today: Date = new Date(),
): SeasonalityEventTiming {
  const start = parseSeasonalityDisplayDate(event.startDate);
  const end = parseSeasonalityDisplayDate(event.endDate);

  if (!start || !end) {
    return "upcoming";
  }

  const todayStart = startOfLocalDay(today).getTime();
  const startTime = startOfLocalDay(start).getTime();
  const endTime = startOfLocalDay(end).getTime();

  if (todayStart < startTime) {
    return "upcoming";
  }

  if (todayStart > endTime) {
    return "past";
  }

  return "active";
}

function getEventStartTime(event: SeasonalityEvent): number {
  return parseSeasonalityDisplayDate(event.startDate)?.getTime() ?? 0;
}

function getEventEndTime(event: SeasonalityEvent): number {
  return parseSeasonalityDisplayDate(event.endDate)?.getTime() ?? 0;
}

function groupSavedSeasonalityEvents(events: SeasonalityEvent[]): {
  active: SeasonalityEvent[];
  upcoming: SeasonalityEvent[];
  past: SeasonalityEvent[];
} {
  const active: SeasonalityEvent[] = [];
  const upcoming: SeasonalityEvent[] = [];
  const past: SeasonalityEvent[] = [];

  for (const event of events) {
    const timing = getSeasonalityEventTiming(event);

    if (timing === "active") {
      active.push(event);
    } else if (timing === "upcoming") {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }

  // Active: ending soonest first (urgency)
  active.sort((a, b) => getEventEndTime(a) - getEventEndTime(b));
  // Upcoming: starting soonest first
  upcoming.sort((a, b) => getEventStartTime(a) - getEventStartTime(b));
  // Past: most recently ended first
  past.sort((a, b) => getEventEndTime(b) - getEventEndTime(a));

  return { active, upcoming, past };
}

function SavedSeasonalityEventRow({
  event,
  goalsRowState,
  timing,
  onEdit,
  onDelete,
}: {
  event: SeasonalityEvent;
  goalsRowState: Record<string, GoalsRowState>;
  timing: SeasonalityEventTiming;
  onEdit: (event: SeasonalityEvent) => void;
  onDelete: (event: SeasonalityEvent) => void;
}) {
  const scopeLabel =
    SEASONALITY_SCOPE_OPTIONS.find((option) => option.value === event.scope)
      ?.label ?? event.scope;

  const budgetLabel = formatSeasonalityBudgetDisplay(
    event.budgetMode,
    event.budgetValue,
  );

  const budgetContextLabel = getSeasonalityBudgetContextLabel(
    event.startDate,
    event.budgetMode,
    goalsRowState,
  );

  const isActive = timing === "active";
  const isPast = timing === "past";

  return (
    <div
      className={cn(
        SAVED_ROW_LAYOUT,
        "border-b border-slate-100 px-4 py-3 last:border-b-0",
        isActive && "bg-emerald-50/40",
        isPast && "opacity-80",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="min-w-0 text-sm font-medium text-slate-700">
          {event.name}
        </p>
      </div>

      <p className="flex items-center gap-1.5 text-sm whitespace-nowrap text-slate-600">
        <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
        {event.startDate}
      </p>

      <p className="flex items-center gap-1.5 text-sm whitespace-nowrap text-slate-600">
        <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
        {event.endDate}
      </p>

      <Badge
        variant="outline"
        className="h-6 rounded-md border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700"
      >
        {scopeLabel}
      </Badge>

      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-7 shrink-0 items-center rounded-md bg-brand-50 px-2.5 text-sm font-semibold text-brand-700 tabular-nums ring-1 ring-brand-200/80 ring-inset">
          {budgetLabel}
        </span>
        <span className="min-w-0 truncate text-sm text-slate-500">
          {budgetContextLabel}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(event)}
          className="text-slate-500 hover:text-slate-900"
          aria-label={`Edit ${event.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(event)}
          className="text-slate-500 hover:text-error-600"
          aria-label={`Delete ${event.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SavedEventsGroupHeader({
  title,
  count,
  description,
  accentClassName,
  isOpen,
  onToggle,
}: {
  title: string;
  count: number;
  description: string;
  accentClassName: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2.5 text-left hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-2">
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-slate-400 transition-transform",
            !isOpen && "-rotate-90",
          )}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn("size-2.5 shrink-0 rounded-full", accentClassName)}
              aria-hidden
            />
            <p className="text-sm font-semibold text-slate-800">
              {title}
              <span className="ml-1.5 font-medium text-slate-500">({count})</span>
            </p>
          </div>
          <p className="pl-4 text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

function SavedSeasonalityEventsList({
  events,
  goalsRowState,
  editingEventId,
  editingForm,
  editingScopeError,
  onStartEdit,
  onUpdateEditingForm,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  events: SeasonalityEvent[];
  goalsRowState: Record<string, GoalsRowState>;
  editingEventId: string | null;
  editingForm: SeasonalityDraftFormState | null;
  editingScopeError: boolean;
  onStartEdit: (event: SeasonalityEvent) => void;
  onUpdateEditingForm: (updates: Partial<SeasonalityDraftFormState>) => void;
  onSaveEdit: (event: SeasonalityEvent) => void;
  onCancelEdit: () => void;
  onDelete: (event: SeasonalityEvent) => void;
}) {
  // Collapsed by default so add-event + chart stay visible with many saved rows.
  const [isExpanded, setIsExpanded] = useState(false);
  // Past is nested-collapsed by default; Active + Upcoming open when parent expands.
  const [isPastOpen, setIsPastOpen] = useState(false);

  const { active, upcoming, past } = groupSavedSeasonalityEvents(events);

  const summaryParts = [
    active.length > 0 ? `${active.length} active` : null,
    upcoming.length > 0 ? `${upcoming.length} upcoming` : null,
    past.length > 0 ? `${past.length} past` : null,
  ].filter(Boolean);

  const renderEventRows = (
    groupEvents: SeasonalityEvent[],
    timing: SeasonalityEventTiming,
  ) =>
    groupEvents.map((event) => {
      const isEditing = editingEventId === event.id && editingForm !== null;

      if (isEditing) {
        return (
          <div
            key={event.id}
            className="border-b border-slate-100 bg-brand-50/30 px-4 py-3 ring-2 ring-inset ring-brand-500/20 last:border-b-0"
          >
            <SeasonalityEventFormRow
              form={editingForm}
              scopeError={editingScopeError}
              budgetContextLabel={getSeasonalityBudgetContextLabel(
                editingForm.startDate,
                editingForm.budgetMode,
                goalsRowState,
              )}
              onChange={onUpdateEditingForm}
              onSave={() => onSaveEdit(event)}
              onClose={onCancelEdit}
            />
          </div>
        );
      }

      return (
        <SavedSeasonalityEventRow
          key={event.id}
          event={event}
          timing={timing}
          goalsRowState={goalsRowState}
          onEdit={onStartEdit}
          onDelete={onDelete}
        />
      );
    });

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 border-l-4 border-l-emerald-500 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-start justify-between gap-3 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100",
          isExpanded && "border-b border-slate-100",
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-slate-500 transition-transform",
              !isExpanded && "-rotate-90",
            )}
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">Saved events</p>
            <p className="text-sm text-slate-500">
              {summaryParts.length > 0
                ? summaryParts.join(" · ")
                : events.length === 1
                  ? "1 event added to your plan"
                  : `${events.length} events added to your plan`}
            </p>
          </div>
        </div>
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80 ring-inset">
          {events.length}
        </span>
      </button>

      {isExpanded ? (
        <SeasonalityEventTable>
          <div
            className={cn(
              SAVED_ROW_LAYOUT,
              "border-b border-slate-100 px-4 py-2.5",
            )}
          >
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Event name
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Start date
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              End date
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Scope
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Budget
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Actions
            </span>
          </div>

          {active.length > 0 ? (
            <div>
              <div className="border-b border-slate-100 bg-emerald-50/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold text-slate-800">
                    Active
                    <span className="ml-1.5 font-medium text-slate-500">
                      ({active.length})
                    </span>
                  </p>
                </div>
                <p className="pl-4 text-xs text-slate-500">
                  Running today — impacting budget now
                </p>
              </div>
              <div className="border-b border-slate-100">
                {renderEventRows(active, "active")}
              </div>
            </div>
          ) : (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-500">
                No events running today. Check Upcoming below or add a new event.
              </p>
            </div>
          )}

          {upcoming.length > 0 ? (
            <div>
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full bg-sky-500"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold text-slate-800">
                    Upcoming
                    <span className="ml-1.5 font-medium text-slate-500">
                      ({upcoming.length})
                    </span>
                  </p>
                </div>
                <p className="pl-4 text-xs text-slate-500">
                  Starts later — not yet affecting spend
                </p>
              </div>
              <div className="border-b border-slate-100">
                {renderEventRows(upcoming, "upcoming")}
              </div>
            </div>
          ) : null}

          {past.length > 0 ? (
            <div>
              <SavedEventsGroupHeader
                title="Past"
                count={past.length}
                description="Ended events — expand to review"
                accentClassName="bg-slate-400"
                isOpen={isPastOpen}
                onToggle={() => setIsPastOpen((open) => !open)}
              />
              {isPastOpen ? (
                <div>{renderEventRows(past, "past")}</div>
              ) : null}
            </div>
          ) : null}
        </SeasonalityEventTable>
      ) : null}
    </section>
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
      <div aria-hidden />
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
  const showMidMonthWarning =
    form.name.trim().length > 0 &&
    shouldWarnMidMonthSeasonalityTiming(form.startDate, form.endDate);
  const startDateValue = parseSeasonalityDisplayDate(form.startDate);

  return (
    <div className="flex flex-col gap-3">
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
        <SeasonalityDateInput
          value={form.startDate}
          onChange={(startDate) => {
            const updates: Partial<SeasonalityDraftFormState> = { startDate };
            const syncedEndDate = syncSeasonalityEndDateWithStart(
              startDate,
              form.endDate,
            );

            if (syncedEndDate) {
              updates.endDate = syncedEndDate;
            }

            onChange(updates);
          }}
          className={DATE_PICKER_TRIGGER}
          placeholder="Jul 01, 2026"
          aria-label="Start date"
        />
      </FormFieldCell>

      <FormFieldCell className={COL_DATE_CELL}>
        <SeasonalityDateInput
          value={form.endDate}
          onChange={(endDate) => onChange({ endDate })}
          minDate={startDateValue}
          openToMonth={startDateValue}
          className={DATE_PICKER_TRIGGER}
          placeholder="Jul 01, 2026"
          aria-label="End date"
        />
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
            aria-label="Discard event"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      </div>

      {showMidMonthWarning ? (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-slate-600">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-amber-100">
            <AlertTriangle className="size-3 text-amber-600" />
          </span>
          <span>{getMidMonthSeasonalityInlineHint(form.startDate)}</span>
        </div>
      ) : null}
    </div>
  );
}

function CustomEventsSection({
  rows,
  goalsRowState,
  onUpdate,
  onSave,
  onClose,
  onAddEvent,
}: {
  rows: DraftEventRow[];
  goalsRowState: ReturnType<typeof useSetupSessionStore.getState>["goalsRowState"];
  onUpdate: (rowId: string, updates: Partial<SeasonalityDraftFormState>) => void;
  onSave: (rowId: string) => void;
  onClose: (rowId: string) => void;
  onAddEvent: () => void;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
      <p className="mb-3 text-sm font-medium text-slate-900">Custom event</p>

      {rows.length > 0 ? (
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
      ) : null}

      <Button
        type="button"
        variant="link"
        onClick={onAddEvent}
        className={cn(
          "h-auto w-fit gap-1.5 px-0 text-brand-600 hover:text-brand-700",
          rows.length > 0 && "mt-3",
        )}
      >
        <Plus className="size-4" />
        Add event
      </Button>
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
    <section className="overflow-hidden rounded-md border border-slate-200 border-l-4 border-l-cyan-500 bg-white shadow-sm">
      <div className="border-b border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">Suggested holidays</p>
        <p className="text-sm text-slate-600">
          Prefilled events ready to configure. Select scope and budget for each,
          then save to add them to your plan.
        </p>
      </div>

      <div className="p-4">
        <SeasonalityEventTable>
        <SeasonalityEventFormHeader />
        <div className="mt-3 flex flex-col gap-6">
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
      </div>
    </section>
  );
}

type SeasonalityEventsSectionProps = {
  events: SeasonalityEvent[];
  onAddEvent: (event: SeasonalityEvent) => void;
  onUpdateEvent: (event: SeasonalityEvent) => void;
  onRemoveEvent: (eventId: string) => void;
};

type EditingSavedEventState = {
  eventId: string;
  form: SeasonalityDraftFormState;
  scopeError: boolean;
};

export function SeasonalityEventsSection({
  events,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
}: SeasonalityEventsSectionProps) {
  const [draftRows, setDraftRows] = useState<DraftEventRow[]>(createInitialDraftRows);
  const [editingEvent, setEditingEvent] = useState<EditingSavedEventState | null>(
    null,
  );
  const goalsRowState = useSetupSessionStore((state) => state.goalsRowState);

  const customRows = draftRows.filter((row) => row.kind === "custom");
  const suggestedRows = draftRows.filter((row) => row.kind === "prefilled");

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
      sourceKind: row.kind,
      templateId: row.templateId,
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
    // X discards the draft row (custom or suggested) — remove it from the list.
    setDraftRows((current) => current.filter((draft) => draft.id !== rowId));
  };

  const handleAddEvent = () => {
    setDraftRows((current) => [...current, createBlankDraftRow()]);
  };

  const restorePrefilledDraftRow = (templateId: string) => {
    const template = PREFILLED_HOLIDAY_SEASONALITY_DRAFTS.find(
      (item) => item.id === templateId,
    );

    if (!template) {
      return;
    }

    const restoredRow = createPrefilledDraftRow(template);

    setDraftRows((current) => {
      if (current.some((draft) => draft.id === templateId)) {
        return current.map((draft) =>
          draft.id === templateId ? restoredRow : draft,
        );
      }

      return [...current, restoredRow];
    });
  };

  const handleStartEditSavedEvent = (event: SeasonalityEvent) => {
    setEditingEvent({
      eventId: event.id,
      form: eventToDraftForm(event),
      scopeError: false,
    });
  };

  const handleUpdateEditingForm = (
    updates: Partial<SeasonalityDraftFormState>,
  ) => {
    setEditingEvent((current) =>
      current
        ? {
            ...current,
            form: { ...current.form, ...updates },
            scopeError: updates.scope ? false : current.scopeError,
          }
        : null,
    );
  };

  const handleSaveInlineEdit = (event: SeasonalityEvent) => {
    if (!editingEvent || editingEvent.eventId !== event.id) {
      return;
    }

    const scope = editingEvent.form.scope;
    const hasName = editingEvent.form.name.trim().length > 0;

    if (!hasName || !scope) {
      setEditingEvent({
        ...editingEvent,
        scopeError: !scope && hasName,
      });
      return;
    }

    onUpdateEvent({
      ...event,
      name: editingEvent.form.name.trim(),
      startDate: editingEvent.form.startDate,
      endDate: editingEvent.form.endDate,
      scope,
      budgetMode: editingEvent.form.budgetMode,
      budgetValue: editingEvent.form.budgetValue,
    });

    setEditingEvent(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingEvent(null);
  };

  const handleDeleteSavedEvent = (event: SeasonalityEvent) => {
    if (editingEvent?.eventId === event.id) {
      setEditingEvent(null);
    }

    onRemoveEvent(event.id);

    const templateId = getPrefilledTemplateIdForEvent(event);

    if (
      (event.sourceKind === "prefilled" || templateId) &&
      templateId
    ) {
      restorePrefilledDraftRow(templateId);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Add a custom event or configure the suggested holidays below. Select
        scope and budget, then save each event to add it to your plan.
      </p>

      <div className="flex flex-col gap-3">
        <CustomEventsSection
          rows={customRows}
          goalsRowState={goalsRowState}
          onUpdate={updateDraftRow}
          onSave={handleSave}
          onClose={handleClose}
          onAddEvent={handleAddEvent}
        />

        <SuggestedHolidayEventsSection
          rows={suggestedRows}
          goalsRowState={goalsRowState}
          onUpdate={updateDraftRow}
          onSave={handleSave}
          onClose={handleClose}
        />
      </div>

      {events.length > 0 && (
        <SavedSeasonalityEventsList
          events={events}
          goalsRowState={goalsRowState}
          editingEventId={editingEvent?.eventId ?? null}
          editingForm={editingEvent?.form ?? null}
          editingScopeError={editingEvent?.scopeError ?? false}
          onStartEdit={handleStartEditSavedEvent}
          onUpdateEditingForm={handleUpdateEditingForm}
          onSaveEdit={handleSaveInlineEdit}
          onCancelEdit={handleCancelInlineEdit}
          onDelete={handleDeleteSavedEvent}
        />
      )}
    </div>
  );
}
