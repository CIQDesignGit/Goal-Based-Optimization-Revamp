"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Filter,
  GripVertical,
  Lightbulb,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_RULE_DETAIL_STATE,
  RuleBasedStrategyDetailSections,
  type RuleDetailState,
} from "@/components/gbo-optimization/rule-based-strategy-detail-sections";
import { cn } from "@/lib/utils";

export type RuleBasedPanelColumn = "budget" | "bid";

type RuleBasedStrategyPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Brand / scope name (e.g. "JBC Frozen Prepared"). */
  scopeName: string;
  /** Row id — used to keep drafts + Edited badges after Save / reopen. */
  rowId: string;
  column: RuleBasedPanelColumn;
  onSave?: () => void;
};

type RuleObjectiveId =
  | "improve-roas"
  | "increase-ctr"
  | "increase-cvr"
  | "grow-sov"
  | "grow-awareness"
  | "improve-retailer-profit"
  | "reduce-oos";

type ApplyTargetId = "campaign" | "keyword" | "search-terms" | "ams-skus";

type KeywordScopeId =
  | "all-active"
  | "all-active-paused"
  | "all-in-selected-campaigns";

type RuleItem = {
  id: string;
  order: number;
  active: boolean;
  /** Pipe-separated product-style rule title. */
  title: string;
  description: string;
  objective: RuleObjectiveId;
  applyTo: ApplyTargetId;
  keywordScope: KeywordScopeId;
};

const OBJECTIVES: { id: RuleObjectiveId; label: string }[] = [
  { id: "improve-roas", label: "Improve ROAS" },
  { id: "increase-ctr", label: "Increase Click through rate" },
  { id: "increase-cvr", label: "Increase Conversion rate" },
  { id: "grow-sov", label: "Grow Share of Voice" },
  { id: "grow-awareness", label: "Grow Awareness" },
  { id: "improve-retailer-profit", label: "Improve Retailer Profitability" },
  { id: "reduce-oos", label: "Reduce Out of Stock Risk" },
];

const APPLY_TARGETS: { id: ApplyTargetId; label: string }[] = [
  { id: "campaign", label: "Campaign" },
  { id: "keyword", label: "Keyword" },
  { id: "search-terms", label: "Search terms" },
  { id: "ams-skus", label: "AMS SKUs" },
];

const KEYWORD_SCOPES: { id: KeywordScopeId; label: string }[] = [
  { id: "all-active", label: "All active keywords" },
  { id: "all-active-paused", label: "All active and paused keywords" },
  {
    id: "all-in-selected-campaigns",
    label: "All keywords in selected campaigns",
  },
];

/** Prototype sample rules — mirrors product list density. */
function createSampleRules(scopeName: string): RuleItem[] {
  const scope = scopeName.toUpperCase().slice(0, 24) || "PORTFOLIO";
  return [
    {
      id: "r1",
      order: 1,
      active: true,
      title: `Reward High Brand iROAS | ${scope} | SB | CATEGORY | KEYWORD | $8.0 | Reward High Performer | 601`,
      description:
        "Increase Bids on CATEGORY KWs with BRAND_IROAS >= 8.0",
      objective: "improve-roas",
      applyTo: "keyword",
      keywordScope: "all-in-selected-campaigns",
    },
    {
      id: "r2",
      order: 2,
      active: true,
      title: `Reward High Brand iROAS | ${scope} | SP | CATEGORY | KEYWORD | $5.0 | Reward High Performer | 602`,
      description:
        "Increase Bids on CATEGORY KWs with BRAND_IROAS >= 5.0",
      objective: "improve-roas",
      applyTo: "keyword",
      keywordScope: "all-active",
    },
    {
      id: "r3",
      order: 3,
      active: true,
      title: `Protect Low Brand iROAS | ${scope} | SB | CATEGORY | KEYWORD | $2.0 | Protect Low Performer | 603`,
      description:
        "Decrease Bids on CATEGORY KWs with BRAND_IROAS < 2.0",
      objective: "improve-roas",
      applyTo: "keyword",
      keywordScope: "all-active-paused",
    },
    {
      id: "r4",
      order: 4,
      active: true,
      title: `Maintain Avg Brand ROAS | ${scope} | SP | AUTO | CAMPAIGN | 12% | Maintain Average | 604`,
      description: "Hold campaign ROAS near portfolio average",
      objective: "improve-roas",
      applyTo: "campaign",
      keywordScope: "all-active",
    },
    {
      id: "r5",
      order: 5,
      active: false,
      title: `Grow SOV Head Terms | ${scope} | SB | BRAND | KEYWORD | 20% | Grow Share of Voice | 605`,
      description: "Raise bids on brand head terms to grow SOV",
      objective: "grow-sov",
      applyTo: "keyword",
      keywordScope: "all-in-selected-campaigns",
    },
    {
      id: "r6",
      order: 6,
      active: true,
      title: `Boost CTR Competitive | ${scope} | SP | COMPETITOR | KEYWORD | 3% | Increase CTR | 606`,
      description: "Increase bids when CTR is below 3% on competitor terms",
      objective: "increase-ctr",
      applyTo: "keyword",
      keywordScope: "all-active",
    },
    {
      id: "r7",
      order: 7,
      active: true,
      title: `Search Term Harvest | ${scope} | SP | SEARCH_TERM | $4.0 | Reward High Performer | 607`,
      description: "Promote converting search terms into keywords",
      objective: "increase-cvr",
      applyTo: "search-terms",
      keywordScope: "all-active",
    },
    {
      id: "r8",
      order: 8,
      active: true,
      title: `AMS SKU Profit Guard | ${scope} | SD | SKU | 15% | Improve Retailer Profit | 608`,
      description: "Throttle under-profit AMS SKUs",
      objective: "improve-retailer-profit",
      applyTo: "ams-skus",
      keywordScope: "all-active",
    },
  ];
}

function SelectionChip({
  label,
  selected,
  filled,
  onClick,
}: {
  label: string;
  selected: boolean;
  filled?: boolean;
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
        selected && filled
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : selected
            ? "border-blue-500 bg-white text-blue-600"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function createDefaultDetail(): RuleDetailState {
  return {
    ...DEFAULT_RULE_DETAIL_STATE,
    startDate: new Date(2026, 6, 14),
  };
}

function createDetailsByRuleId(
  rules: RuleItem[],
): Record<string, RuleDetailState> {
  const map: Record<string, RuleDetailState> = {};
  for (const rule of rules) {
    map[rule.id] = createDefaultDetail();
  }
  return map;
}

/** In-memory drafts per Optimizer row + column (survives panel close / Save / reopen). */
type RulePanelSnapshot = {
  rules: RuleItem[];
  selectedId: string;
  detailsByRuleId: Record<string, RuleDetailState>;
  /** Saved changes — list badge shows "Edited". */
  editedRuleIds: string[];
  /** Unsaved changes — list badge shows "Draft"; enables Save. */
  draftRuleIds: string[];
};

const rulePanelSnapshots = new Map<string, RulePanelSnapshot>();

function rulePanelSnapshotKey(rowId: string, column: RuleBasedPanelColumn) {
  return `${rowId}::${column}`;
}

/**
 * Wide right-side panel for editing Rule Based strategies.
 * Layout matches product: rule list (left) + rule editor (right) + footer.
 */
export function RuleBasedStrategyPanel({
  open,
  onOpenChange,
  scopeName,
  rowId,
  column,
  onSave,
}: RuleBasedStrategyPanelProps) {
  const initialRules = useMemo(
    () => createSampleRules(scopeName),
    [scopeName],
  );
  const [rules, setRules] = useState(initialRules);
  const [selectedId, setSelectedId] = useState(initialRules[0]?.id ?? "");
  // Per-rule Conditions/Actions/Time settings — switching rules keeps each draft.
  const [detailsByRuleId, setDetailsByRuleId] = useState(() =>
    createDetailsByRuleId(initialRules),
  );
  // Saved modifications → blue card + "Edited" badge.
  const [editedRuleIds, setEditedRuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  // Unsaved modifications → blue card + "Draft" badge; enables Save.
  const [draftRuleIds, setDraftRuleIds] = useState<Set<string>>(
    () => new Set(),
  );

  const hasUnsavedChanges = draftRuleIds.size > 0;

  // Keep latest values for persist-on-close (avoids stale closures).
  const draftRef = useRef({
    rules,
    selectedId,
    detailsByRuleId,
    editedRuleIds,
    draftRuleIds,
  });
  draftRef.current = {
    rules,
    selectedId,
    detailsByRuleId,
    editedRuleIds,
    draftRuleIds,
  };

  const persistDraft = () => {
    if (!rowId) return;
    const draft = draftRef.current;
    rulePanelSnapshots.set(rulePanelSnapshotKey(rowId, column), {
      rules: draft.rules,
      selectedId: draft.selectedId,
      detailsByRuleId: draft.detailsByRuleId,
      editedRuleIds: [...draft.editedRuleIds],
      draftRuleIds: [...draft.draftRuleIds],
    });
  };

  // Restore saved draft on open — keep Draft / Edited badges.
  useEffect(() => {
    if (!open || !rowId) return;

    const saved = rulePanelSnapshots.get(rulePanelSnapshotKey(rowId, column));
    if (saved) {
      setRules(saved.rules);
      setSelectedId(saved.selectedId);
      setDetailsByRuleId(saved.detailsByRuleId);
      setEditedRuleIds(new Set(saved.editedRuleIds));
      setDraftRuleIds(new Set(saved.draftRuleIds ?? []));
      return;
    }

    const next = createSampleRules(scopeName);
    setRules(next);
    setSelectedId(next[0]?.id ?? "");
    setDetailsByRuleId(createDetailsByRuleId(next));
    setEditedRuleIds(new Set());
    setDraftRuleIds(new Set());
  }, [open, rowId, column, scopeName]);

  const selected = rules.find((rule) => rule.id === selectedId) ?? rules[0];
  const detail =
    (selected && detailsByRuleId[selected.id]) ?? createDefaultDetail();

  const markEdited = (ruleId: string) => {
    // Unsaved → Draft (overrides Edited until Save).
    setDraftRuleIds((current) => {
      if (current.has(ruleId)) return current;
      const next = new Set(current);
      next.add(ruleId);
      return next;
    });
  };

  const selectRule = (ruleId: string) => {
    if (ruleId === selectedId) return;
    setSelectedId(ruleId);
  };

  const updateSelected = (patch: Partial<RuleItem>) => {
    if (!selected) return;
    markEdited(selected.id);
    setRules((current) =>
      current.map((rule) =>
        rule.id === selected.id ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const updateDetail = (patch: Partial<RuleDetailState>) => {
    if (!selected) return;
    markEdited(selected.id);
    setDetailsByRuleId((current) => ({
      ...current,
      [selected.id]: {
        ...(current[selected.id] ?? createDefaultDetail()),
        ...patch,
      },
    }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      persistDraft();
    }
    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if (!hasUnsavedChanges) return;

    // Promote Draft → Edited, then clear drafts.
    const nextEdited = new Set(editedRuleIds);
    for (const id of draftRuleIds) {
      nextEdited.add(id);
    }
    setEditedRuleIds(nextEdited);
    setDraftRuleIds(new Set());

    draftRef.current = {
      ...draftRef.current,
      editedRuleIds: nextEdited,
      draftRuleIds: new Set(),
    };
    persistDraft();
    onSave?.();
    onOpenChange(false);
  };

  const applyTargetLabel =
    APPLY_TARGETS.find((item) => item.id === selected?.applyTo)?.label ??
    "Keyword";
  const objectiveLabel =
    OBJECTIVES.find((item) => item.id === selected?.objective)?.label ??
    "Improve ROAS";
  const keywordScopeLabel =
    KEYWORD_SCOPES.find((item) => item.id === selected?.keywordScope)?.label ??
    "All keywords in selected campaigns";
  const scopeSummary =
    selected?.applyTo === "keyword"
      ? `${keywordScopeLabel} of Keyword in Portfolio : ${scopeName}`
      : `${applyTargetLabel} in Portfolio : ${scopeName}`;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[92vw]! max-w-[1180px]! gap-0 border-slate-200 bg-white p-0 sm:w-[92vw]! sm:max-w-[1180px]!"
      >
        <div className="flex min-h-0 flex-1">
          {/* —— Left: list of rules —— */}
          <aside className="flex w-[340px] shrink-0 flex-col border-r border-slate-200 bg-white">
            {/* Header: "List of rules - {scope}" + New Rule (matches product) */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                List of rules - {scopeName}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1 px-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <Plus className="size-3.5" />
                New Rule
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-slate-50 px-3 pt-3 pb-3">
              {/* Active / Paused section label with trailing rule */}
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="shrink-0 text-xs font-medium text-slate-500">
                  Active / Paused
                </span>
                <span className="h-px flex-1 bg-slate-200" aria-hidden />
              </div>

              <ul
                className="min-h-0 flex-1 space-y-2.5 overflow-y-auto"
                role="listbox"
                aria-label={`List of rules for ${scopeName}`}
              >
              {rules.map((rule) => {
                const isSelected = rule.id === selected?.id;
                const isDraft = draftRuleIds.has(rule.id);
                const isEditedSaved = editedRuleIds.has(rule.id) && !isDraft;
                const hasChangeMark = isDraft || editedRuleIds.has(rule.id);
                const statusLabel = isDraft
                  ? "Draft"
                  : isEditedSaved
                    ? "Edited"
                    : null;
                return (
                  <li key={rule.id}>
                    {/* Drag + toggle sit outside the card (product layout) */}
                    <div className="flex items-start gap-1.5">
                      <GripVertical
                        className="mt-2.5 size-3.5 shrink-0 text-slate-300"
                        aria-hidden
                      />
                      <span
                        className="mt-2 shrink-0"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Switch
                          size="sm"
                          checked={rule.active}
                          onCheckedChange={(checked) => {
                            markEdited(rule.id);
                            setRules((current) =>
                              current.map((item) =>
                                item.id === rule.id
                                  ? { ...item, active: checked === true }
                                  : item,
                              ),
                            );
                          }}
                          aria-label={`Toggle rule ${rule.order} active`}
                        />
                      </span>

                      <div
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onClick={() => selectRule(rule.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectRule(rule.id);
                          }
                        }}
                        className={cn(
                          "relative min-w-0 flex-1 cursor-pointer rounded-md border px-2 py-2 text-left transition-colors",
                          // Draft / Edited = blue border + blue-50. Selected keeps a stronger outline.
                          hasChangeMark
                            ? "border-blue-500 bg-blue-50 hover:border-blue-600"
                            : isSelected
                              ? "border-blue-500 bg-white"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                          isSelected && "ring-1 ring-inset ring-blue-500",
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-1.5">
                          <span
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold",
                              hasChangeMark
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {rule.order}
                          </span>
                          <Image
                            src="/icons/day-parting.png"
                            alt=""
                            width={14}
                            height={14}
                            className="mt-0.5 size-3.5 shrink-0 opacity-70"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 line-clamp-3 text-[11px] leading-snug text-slate-700">
                            {rule.title}
                          </span>
                        </div>
                        {statusLabel ? (
                          <span className="mt-1 inline-flex w-fit items-center rounded px-1 py-px text-[9px] font-semibold leading-tight tracking-wide text-blue-700 uppercase bg-blue-100">
                            {statusLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
              </ul>
            </div>
          </aside>

          {/* —— Right: selected rule editor —— */}
          <div className="flex min-w-0 flex-1 flex-col">
            <SheetHeader className="gap-1 space-y-0 border-b border-slate-200 px-5 py-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <SheetTitle className="flex items-start gap-2 text-sm font-semibold text-slate-900">
                    <Pencil
                      className="mt-0.5 size-3.5 shrink-0 text-slate-400"
                      aria-hidden
                    />
                    <span className="line-clamp-2 leading-snug">
                      {selected?.title ?? "Rule"}
                    </span>
                  </SheetTitle>
                  <SheetDescription className="pl-5 text-sm text-slate-600">
                    {selected?.description ?? ""}
                  </SheetDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  className="shrink-0 text-slate-500 hover:text-slate-700"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 px-5 py-5">
              {/* Objectives — card layout (matches product) */}
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    What is your objective?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose from a list of objectives to manage and track your
                    strategies better.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 px-5 py-4">
                  {OBJECTIVES.map((item) => (
                    <SelectionChip
                      key={item.id}
                      label={item.label}
                      selected={selected?.objective === item.id}
                      onClick={() => updateSelected({ objective: item.id })}
                    />
                  ))}
                </div>
              </section>

              {/* Apply strategy — card layout (matches product) */}
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Where do you want to apply this strategy?
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      A strategy can be applied to specific campaigns, keywords,
                      search terms or SKUs. This specifies items on which
                      conditions apply. Click any item below to narrow down on
                      options.
                    </p>
                  </div>
                  <div className="flex max-w-[200px] shrink-0 items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5">
                    <Lightbulb
                      className="mt-0.5 size-4 shrink-0 text-blue-500"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-600">
                        IQ Tip
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                        Keyword scope also includes Targets, like in Campaign
                        Management.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {APPLY_TARGETS.map((item) => (
                      <SelectionChip
                        key={item.id}
                        label={item.label}
                        selected={selected?.applyTo === item.id}
                        onClick={() => updateSelected({ applyTo: item.id })}
                      />
                    ))}
                  </div>

                  {selected?.applyTo === "keyword" ? (
                    <div className="flex flex-wrap gap-2">
                      {KEYWORD_SCOPES.map((item) => (
                        <SelectionChip
                          key={item.id}
                          label={item.label}
                          selected={selected.keywordScope === item.id}
                          filled
                          onClick={() =>
                            updateSelected({ keywordScope: item.id })
                          }
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                      <Filter
                        className="size-3 shrink-0 text-slate-400"
                        aria-hidden
                      />
                      Portfolio: {scopeName}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Remove portfolio filter"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-slate-600"
                    >
                      <Plus className="size-3.5" />
                      Add Filters
                    </Button>
                  </div>
                </div>
              </section>

              {/* Conditions / Actions / Time period / Review — product cards */}
              <RuleBasedStrategyDetailSections
                applyTargetLabel={applyTargetLabel}
                scopeName={scopeName}
                objectiveLabel={objectiveLabel}
                scopeSummary={scopeSummary}
                detail={detail}
                onDetailChange={updateDetail}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="m-0 flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            disabled
            className="gap-1.5 text-slate-400"
          >
            <Trash2 className="size-3.5" />
            Delete Strategy
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="bg-slate-500 text-white hover:bg-slate-600 disabled:opacity-50"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
