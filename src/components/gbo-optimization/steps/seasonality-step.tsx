"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { SeasonalityEventsSection } from "@/components/gbo-optimization/seasonality-events-section";
import { ImpactBanner } from "@/components/gbo-optimization/impact-banner";
import { SetupInlineSelect } from "@/components/gbo-optimization/setup-inline-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  ENTIRE_BUSINESS_SCOPE_ID,
  getLevelLabel,
  getScopeTaxonomyValue,
  GOALS_SCOPE_ROWS,
  SEASONALITY_CHART_DATA,
  type SeasonalityEvent,
} from "@/lib/gbo-optimization/setup-data";
import {
  recordSeasonalityEventAdded,
  recordSeasonalityEventRemoved,
  recordSeasonalityEventUpdated,
  useSetupSessionStore,
} from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

const CHART_CONFIG = {
  budget: {
    label: "Seasonality",
    color: "#F59E0B",
  },
};

function formatCurrency(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return `$${value}`;
}

function formatSeasonalityEventLabel(event: SeasonalityEvent): string {
  const range = formatSeasonalityDateRange(event);
  const budget = event.budgetValue
    ? `${event.budgetMode} ${event.budgetValue}`
    : "";
  const parts = [event.name, range, budget].filter(Boolean);
  return parts.join(" · ");
}

function formatSeasonalityDateRange(event: SeasonalityEvent): string {
  if (event.startDate && event.endDate) {
    return `${event.startDate} → ${event.endDate}`;
  }
  return event.startDate || event.endDate || "";
}

/** Unique taxonomy values for a Level 1 / Level 2 key (chart filter dropdown). */
function getTaxonomyFilterOptions(
  levelKey: string,
  /** When set, only include values that appear under this Level 1 value. */
  level1Key?: string,
  level1Value?: string | null,
): { value: string; label: string }[] {
  const values = new Set<string>();

  for (const row of GOALS_SCOPE_ROWS) {
    if (row.id === ENTIRE_BUSINESS_SCOPE_ID || !row.taxonomy) continue;

    if (level1Key && level1Value) {
      if (getScopeTaxonomyValue(row, level1Key) !== level1Value) continue;
    }

    const value = getScopeTaxonomyValue(row, levelKey).trim();
    if (value) values.add(value);
  }

  return [...values]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export function SeasonalityStep() {
  // Shared state survives when Rule Based temporarily removes this step.
  const events = useSetupSessionStore((state) => state.seasonalityEvents);
  const setEvents = useSetupSessionStore(
    (state) => state.setSeasonalityEvents,
  );
  const [level1Filter, setLevel1Filter] = useState<string | null>(null);
  const [level2Filter, setLevel2Filter] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"absolute" | "cumulative">(
    "absolute",
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(true);
  const seasonalityWasRestored = useSetupSessionStore((state) =>
    state.changeLedger.some(
      (entry) =>
        entry.field === "seasonalityAvailability" && entry.to === "Restored",
    ),
  );

  const budgetType = useSetupSessionStore(
    (state) => state.generalConfig.budgetType,
  );
  const level1Key = useSetupSessionStore((state) => state.generalConfig.level1);
  const level2Key = useSetupSessionStore((state) => state.generalConfig.level2);
  const level1Label = getLevelLabel(budgetType, level1Key);
  const level2Label = getLevelLabel(budgetType, level2Key);

  // Taxonomy changed in General — reset chart filters so labels/options stay valid.
  useEffect(() => {
    setLevel1Filter(null);
    setLevel2Filter(null);
  }, [budgetType, level1Key, level2Key]);

  const isEntireBusiness = level1Filter === null && level2Filter === null;
  const isLevel1Active = level1Filter !== null;
  const isLevel2Active = level2Filter !== null;

  const level1Options = useMemo(
    () => getTaxonomyFilterOptions(level1Key),
    [level1Key],
  );
  // Flat list — Level 2 is an alternate scope, not nested under Level 1.
  const level2Options = useMemo(
    () => getTaxonomyFilterOptions(level2Key),
    [level2Key],
  );

  const handleEntireBusiness = () => {
    setLevel1Filter(null);
    setLevel2Filter(null);
  };

  // Only one chip active: picking Level 1 clears Level 2.
  const handleLevel1Change = (value: string) => {
    setLevel1Filter(value);
    setLevel2Filter(null);
  };

  // Only one chip active: picking Level 2 clears Level 1.
  const handleLevel2Change = (value: string) => {
    setLevel2Filter(value);
    setLevel1Filter(null);
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      {seasonalityWasRestored && showRestoredNotice ? (
        <ImpactBanner
          title="Seasonality draft restored"
          onDismiss={() => setShowRestoredNotice(false)}
        >
          Your seasonality events were temporarily inactive in Rule Based and
          are available again.
        </ImpactBanner>
      ) : null}

      <h2 className="text-base font-medium text-slate-900">
        Cumulative budget plan for the year 2026
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        {/* Entire Business — active when no Level 1 / Level 2 filter is set */}
        <button
          type="button"
          onClick={handleEntireBusiness}
          className={cn(
            "inline-flex h-8 items-center rounded-md border bg-white px-3 font-sans text-sm font-medium transition-colors",
            isEntireBusiness
              ? "border-brand-600 bg-brand-25 text-slate-900"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
          )}
        >
          Entire Business
        </button>

        {/* Level 1 filter — e.g. “Portfolio National Grocery ▾” */}
        <div className="w-fit max-w-full">
          <SetupInlineSelect
            label={level1Label}
            showInlineLabel
            isActive={isLevel1Active}
            value={level1Filter}
            options={level1Options}
            placeholder="Select"
            onValueChange={handleLevel1Change}
            triggerClassName="h-8 py-0"
            menuMinWidth={200}
          />
        </div>

        {/* Level 2 filter — e.g. “Profiles JBC Frozen — US ▾” */}
        <div className="w-fit max-w-full">
          <SetupInlineSelect
            label={level2Label}
            showInlineLabel
            isActive={isLevel2Active}
            value={level2Filter}
            options={level2Options}
            placeholder="Select"
            onValueChange={handleLevel2Change}
            triggerClassName="h-8 py-0"
            menuMinWidth={200}
          />
        </div>
      </div>

      <SeasonalityEventsSection
        events={events}
        onAddEvent={(event) => {
          setEvents((current) => [...current, event]);
          recordSeasonalityEventAdded(
            event.name.trim() || "New event",
            formatSeasonalityDateRange(event),
            event.scope,
            event.budgetMode,
            event.budgetValue,
          );
        }}
        onUpdateEvent={(updatedEvent) => {
          const previous = events.find((event) => event.id === updatedEvent.id);
          setEvents((current) =>
            current.map((event) =>
              event.id === updatedEvent.id ? updatedEvent : event,
            ),
          );
          if (previous) {
            recordSeasonalityEventUpdated(
              formatSeasonalityEventLabel(previous),
              formatSeasonalityEventLabel(updatedEvent),
              updatedEvent.scope,
            );
          }
        }}
        onRemoveEvent={(eventId) => {
          const previous = events.find((event) => event.id === eventId);
          setEvents((current) =>
            current.filter((event) => event.id !== eventId),
          );
          if (previous) {
            recordSeasonalityEventRemoved(
              formatSeasonalityEventLabel(previous),
              previous.scope,
            );
          }
        }}
      />

      <Card className="border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <fieldset className="m-0 flex flex-wrap items-center gap-6 border-0 p-0">
              <legend className="shrink-0 text-sm font-medium text-slate-700">
                Chart view
              </legend>
              <div className="flex flex-wrap items-center gap-6">
                <Label className="cursor-pointer font-normal text-slate-700">
                  <input
                    type="radio"
                    name="chart-mode"
                    value="absolute"
                    checked={chartMode === "absolute"}
                    onChange={() => setChartMode("absolute")}
                    className="size-4 border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30"
                  />
                  Absolute
                </Label>
                <Label className="cursor-pointer font-normal text-slate-700">
                  <input
                    type="radio"
                    name="chart-mode"
                    value="cumulative"
                    checked={chartMode === "cumulative"}
                    onChange={() => setChartMode("cumulative")}
                    className="size-4 border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30"
                  />
                  Cumulative
                </Label>
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-slate-200 bg-white text-slate-700 shadow-none"
              >
                <CalendarDays className="size-4 text-slate-500" />
                Roll up by: Days
                <ChevronDown className="size-4 text-slate-400" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-slate-200 bg-white text-slate-700 shadow-none"
              >
                <CalendarDays className="size-4 text-slate-500" />
                Jan 01, 2026 - Dec 31, 2026
                <ChevronDown className="size-4 text-slate-400" />
              </Button>
            </div>
          </div>

          <ChartContainer
            config={CHART_CONFIG}
            className="aspect-[2.4/1] h-[320px] w-full"
          >
            <LineChart
              data={SEASONALITY_CHART_DATA}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[1400, 2800]}
                ticks={[1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800]}
                tickFormatter={formatCurrency}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelKey="date"
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-budget)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
