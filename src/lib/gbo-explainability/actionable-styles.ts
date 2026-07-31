/** Tailwind violet-500 base for interactive controls in the explainability / alerts flow. */
export const explainabilityActionable = {
  /** Slate focus ring for inputs and neutral controls. */
  slateFocus:
    "focus-visible:border-slate-400 focus-visible:ring-3 focus-visible:ring-slate-200/70",
  /** Filled primary actions — Apply Filter, View in Action Log, CTAs */
  primaryButton:
    "border-violet-500 bg-violet-500 text-white hover:border-violet-600 hover:bg-violet-600 hover:text-white focus-visible:border-slate-400 focus-visible:ring-slate-200/70",
  primaryOutlineButton:
    "border-violet-500 bg-white text-violet-500 shadow-none hover:border-violet-600 hover:bg-violet-50 hover:text-violet-600 focus-visible:border-slate-400 focus-visible:ring-slate-200/70",
  tabActive: "border-violet-500",
  clearLink:
    "text-violet-500 transition-colors hover:bg-violet-50 hover:text-violet-600",
  textLink: "text-violet-500 hover:text-violet-600 hover:underline",
  optionSelected: "bg-violet-50 font-medium text-violet-500",
  navActive: "bg-violet-50 font-medium text-violet-500",
  filterDot: "bg-violet-500",
  chevronActive: "text-violet-500",
  countBadge: "bg-violet-100 font-semibold text-violet-500",
  rowHover: "hover:bg-violet-50/80",
  paginationActive:
    "border-violet-500 bg-violet-50 text-violet-500 hover:bg-violet-50 hover:text-violet-500",
  tableSelected: "bg-violet-50/80 group-hover:bg-violet-50/80",
  tableSelectedMuted: "bg-violet-50/60 group-hover:bg-violet-50/60",
  tableRowHover: "group-hover:bg-violet-50/40",
  iconAction:
    "text-slate-500 hover:bg-violet-50 hover:text-violet-500 focus-visible:border-slate-400 focus-visible:ring-slate-200/70",
  /** Ally AI summary note in expanded alert rows */
  aiSummaryCard: "rounded-lg border border-violet-200 bg-violet-50 shadow-xs",
} as const;

/** Shared input chrome for explainability search and filter fields. */
export const explainabilityInputClass =
  "border-slate-200 bg-white text-sm shadow-none focus-visible:border-slate-400 focus-visible:ring-3 focus-visible:ring-slate-200/70";
