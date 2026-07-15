"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Minus,
  Pause,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader } from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type HourlyBidderPanelMode = "edit" | "add";

type HourlyBidderPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Brand / scope name shown in the panel title. */
  scopeName: string;
  /** Summary label used to seed the strategy name field when the panel opens. */
  strategyLabel: string;
  /** edit = Day Parting tile; add = "+" button. */
  mode?: HourlyBidderPanelMode;
  onApply?: (label: string) => void;
};

type CampaignOption = {
  id: string;
  name: string;
};

const SAMPLE_CAMPAIGNS: CampaignOption[] = [
  { id: "c1", name: "SD | Competitor | Contextual | Fresh" },
  { id: "c2", name: "SP | AUTO | Just Bare Fresh - CC" },
  { id: "c3", name: "SP | MANUAL | Fresh | Brand Defense" },
  { id: "c4", name: "SBV | Manual | Prepared | Head" },
  { id: "c5", name: "SP | AUTO | Frozen Prepared - Catch" },
  { id: "c6", name: "SD | Category | Broad | Ocean" },
  { id: "c7", name: "SP | MANUAL | Pilgrims | Competitor" },
];

const TARGET_LOAD_MS = 4000;

const DEFAULT_STRATEGY_PLACEHOLDERS = new Set([
  "Hourly Bidder",
  "Hourly Bid...",
]);

function resolveInitialStrategyName(
  strategyLabel: string,
  isAddMode: boolean,
): string {
  if (isAddMode) {
    return "New hourly bidder strategy";
  }

  if (DEFAULT_STRATEGY_PLACEHOLDERS.has(strategyLabel)) {
    return "Goal Based Optimiser Default HB Strategy";
  }

  return strategyLabel;
}

const SKELETON_ROW_CLASSES = [
  "w-11/12",
  "w-3/4",
  "w-4/5",
  "w-2/3",
  "w-5/6",
] as const;

function SkeletonBone({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-md", className)} aria-hidden />
  );
}

function TargetListSkeleton({ scopeName }: { scopeName: string }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Hero status — calm, branded, informative */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-linear-to-br from-brand-50 via-white to-sky-50 px-5 py-5">
        <div
          className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-brand-200/30 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-white shadow-sm">
            <Loader variant="circular" size="md" className="border-brand-500" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Preparing campaigns for {scopeName}
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                Matching eligible campaigns to this strategy, then assembling
                your available list and target list.
              </p>
            </div>

            {/* Soft progress track so waiting feels purposeful */}
            <div className="space-y-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-100">
                <div className="loader-progress-bar h-full rounded-full bg-brand-500" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-brand-500" />
                  Scanning portfolio
                </span>
                <span className="text-slate-300">·</span>
                <span>Building target lists</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual-list skeleton preview */}
      <div className="grid gap-4 bg-slate-50/80 p-4 md:grid-cols-2">
        {(
          [
            { title: "Campaigns", rows: 5 },
            { title: "Target List", rows: 3 },
          ] as const
        ).map((panel) => (
          <div
            key={panel.title}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3">
              <SkeletonBone className="h-3.5 w-28" />
              <SkeletonBone className="h-5 w-8 rounded-full" />
            </div>
            <div className="border-b border-slate-100 p-3">
              <SkeletonBone className="h-8 w-full rounded-md" />
            </div>
            <ul className="divide-y divide-slate-50">
              {Array.from({ length: panel.rows }).map((_, row) => (
                <li
                  key={row}
                  className="flex items-center gap-2.5 px-3.5 py-3"
                >
                  <SkeletonBone
                    className={cn(
                      "h-3.5 rounded",
                      SKELETON_ROW_CLASSES[row % SKELETON_ROW_CLASSES.length],
                    )}
                  />
                  <SkeletonBone className="ml-auto size-6 shrink-0 rounded-md" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 bg-white px-4 py-3 text-center">
        <p className="text-xs text-slate-400">
          Almost there — you can search and move campaigns as soon as this
          finishes.
        </p>
      </div>
    </div>
  );
}

type TargetListStatus = "added" | "removed" | "unchanged";

function TargetPicker({
  campaigns,
  selectedIds,
  /** Snapshot when the panel opened — used to mark adds (green) / deletes (red). */
  baselineSelectedIds,
  onToggle,
}: {
  campaigns: CampaignOption[];
  selectedIds: string[];
  baselineSelectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [availableQuery, setAvailableQuery] = useState("");
  const [selectedQuery, setSelectedQuery] = useState("");

  const baselineSet = useMemo(
    () => new Set(baselineSelectedIds),
    [baselineSelectedIds],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Left list: not currently selected, and not a pending deletion (those stay on the right in red).
  const available = useMemo(() => {
    const q = availableQuery.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (selectedSet.has(c.id)) return false;
      if (baselineSet.has(c.id)) return false; // deleted-from-baseline → Target List (red)
      return !q || c.name.toLowerCase().includes(q);
    });
  }, [campaigns, selectedSet, baselineSet, availableQuery]);

  // Right list: current targets + baseline items the user removed (so deletes stay visible).
  const targetRows = useMemo(() => {
    const q = selectedQuery.trim().toLowerCase();
    const matches = (name: string) => !q || name.toLowerCase().includes(q);
    const rows: { campaign: CampaignOption; status: TargetListStatus }[] = [];

    for (const campaign of campaigns) {
      if (!selectedSet.has(campaign.id) || !matches(campaign.name)) continue;
      rows.push({
        campaign,
        status: baselineSet.has(campaign.id) ? "unchanged" : "added",
      });
    }

    for (const campaign of campaigns) {
      if (!baselineSet.has(campaign.id) || selectedSet.has(campaign.id)) {
        continue;
      }
      if (!matches(campaign.name)) continue;
      rows.push({ campaign, status: "removed" });
    }

    return rows;
  }, [campaigns, selectedSet, baselineSet, selectedQuery]);

  const selectedCount = selectedIds.length;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-800">
          Campaigns ({available.length})
        </div>
        <div className="relative border-b border-slate-100 p-2.5">
          <Search className="pointer-events-none absolute top-1/2 left-4.5 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={availableQuery}
            onChange={(e) => setAvailableQuery(e.target.value)}
            placeholder="Search"
            className="h-8 border-slate-200 pl-8 text-xs shadow-none"
          />
        </div>
        <ul className="max-h-56 divide-y divide-slate-50 overflow-y-auto">
          {available.map((campaign) => (
            <li
              key={campaign.id}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700"
            >
              <span className="min-w-0 flex-1 truncate">{campaign.name}</span>
              <button
                type="button"
                aria-label={`Add ${campaign.name}`}
                onClick={() => onToggle(campaign.id)}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              >
                <Plus className="size-3.5" />
              </button>
            </li>
          ))}
          {available.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-slate-400">
              No matching campaigns
            </li>
          ) : null}
        </ul>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-800">
          Target List ({selectedCount})
        </div>
        <div className="relative border-b border-slate-100 p-2.5">
          <Search className="pointer-events-none absolute top-1/2 left-4.5 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
            placeholder="Search"
            className="h-8 border-slate-200 pl-8 text-xs shadow-none"
          />
        </div>
        <ul className="max-h-56 divide-y divide-slate-50 overflow-y-auto">
          {targetRows.map(({ campaign, status }) => (
            <li
              key={campaign.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700",
                status === "added" && "bg-green-50",
                status === "removed" && "bg-red-50",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  status === "removed" && "line-through text-slate-500",
                )}
              >
                {campaign.name}
              </span>
              <button
                type="button"
                aria-label={
                  status === "removed"
                    ? `Restore ${campaign.name}`
                    : `Remove ${campaign.name}`
                }
                onClick={() => onToggle(campaign.id)}
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/70",
                  status === "removed"
                    ? "hover:text-brand-600"
                    : "hover:text-error-600",
                )}
              >
                {status === "removed" ? (
                  <Plus className="size-3.5" />
                ) : (
                  <Minus className="size-3.5" />
                )}
              </button>
            </li>
          ))}
          {targetRows.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-slate-400">
              Add campaigns from the left list
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

/**
 * Right-side panel for Hourly Bidder Strategy.
 * Matches product layout: RULE (scope filters) + Target (campaign dual-list).
 */
export function HourlyBidderPanel({
  open,
  onOpenChange,
  scopeName,
  strategyLabel,
  mode = "edit",
  onApply,
}: HourlyBidderPanelProps) {
  const isAddMode = mode === "add";
  const [isTargetsLoading, setIsTargetsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Frozen when the panel opens — Target List compares against this for green/red highlights.
  const [baselineSelectedIds, setBaselineSelectedIds] = useState<string[]>([]);
  const [strategyName, setStrategyName] = useState(() =>
    resolveInitialStrategyName(strategyLabel, isAddMode),
  );

  // When the panel opens, briefly load targets (FR-022 style) then show the dual list.
  useEffect(() => {
    if (!open) {
      setIsTargetsLoading(false);
      return;
    }

    const initialIds = isAddMode ? [] : ["c4"];
    setStrategyName(resolveInitialStrategyName(strategyLabel, isAddMode));
    setSelectedIds(initialIds);
    setBaselineSelectedIds(initialIds);
    setIsTargetsLoading(true);

    const timer = window.setTimeout(() => {
      setIsTargetsLoading(false);
    }, TARGET_LOAD_MS);

    return () => window.clearTimeout(timer);
  }, [open, strategyLabel, scopeName, isAddMode]);

  const handleToggleCampaign = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleConfirm = () => {
    // Persist internal strategy name for panel reopen — the table tile stays "Hourly Bidder".
    const label = strategyName.trim() || "Hourly Bidder";
    onApply?.(label);
    onOpenChange(false);
  };

  const canSave = !isTargetsLoading && selectedIds.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-[70vw]! max-w-none! gap-0 border-slate-200 bg-white p-0 sm:w-[70vw]! sm:max-w-none!"
      >
        <SheetHeader className="space-y-1 border-b border-slate-200 px-5 py-4 pr-12 text-left">
          <SheetTitle className="text-lg font-semibold text-slate-900">
            Hourly Bidder Strategy
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500">
            {strategyName}
            <span className="mt-0.5 block text-xs text-slate-400">
              Scope: {scopeName}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          {/* RULE — set strategy scope */}
          <section className="space-y-2">
            <div>
              <h3 className="text-xs font-bold tracking-wide text-brand-600 uppercase">
                Rule
              </h3>
              <p className="text-sm text-slate-500">
                Set a scope for the strategy.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-slate-600 hover:text-slate-800"
              >
                <Plus className="size-3.5" />
                Add Filters
              </Button>
            </div>
          </section>

          {/* Target — finalize campaign target list */}
          <section className="space-y-2">
            <div>
              <h3 className="text-xs font-bold tracking-wide text-brand-600 uppercase">
                Target
              </h3>
              <p className="text-sm text-slate-500">
                Finalise your target list.
              </p>
            </div>

            {isTargetsLoading ? (
              <TargetListSkeleton scopeName={scopeName} />
            ) : (
              <TargetPicker
                campaigns={SAMPLE_CAMPAIGNS}
                selectedIds={selectedIds}
                baselineSelectedIds={baselineSelectedIds}
                onToggle={handleToggleCampaign}
              />
            )}
          </section>
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isTargetsLoading}
            className="gap-1.5 border-slate-200 text-slate-600"
          >
            <Trash2 className="size-3.5" />
            Delete Strategy
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              className="gap-1.5 border-slate-200 text-slate-400"
            >
              <Pause className="size-3.5" />
              Pause
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              onClick={handleConfirm}
              className={cn(
                "min-w-36 gap-1.5 bg-brand-600 text-white hover:bg-brand-700",
                !canSave && "cursor-not-allowed opacity-50",
              )}
            >
              {isTargetsLoading ? (
                <>
                  <Loader
                    variant="circular"
                    size="sm"
                    className="border-white"
                  />
                  Loading…
                </>
              ) : (
                "Confirm & Save"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type DayPartingTileProps = {
  scopeName: string;
  label: string;
  /** True when a day-parting strategy already exists for this row. */
  hasStrategy: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onReset: () => void;
};

const CLEAR_DRAFT_TOOLTIP =
  "Clear draft strategies — all unsaved draft settings for this scope will be lost";

/** Shared style for Optimizer cell action icons (+ / refresh). */
export const OPTIMIZER_ACTION_ICON_CLASS =
  "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700";

/**
 * Reset / refresh control with hover tooltip and a confirm dialog (FR-020).
 * Used in Day Parting, Budget Optimization, and Bid Optimization cells.
 */
export function ClearDraftStrategiesButton({
  scopeName,
  onConfirm,
  description,
}: {
  scopeName: string;
  onConfirm: () => void;
  /** Optional extra context for the dialog body (defaults to day-parting copy). */
  description?: ReactNode;
}) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  return (
    <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={`Clear draft strategies for ${scopeName}`}
              className={OPTIMIZER_ACTION_ICON_CLASS}
              onClick={(event) => {
                event.stopPropagation();
                setClearDialogOpen(true);
              }}
            />
          }
        >
          <RefreshCw className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">{CLEAR_DRAFT_TOOLTIP}</TooltipContent>
      </Tooltip>

      <AlertDialogContent
        size="default"
        className={cn(
          "gap-0 overflow-hidden rounded-xl bg-white p-0 shadow-xl ring-1 ring-slate-200",
          "!max-w-[calc(100%-2rem)] sm:!max-w-lg",
        )}
      >
        <AlertDialogHeader
          className={cn(
            "m-0 !grid w-full !place-items-stretch gap-0 border-b border-slate-200 p-0 text-left",
            "sm:!place-items-stretch sm:text-left",
          )}
        >
          <div className="flex w-full items-center justify-between gap-3 px-5 py-4">
            <AlertDialogTitle className="min-w-0 flex-1 text-left text-base font-semibold text-slate-900">
              Clear draft strategies
            </AlertDialogTitle>
            <AlertDialogCancel
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              className="ml-auto size-8 shrink-0 border-0 bg-transparent text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-4" />
            </AlertDialogCancel>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 px-5 py-4">
          <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
            {description ?? (
              <>
                You are about to clear the day parting strategy for{" "}
                <span className="font-semibold text-slate-800">{scopeName}</span>
                . This cannot be undone.
              </>
            )}
          </AlertDialogDescription>
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">
              Clear draft strategies
            </span>
            {" — "}
            Removes the current draft strategy for this scope. All unsaved
            settings will be lost.
          </p>
        </div>

        <AlertDialogFooter
          className={cn(
            "m-0 -mx-0 -mb-0 flex flex-row items-center justify-end gap-3 rounded-none border-t border-slate-200 bg-white p-4",
            "sm:flex-row sm:justify-end",
          )}
        >
          <AlertDialogCancel
            variant="link"
            className="h-auto px-0 text-brand-600 no-underline hover:text-brand-700 hover:no-underline"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-error-600 px-3 text-white hover:bg-error-700"
            onClick={() => {
              onConfirm();
              setClearDialogOpen(false);
            }}
          >
            Clear draft strategies
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Day Parting cell control.
 * - Primary tile on the left; outlined + / refresh pinned to the right edge
 * - No strategy → "+" only (create)
 * - Strategy present → logo + name tile (edit on click; pencil shows on hover)
 * - Clear control warns first (FR-020) before discarding draft strategies
 */
export function DayPartingTile({
  scopeName,
  label,
  hasStrategy,
  onOpen,
  onAdd,
  onReset,
}: DayPartingTileProps) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2">
      <div className="min-w-0 shrink">
        {hasStrategy ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Edit day parting strategy for ${scopeName}`}
            className={cn(
              "group inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs shadow-none transition-colors",
              "hover:border-brand-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
            )}
          >
            <Image
              src="/icons/day-parting.png"
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0"
              aria-hidden
            />
            <span className="truncate font-medium text-slate-700">{label}</span>
            <Pencil
              className="size-3.5 shrink-0 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={`Add day parting strategy for ${scopeName}`}
          title="Add day parting strategy"
          className={OPTIMIZER_ACTION_ICON_CLASS}
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
        >
          <Plus className="size-3.5" />
        </Button>

        {hasStrategy ? (
          <ClearDraftStrategiesButton
            scopeName={scopeName}
            onConfirm={onReset}
          />
        ) : null}
      </div>
    </div>
  );
}
