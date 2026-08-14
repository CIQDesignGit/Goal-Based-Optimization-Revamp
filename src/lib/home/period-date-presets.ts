/** Simple period presets — month / quarter / half-year / year (no compare window). */
export const PERIOD_DATE_PRESETS = [
  {
    id: "month",
    label: "Current Month (Aug 01 - Aug 12, 2026)",
  },
  {
    id: "quarter",
    label: "Current Quarter (Jul 01 - Aug 12, 2026)",
  },
  {
    id: "half-year",
    label: "Current Half Year (Jul 01 - Aug 12, 2026)",
  },
  {
    id: "year",
    label: "Current Year (Jan 1 - Aug 12, 2026)",
  },
] as const;

export type PeriodDatePresetId = (typeof PERIOD_DATE_PRESETS)[number]["id"];
