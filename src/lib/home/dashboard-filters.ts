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

/** Default 14-day window ending on the prototype as-of date (Jul 28, 2026). */
export function buildDefaultDashboardFilters(): DashboardFilters {
  return {
    retailer: "Amazon",
    brandId: "all",
    dateFrom: "2026-07-15",
    dateTo: "2026-07-28",
    attributionWindow: "14d",
  };
}

/** Human-readable range for buttons (e.g. Jul 15, 2026 - Jul 28, 2026). */
export function formatFilterDateRange(filters: DashboardFilters): string {
  return `${formatIsoDateLabel(filters.dateFrom)} - ${formatIsoDateLabel(filters.dateTo)}`;
}

function formatIsoDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
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
  return `${months[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
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
