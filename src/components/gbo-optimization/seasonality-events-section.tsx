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
  // Custom event form only — suggested holidays section is not shown in the UI.
  return [createBlankDraftRow("custom")];
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

type SavedEventFilter = SeasonalityEventTiming | "all";

const SAVED_EVENT_FILTERS: {
  id: SavedEventFilter;
  label: string;
  description: string;
  emptyMessage: string;
  /** Unselected chip accent (dot only — label stays readable). */
  dotClassName: string;
  /** Selected chip surface — color reinforces meaning, never alone. */
  selectedClassName: string;
  countClassName: string;
}[] = [
  {
    id: "all",
    label: "All",
    description: "Every saved event — active, upcoming, and past",
    emptyMessage: "No saved events yet. Add an event above to start your plan.",
    dotClassName: "bg-brand-500",
    selectedClassName:
      "border-brand-500 bg-brand-50 text-brand-900 shadow-sm",
    countClassName: "bg-brand-100 text-brand-800",
  },
  {
    id: "active",
    label: "Active",
    description: "Running today — impacting budget now",
    emptyMessage:
      "No events running today. Switch to Upcoming, or add a new event above.",
    dotClassName: "bg-emerald-500",
    selectedClassName:
      "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm",
    countClassName: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    description: "Starts later — not yet affecting spend",
    emptyMessage:
      "No upcoming events. Switch to Active or Past, or add a new event above.",
    dotClassName: "bg-sky-500",
    selectedClassName: "border-sky-500 bg-sky-50 text-sky-900 shadow-sm",
    countClassName: "bg-sky-100 text-sky-800",
  },
  {
    id: "past",
    label: "Past",
    description: "Ended events — available to review",
    emptyMessage: "No past events yet. Ended seasonality events will appear here.",
    dotClassName: "bg-slate-400",
    selectedClassName: "border-slate-500 bg-slate-100 text-slate-900 shadow-sm",
    countClassName: "bg-slate-200 text-slate-700",
  },
];

function getDefaultSavedEventFilter(): SavedEventFilter {
  // Start on All so users see the full plan; chips narrow from there.
  return "all";
}

/** Events for the selected chip — All = active → upcoming → past order. */
function getFilteredSavedEvents(
  filter: SavedEventFilter,
  groups: {
    active: SeasonalityEvent[];
    upcoming: SeasonalityEvent[];
    past: SeasonalityEvent[];
  },
): SeasonalityEvent[] {
  if (filter === "all") {
    return [...groups.active, ...groups.upcoming, ...groups.past];
  }

  return groups[filter];
}

function SavedEventFilterChips({
  selected,
  counts,
  onSelect,
}: {
  selected: SavedEventFilter;
  counts: Record<SavedEventFilter, number>;
  onSelect: (filter: SavedEventFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter saved events by timing"
      className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100/90 p-1"
    >
      {SAVED_EVENT_FILTERS.map((filter) => {
        const isSelected = selected === filter.id;
        const count = counts[filter.id];

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(filter.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              isSelected
                ? filter.selectedClassName
                : "border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm",
            )}
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", filter.dotClassName)}
              aria-hidden
            />
            <span>{filter.label}</span>
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                isSelected
                  ? filter.countClassName
                  : "bg-white/80 text-slate-500 ring-1 ring-slate-200/80 ring-inset",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
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

  const groups = groupSavedSeasonalityEvents(events);
  const { active, upcoming, past } = groups;

  const [filter, setFilter] = useState<SavedEventFilter>(getDefaultSavedEventFilter);

  const counts: Record<SavedEventFilter, number> = {
    all: events.length,
    active: active.length,
    upcoming: upcoming.length,
    past: past.length,
  };

  const selectedFilter =
    SAVED_EVENT_FILTERS.find((item) => item.id === filter) ??
    SAVED_EVENT_FILTERS[0];

  const filteredEvents = getFilteredSavedEvents(filter, groups);

  const summaryParts = [
    active.length > 0 ? `${active.length} active` : null,
    upcoming.length > 0 ? `${upcoming.length} upcoming` : null,
    past.length > 0 ? `${past.length} past` : null,
  ].filter(Boolean);

  const handleFilterSelect = (next: SavedEventFilter) => {
    setFilter(next);

    // Drop inline edit if the edited event is outside the new filter view.
    if (editingEventId && next !== "all") {
      const stillVisible = groups[next].some(
        (event) => event.id === editingEventId,
      );
      if (!stillVisible) {
        onCancelEdit();
      }
    }
  };

  const renderEventRows = (groupEvents: SeasonalityEvent[]) =>
    groupEvents.map((event) => {
      const timing = getSeasonalityEventTiming(event);
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
      <div
        className={cn(
          "bg-slate-50",
          isExpanded && "border-b border-slate-100",
        )}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100"
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
              <p className="text-sm font-semibold text-slate-900">
                Saved events
              </p>
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
          <div className="flex flex-col gap-2 px-4 pb-3">
            <SavedEventFilterChips
              selected={filter}
              counts={counts}
              onSelect={handleFilterSelect}
            />
            <p className="text-xs text-slate-500">{selectedFilter.description}</p>
          </div>
        ) : null}
      </div>

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

          {filteredEvents.length > 0 ? (
            <div>{renderEventRows(filteredEvents)}</div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">
                {selectedFilter.emptyMessage}
              </p>
            </div>
          )}
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
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Add a custom event below. Select scope and budget, then save to add it
        to your plan.
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
