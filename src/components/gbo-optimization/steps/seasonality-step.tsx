"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { SeasonalityEventsSection } from "@/components/gbo-optimization/seasonality-events-section";
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
  LEVEL_1_OPTIONS,
  MOCK_SAVED_SEASONALITY_EVENTS,
  SEASONALITY_CHART_DATA,
  type SeasonalityEvent,
} from "@/lib/gbo-optimization/setup-data";
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

export function SeasonalityStep() {
  // Seed with mock saved events so the list is visible for UX review.
  const [events, setEvents] = useState<SeasonalityEvent[]>(
    () => [...MOCK_SAVED_SEASONALITY_EVENTS],
  );
  const [viewMode, setViewMode] = useState<"entire-business" | "portfolio">(
    "entire-business",
  );
  const [portfolio, setPortfolio] = useState<string | null>("portfolio");
  const [chartMode, setChartMode] = useState<"absolute" | "cumulative">(
    "absolute",
  );

  return (
    <div className="flex flex-col gap-6 py-4">
      <h2 className="text-base font-medium text-slate-900">
        Cumulative budget plan for the year 2026
      </h2>

      <SeasonalityEventsSection
        events={events}
        onAddEvent={(event) => setEvents((current) => [...current, event])}
        onUpdateEvent={(updatedEvent) =>
          setEvents((current) =>
            current.map((event) =>
              event.id === updatedEvent.id ? updatedEvent : event,
            ),
          )
        }
        onRemoveEvent={(eventId) =>
          setEvents((current) => current.filter((event) => event.id !== eventId))
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-10 rounded-md border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("entire-business")}
              className={cn(
                "flex h-full items-center rounded px-3 text-sm font-medium transition-colors",
                viewMode === "entire-business"
                  ? "border border-brand-600 text-brand-600"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Entire Business
            </button>
            <button
              type="button"
              onClick={() => setViewMode("portfolio")}
              className={cn(
                "flex h-full items-center gap-1 rounded px-3 text-sm font-medium transition-colors",
                viewMode === "portfolio"
                  ? "border border-brand-600 text-brand-600"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Portfolio
              <ChevronDown className="size-4" />
            </button>
          </div>

          {viewMode === "portfolio" && (
            <div className="w-44">
              <SetupInlineSelect
                label="Portfolio"
                hideLabel
                value={portfolio}
                options={LEVEL_1_OPTIONS}
                placeholder="Select portfolio"
                onValueChange={setPortfolio}
              />
            </div>
          )}
        </div>

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

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-slate-200 bg-white text-slate-700 shadow-none"
            >
              <CalendarDays className="size-4 text-slate-500" />
              Roll up by: Days
              <ChevronDown className="size-4 text-slate-400" />
            </Button>
          </div>

          <ChartContainer config={CHART_CONFIG} className="aspect-[2.4/1] h-[320px] w-full">
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
