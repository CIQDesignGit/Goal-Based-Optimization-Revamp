"use client";

import { format } from "date-fns";
import { ChevronDown, Info, Lightbulb, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DataFromId =
  | "last-bid-change"
  | "last-365"
  | "last-120"
  | "last-30"
  | "last-3"
  | "last-14-except-2";

export type ActionTypeId =
  | "bid-change"
  | "enable"
  | "pause"
  | "archive";

export type BidModeId = "set" | "increase" | "decrease";

export type RuleDetailState = {
  dataFrom: DataFromId;
  actionType: ActionTypeId;
  bidMode: BidModeId;
  changeBy: "percentage" | "amount";
  changeValue: string;
  ceilingBid: string;
  pauseMetric: string;
  pauseOp: string;
  pauseValue: string;
  startDate: Date;
  endDate: Date | undefined;
};

export const DEFAULT_RULE_DETAIL_STATE: RuleDetailState = {
  dataFrom: "last-bid-change",
  actionType: "bid-change",
  bidMode: "increase",
  changeBy: "percentage",
  changeValue: "10.0",
  ceilingBid: "2",
  pauseMetric: "clicks",
  pauseOp: ">=",
  pauseValue: "10",
  startDate: new Date(2026, 6, 14),
  endDate: undefined,
};

const DATA_FROM_OPTIONS: { id: DataFromId; label: string }[] = [
  { id: "last-bid-change", label: "Last bid change" },
  { id: "last-365", label: "Last 365 days" },
  { id: "last-120", label: "Last 120 days" },
  { id: "last-30", label: "Last 30 days" },
  { id: "last-3", label: "Last 3 days" },
  { id: "last-14-except-2", label: "Last 14 days except last 2 days" },
];

const ACTION_TYPES: { id: ActionTypeId; label: string }[] = [
  { id: "bid-change", label: "Bid change" },
  { id: "enable", label: "Enable keyword/target" },
  { id: "pause", label: "Pause keyword/target" },
  { id: "archive", label: "Archive keyword/target" },
];

const BID_MODES: { id: BidModeId; label: string }[] = [
  { id: "set", label: "Set new bid" },
  { id: "increase", label: "Increase bid" },
  { id: "decrease", label: "Decrease bid" },
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
        selected
          ? "border-blue-500 bg-white text-blue-600"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  "aria-label": string;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-8 appearance-none rounded-md border border-slate-200 bg-white py-1.5 pr-8 pl-2.5",
          "text-xs font-medium text-slate-700 outline-none",
          "focus-visible:ring-2 focus-visible:ring-blue-500/40",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </div>
  );
}

type RuleBasedStrategyDetailSectionsProps = {
  /** e.g. "Keyword" — used in Conditions / Actions headings. */
  applyTargetLabel: string;
  scopeName: string;
  objectiveLabel: string;
  scopeSummary: string;
  detail: RuleDetailState;
  onDetailChange: (patch: Partial<RuleDetailState>) => void;
};

/**
 * Lower half of the Rule Based editor — Conditions, Actions, Time period, Review.
 * Visual layout matches product screenshots (card sections).
 */
export function RuleBasedStrategyDetailSections({
  applyTargetLabel,
  scopeName,
  objectiveLabel,
  scopeSummary,
  detail,
  onDetailChange,
}: RuleBasedStrategyDetailSectionsProps) {
  const dataFromLabel =
    DATA_FROM_OPTIONS.find((item) => item.id === detail.dataFrom)?.label ??
    "Last bid change";
  const actionLabel =
    ACTION_TYPES.find((item) => item.id === detail.actionType)?.label ??
    "Bid change";
  const startLabel = format(detail.startDate, "MMM d, yyyy");
  const endLabel = detail.endDate
    ? format(detail.endDate, "MMM d, yyyy")
    : "forever";

  return (
    <div className="space-y-4">
      {/* —— Conditions —— */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          What conditions do you want {applyTargetLabel} to meet?
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          CommerceIQ only takes an action when the conditions you specify are
          met.
        </p>

        <div className="mt-4 flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="size-3.5" />
            Add Filters
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-800">
            Using data from:
          </p>
          <div className="flex flex-wrap gap-2">
            {DATA_FROM_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={detail.dataFrom === item.id}
                onClick={() => onDetailChange({ dataFrom: item.id })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* —— Actions —— */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900">
              What actions do you want to take on {applyTargetLabel}?
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Specify the actions you want to be performed on items identified
              before. If all conditions you specify are met, CommerceIQ takes
              automated actions.
            </p>
          </div>
          <div className="flex max-w-[220px] shrink-0 items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5">
            <Lightbulb
              className="mt-0.5 size-4 shrink-0 text-blue-500"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600">IQ Tip</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                Keyword scope also includes Targets, like in Campaign Management
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ACTION_TYPES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={detail.actionType === item.id}
              onClick={() => onDetailChange({ actionType: item.id })}
            />
          ))}
        </div>

        {detail.actionType === "bid-change" ? (
          <div className="mt-5 flex flex-wrap items-start gap-10">
            <fieldset className="space-y-3">
              <legend className="sr-only">Bid change mode</legend>
              {BID_MODES.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="bid-mode"
                    value={item.id}
                    checked={detail.bidMode === item.id}
                    onChange={() => onDetailChange({ bidMode: item.id })}
                    className="size-4 accent-blue-600"
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <NativeSelect
                  aria-label="Change by"
                  value={detail.changeBy}
                  onChange={(value) =>
                    onDetailChange({
                      changeBy: value as "percentage" | "amount",
                    })
                  }
                  options={[
                    { value: "percentage", label: "Change by percentage" },
                    { value: "amount", label: "Change by amount" },
                  ]}
                />
                <div className="flex items-center gap-1">
                  <Input
                    value={detail.changeValue}
                    onChange={(event) =>
                      onDetailChange({ changeValue: event.target.value })
                    }
                    className="h-8 w-16 border-slate-200 px-2 text-xs shadow-none"
                    aria-label="Change value"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    {detail.changeBy === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ceiling-bid"
                  className="block text-xs font-medium text-slate-700"
                >
                  Ceiling bid
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">$</span>
                  <Input
                    id="ceiling-bid"
                    value={detail.ceilingBid}
                    onChange={(event) =>
                      onDetailChange({ ceilingBid: event.target.value })
                    }
                    className="h-8 w-16 border-slate-200 px-2 text-xs shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-700">
          <span>Pause taking actions on this {applyTargetLabel} until</span>
          <NativeSelect
            aria-label="Pause metric"
            value={detail.pauseMetric}
            onChange={(value) => onDetailChange({ pauseMetric: value })}
            options={[
              { value: "clicks", label: "clicks" },
              { value: "orders", label: "orders" },
              { value: "spend", label: "spend" },
            ]}
          />
          <NativeSelect
            aria-label="Pause operator"
            value={detail.pauseOp}
            onChange={(value) => onDetailChange({ pauseOp: value })}
            options={[
              { value: ">=", label: ">=" },
              { value: ">", label: ">" },
              { value: "<=", label: "<=" },
              { value: "<", label: "<" },
              { value: "=", label: "=" },
            ]}
          />
          <Input
            value={detail.pauseValue}
            onChange={(event) =>
              onDetailChange({ pauseValue: event.target.value })
            }
            className="h-8 w-14 border-slate-200 px-2 text-xs shadow-none"
            aria-label="Pause until value"
          />
        </div>
      </section>

      {/* —— Time period —— */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          What is the time period of this strategy?
        </h3>
        <div className="mt-1 space-y-1 text-xs leading-relaxed text-slate-500">
          <p>
            Start time is from when CommerceIQ will run this strategy. End date
            is when CommerceIQ will pause this strategy. To ensure strategies
            run automatically continuously, please select No end date.
          </p>
          <p>
            The strategy will run every day at 5 AM PST and actions will be
            taken at 5:10 AM PST.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700">
              Start Date:
            </span>
            <DatePicker
              value={detail.startDate}
              onChange={(date) => {
                if (date) onDetailChange({ startDate: date });
              }}
              dateFormat="MMM d, yyyy"
              placeholder="Pick date"
              aria-label="Start date"
              className="h-8 w-auto min-w-[140px] rounded-full border-slate-200 px-3 text-xs shadow-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700">
              End Date:
            </span>
            <DatePicker
              value={detail.endDate}
              onChange={(date) => onDetailChange({ endDate: date })}
              dateFormat="MMM d, yyyy"
              placeholder="No Date"
              aria-label="End date"
              className="h-8 w-auto min-w-[120px] rounded-full border-slate-200 px-3 text-xs shadow-none"
            />
          </div>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />

          <p className="flex max-w-xs items-start gap-1.5 text-xs leading-snug text-slate-500">
            <Info
              className="mt-0.5 size-3.5 shrink-0 text-slate-400"
              aria-hidden
            />
            Not setting an end date is equivalent to this strategy running
            forever.
          </p>
        </div>
      </section>

      {/* —— Review —— */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Review the strategy:
          </h3>
          <div className="mt-1 space-y-0.5 text-xs leading-relaxed text-slate-500">
            <p>
              Choosing this saves the strategy to be activated from your
              specified start date.
            </p>
            <p>To review this strategy later, choose Save Draft.</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {(
              [
                {
                  title: "1.Objective",
                  body: objectiveLabel,
                },
                {
                  title: "2.Scope",
                  body: scopeSummary,
                },
                {
                  title: "3.Condition",
                  body: `BRAND_IROAS >= $8.0 and Keyword Type : CATEGORY from ${dataFromLabel}`,
                },
                {
                  title: "4.Actions",
                  body: actionLabel,
                },
                {
                  title: "5.Time Period",
                  body: `${startLabel} Until ${endLabel}`,
                },
              ] as const
            ).map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  "min-w-0 px-0 lg:px-3",
                  index > 0 && "lg:border-l lg:border-slate-200",
                )}
              >
                <p className="text-xs font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-600">
            See an output sample if the strategy runs now.
          </p>
          <button
            type="button"
            className="text-xs font-bold tracking-wide text-slate-700 uppercase hover:text-blue-700"
          >
            Simulate Strategy
          </button>
        </div>
      </section>
    </div>
  );
}
