"use client";

import { CalendarDays } from "lucide-react";

import {
  formatSeasonalityMonthLabel,
  getSuggestedSeasonalityEvents,
  type SuggestedSeasonalityEventTemplate,
} from "@/lib/gbo-optimization/setup-data";

function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} – ${endDate}`;
}

function SuggestedEventTile({
  template,
}: {
  template: SuggestedSeasonalityEventTemplate;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-slate-900">{template.name}</p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
          {formatDateRange(template.startDate, template.endDate)}
        </p>
        <p className="text-xs text-slate-500">{template.description}</p>
      </div>
    </div>
  );
}

export function SuggestedSeasonalityEvents() {
  const suggestions = getSuggestedSeasonalityEvents();
  const monthLabel = formatSeasonalityMonthLabel();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-900">
          Upcoming events in {monthLabel}
        </h3>
        <p className="text-sm text-slate-500">
          Known retail moments for the upcoming month. Use the form above to add
          any that apply to your seasonality plan.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {suggestions.map((template) => (
          <SuggestedEventTile key={template.id} template={template} />
        ))}
      </div>
    </section>
  );
}
