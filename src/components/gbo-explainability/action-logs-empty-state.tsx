"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarOff,
  FilterX,
  Inbox,
  Link2Off,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DemoPageState } from "@/lib/gbo-explainability/types";

type EmptyKind =
  | DemoPageState
  | "no-results"
  | "no-activity";

const COPY: Record<
  EmptyKind,
  {
    icon: LucideIcon;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
    ctaAction?: "clear-filters";
  }
> = {
  "unsupported-retailer": {
    icon: Store,
    title: "GBO isn’t available for this retailer",
    description:
      "Action Logs only appear when Goal Based Optimization is supported for the retailer.",
  },
  "strategy-not-live": {
    icon: Inbox,
    title: "No GBO activity yet",
    description:
      "Set up and launch a GBO strategy to start seeing changes here.",
    ctaLabel: "Set up a strategy",
    ctaHref: "/gbo-optimization",
  },
  "purged-entry": {
    icon: Link2Off,
    title: "This entry is no longer available",
    description:
      "It’s older than the retention window (13 months). Open Action Logs to browse recent activity.",
    ctaLabel: "Back to Action Logs",
    ctaAction: "clear-filters",
  },
  "no-results": {
    icon: FilterX,
    title: "No results for these filters",
    description:
      "Try clearing filters or widening the date range. This is different from having no activity at all.",
    ctaLabel: "Clear filters",
    ctaAction: "clear-filters",
  },
  "no-activity": {
    icon: CalendarOff,
    title: "No activity in this range",
    description:
      "Nothing was logged for the selected dates. Adjust the date range or check back after the next Ally AI run.",
  },
  live: {
    icon: Inbox,
    title: "No activity yet",
    description: "Changes will show up here once GBO is live.",
  },
};

type ActionLogsEmptyStateProps = {
  kind: EmptyKind;
  onClearFilters?: () => void;
};

/** One template, five messages — consistency over customization. */
export function ActionLogsEmptyState({
  kind,
  onClearFilters,
}: ActionLogsEmptyStateProps) {
  const config = COPY[kind];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="max-w-md space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          {config.title}
        </h2>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
      {config.ctaHref ? (
        <Button render={<Link href={config.ctaHref} />}>{config.ctaLabel}</Button>
      ) : null}
      {config.ctaAction === "clear-filters" && onClearFilters ? (
        <Button variant="outline" onClick={onClearFilters}>
          {config.ctaLabel}
        </Button>
      ) : null}
    </div>
  );
}
