/** Shared dashboard filters for Executive Summary + Pacing tabs. */

export type AttributionWindow = "1d" | "7d" | "14d" | "30d";

export type DashboardFilters = {
  retailer: string;
  /** Brand / level filter; "all" = entire account. */
  brandId: string;
  dateFrom: string;
  dateTo: string;
  attributionWindow: AttributionWindow;
};

export const RETAILER_OPTIONS = [
  { value: "Amazon", label: "Amazon" },
  { value: "Walmart", label: "Walmart" },
] as const;

export const BRAND_OPTIONS = [
  { value: "all", label: "All brands" },
  { value: "jbc-fresh", label: "JBC Fresh" },
  { value: "pilgrims-core", label: "Pilgrims Core" },
] as const;

export const ATTRIBUTION_OPTIONS = [
  { value: "1d", label: "1-day" },
  { value: "7d", label: "7-day" },
  { value: "14d", label: "14-day" },
  { value: "30d", label: "30-day" },
] as const;

/** Data sources shown in the Add filter popover (product reference). */
export type DataSourceId =
  | "catalog-skus"
  | "campaigns"
  | "ad-targets"
  | "budget-pacing"
  | "sov-keywords";

export const DATA_SOURCE_OPTIONS: {
  id: DataSourceId;
  abbr: string;
  label: string;
}[] = [
  { id: "catalog-skus", abbr: "CS", label: "Catalog SKUs" },
  { id: "campaigns", abbr: "C", label: "Campaigns" },
  { id: "ad-targets", abbr: "AT", label: "Ad Targets" },
  { id: "budget-pacing", abbr: "BP", label: "Budget Pacing" },
  { id: "sov-keywords", abbr: "SoVK", label: "Share of Voice Keywords" },
];

/**
 * Default 14-day window ending on the prototype as-of date (Jul 28, 2026).
 * Stored as local datetime strings: `YYYY-MM-DDTHH:mm` (12:00 AM → 11:30 PM).
 */
export function buildDefaultDashboardFilters(): DashboardFilters {
  return {
    retailer: "Amazon",
    brandId: "all",
    dateFrom: "2026-07-15T00:00",
    dateTo: "2026-07-28T23:30",
    attributionWindow: "14d",
  };
}

/**
 * Parse a filter datetime. Accepts `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`.
 * Date-only `from` defaults to 12:00 AM; date-only `to` defaults to 11:30 PM when
 * `endOfDayIfDateOnly` is true.
 */
export function parseFilterDateTime(
  value: string,
  endOfDayIfDateOnly = false,
): Date {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (timePart) {
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y!, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  }
  if (endOfDayIfDateOnly) {
    return new Date(y!, (m ?? 1) - 1, d ?? 1, 23, 30, 0, 0);
  }
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** Persist a Date as local `YYYY-MM-DDTHH:mm` (no timezone shift). */
export function formatFilterDateTimeValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

/** Human-readable range for buttons (e.g. Jul 15, 2026 12:00 AM - Jul 28, 2026 11:30 PM). */
export function formatFilterDateRange(filters: DashboardFilters): string {
  return `${formatDateTimeLabel(filters.dateFrom, false)} - ${formatDateTimeLabel(filters.dateTo, true)}`;
}

function formatDateTimeLabel(iso: string, endOfDayIfDateOnly: boolean): string {
  const date = parseFilterDateTime(iso, endOfDayIfDateOnly);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const hour24 = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()} ${hour12}:${minute} ${period}`;
}

/** Count how many dashboard filters differ from the defaults. */
export function countActiveDashboardFilters(
  filters: DashboardFilters,
  defaults: DashboardFilters = buildDefaultDashboardFilters(),
): number {
  let count = 0;
  if (filters.retailer !== defaults.retailer) count += 1;
  if (filters.brandId !== defaults.brandId) count += 1;
  if (
    filters.dateFrom !== defaults.dateFrom ||
    filters.dateTo !== defaults.dateTo
  ) {
    count += 1;
  }
  if (filters.attributionWindow !== defaults.attributionWindow) count += 1;
  return count;
}

export type DashboardFilterChip = {
  id: string;
  categoryLabel: string;
  valueLabel: string;
};

/** Removable chips for non-default dashboard filters. */
export function buildDashboardFilterChips(
  filters: DashboardFilters,
  defaults: DashboardFilters = buildDefaultDashboardFilters(),
): DashboardFilterChip[] {
  const chips: DashboardFilterChip[] = [];

  if (filters.retailer !== defaults.retailer) {
    chips.push({
      id: "retailer",
      categoryLabel: "Retailer",
      valueLabel: filters.retailer,
    });
  }

  if (filters.brandId !== defaults.brandId) {
    const brand =
      BRAND_OPTIONS.find((o) => o.value === filters.brandId)?.label ??
      filters.brandId;
    chips.push({
      id: "brand",
      categoryLabel: "Brand",
      valueLabel: brand,
    });
  }

  if (
    filters.dateFrom !== defaults.dateFrom ||
    filters.dateTo !== defaults.dateTo
  ) {
    chips.push({
      id: "date",
      categoryLabel: "Date",
      valueLabel: formatFilterDateRange(filters),
    });
  }

  if (filters.attributionWindow !== defaults.attributionWindow) {
    const attr =
      ATTRIBUTION_OPTIONS.find((o) => o.value === filters.attributionWindow)
        ?.label ?? filters.attributionWindow;
    chips.push({
      id: "attribution",
      categoryLabel: "Attribution",
      valueLabel: attr,
    });
  }

  return chips;
}
