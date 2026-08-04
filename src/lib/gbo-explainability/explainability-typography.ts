/** L1–L4 typography scale for Explainability (Alerts + Action Log). */
export const explainabilityType = {
  /** Row claim / daily summary — scan line in collapsed row */
  l1: "text-sm font-medium leading-snug tracking-tight text-slate-700",
  /** Expanded section title — primary anchor inside open alert details */
  l2: "text-sm font-semibold tracking-tight text-slate-900",
  /** Entity names, field labels in content */
  l3: "text-sm font-medium text-slate-800",
  /** Metadata — email, timestamps, counts, helper copy */
  l4: "text-xs text-slate-500",
  /** Body copy inside hero/summary blocks */
  body: "text-sm leading-relaxed text-slate-700",
} as const;

/** Stable anchor ids for alert detail sections (signal tag linking). */
export function alertSectionId(
  alertId: string,
  section: "summary" | "manual" | "overrides" | "deviations" | "actions",
): string {
  return `${alertId}-section-${section}`;
}
