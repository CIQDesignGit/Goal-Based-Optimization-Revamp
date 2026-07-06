"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, Plus, X } from "lucide-react";

import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEASONALITY_SCOPE_OPTIONS, type SeasonalityEvent } from "@/lib/gbo-optimization/setup-data";
import { cn } from "@/lib/utils";

type BudgetMode = "percent" | "absolute";

type EventFormState = {
  name: string;
  startDate: string;
  endDate: string;
  scope: string | null;
  budgetMode: BudgetMode;
  budgetValue: string;
};

const DEFAULT_FORM: EventFormState = {
  name: "",
  startDate: "Jul 01, 2026",
  endDate: "Jul 01, 2026",
  scope: null,
  budgetMode: "percent",
  budgetValue: "0",
};

const FIELD_LABEL = "text-sm font-semibold leading-5 text-slate-900";
const FIELD_INPUT =
  "h-10 rounded-md border-slate-200 bg-white text-slate-700 shadow-none";
const FIELD_FOOTER = "flex h-5 items-center text-sm";

function FormField({
  label,
  className,
  footer,
  children,
}: {
  label: string;
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className={FIELD_LABEL}>{label}</Label>
      {children}
      <div className={FIELD_FOOTER}>
        {footer ?? <span className="invisible select-none">.</span>}
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} className="min-w-[148px] flex-1">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(FIELD_INPUT, "pl-9")}
          placeholder="Jul 01, 2026"
        />
      </div>
    </FormField>
  );
}

function SeasonalityEventForm({
  form,
  onChange,
  onSave,
  onClose,
}: {
  form: EventFormState;
  onChange: (updates: Partial<EventFormState>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const budgetHelperText =
    form.budgetMode === "percent"
      ? "Of July's budget plan of $0"
      : "Absolute budget adjustment for the event period";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3 xl:flex-nowrap">
        <FormField label="Event name" className="min-w-[140px] flex-1">
          <Input
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className={FIELD_INPUT}
            placeholder=""
          />
        </FormField>

        <DateField
          label="Start date"
          value={form.startDate}
          onChange={(startDate) => onChange({ startDate })}
        />

        <DateField
          label="End date"
          value={form.endDate}
          onChange={(endDate) => onChange({ endDate })}
        />

        <FormField label="Scope" className="min-w-[148px] flex-1">
          <SetupInlineSelect
            label="Scope"
            hideLabel
            value={form.scope}
            options={SEASONALITY_SCOPE_OPTIONS}
            placeholder="Select Scope"
            onValueChange={(scope) => onChange({ scope })}
            triggerClassName={cn(FIELD_INPUT, "border-slate-200 bg-white text-slate-700")}
          />
        </FormField>

        <FormField
          label="Budget"
          className="min-w-[260px] flex-[1.4]"
          footer={
            <>
              <button
                type="button"
                onClick={() => onChange({ budgetMode: "percent" })}
                className={cn(
                  "font-medium transition-colors",
                  form.budgetMode === "percent"
                    ? "text-brand-600"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Percent
              </button>
              <span className="px-1 text-slate-300">|</span>
              <button
                type="button"
                onClick={() => onChange({ budgetMode: "absolute" })}
                className={cn(
                  "font-medium transition-colors",
                  form.budgetMode === "absolute"
                    ? "text-brand-600"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Absolute
              </button>
            </>
          }
        >
          <div className="flex h-10 gap-2">
            <div className="relative w-20 shrink-0">
              {form.budgetMode === "absolute" && (
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-slate-500">
                  $
                </span>
              )}
              <Input
                value={form.budgetValue}
                onChange={(event) => onChange({ budgetValue: event.target.value })}
                className={cn(
                  FIELD_INPUT,
                  "text-right",
                  form.budgetMode === "percent" ? "pr-7" : "pl-7",
                )}
                inputMode="decimal"
              />
              {form.budgetMode === "percent" && (
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-slate-500">
                  %
                </span>
              )}
            </div>
            <Input
              readOnly
              value={budgetHelperText}
              className={cn(FIELD_INPUT, "min-w-0 flex-1 text-slate-500")}
            />
          </div>
        </FormField>

        <div className="flex shrink-0 flex-col gap-1.5">
          <div className="h-5" aria-hidden />
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
    </div>
  );
}

export function SeasonalityEventsSection({
  events,
  onAddEvent,
}: {
  events: SeasonalityEvent[];
  onAddEvent: (event: SeasonalityEvent) => void;
}) {
  const [showForm, setShowForm] = useState(true);
  const [form, setForm] = useState<EventFormState>(DEFAULT_FORM);

  const handleOpenForm = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm(DEFAULT_FORM);
  };

  const handleSave = () => {
    const scope = form.scope;

    if (!form.name.trim() || !scope) {
      return;
    }

    onAddEvent({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      scope,
      budgetMode: form.budgetMode,
      budgetValue: form.budgetValue,
    });

    setForm(DEFAULT_FORM);
    setShowForm(true);
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
          Add seasonality events such as Black Friday, Prime Day etc. at entire
          business, or any budget category level for specific time period.
        </p>
      </div>

      {events.length > 0 && (
        <div className="flex flex-col gap-2">
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
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
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

      {showForm && (
        <SeasonalityEventForm
          form={form}
          onChange={(updates) =>
            setForm((current) => ({ ...current, ...updates }))
          }
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}

      <Button
        type="button"
        variant="link"
        onClick={handleOpenForm}
        className="h-auto w-fit gap-1.5 px-0 text-brand-600 hover:text-brand-700"
      >
        <Plus className="size-4" />
        Add event
      </Button>
    </div>
  );
}
