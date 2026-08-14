import { create } from "zustand";

import {
  buildDefaultDashboardFilters,
  type DashboardFilters,
  type DataSourceId,
} from "@/lib/home/dashboard-filters";
import type { ExecutiveSummaryResult } from "@/lib/home/executive-summary";
import type { PeriodDatePresetId } from "@/lib/home/period-date-presets";

export type DashboardTab = "executive-summary" | "pacing";

type PacingDashboardState = {
  tab: DashboardTab;
  setTab: (tab: DashboardTab) => void;
  filters: DashboardFilters;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  /** Last successful Performance Overview (for LLM-down fallback). */
  lastSummary: ExecutiveSummaryResult | null;
  setLastSummary: (value: ExecutiveSummaryResult | null) => void;
  /** Simulate LLM down for FR-013 fallback testing. */
  simulateLlmDown: boolean;
  setSimulateLlmDown: (value: boolean) => void;
  /** Personal Mode toggle on the dashboard filter bar. */
  personalMode: boolean;
  setPersonalMode: (value: boolean) => void;
  /** Selected data sources from Add filter. */
  dataSources: DataSourceId[];
  addDataSource: (id: DataSourceId) => void;
  removeDataSource: (id: DataSourceId) => void;
  clearDataSources: () => void;
  /** Shared period preset (filter bar + Budget Plan). */
  periodDatePreset: PeriodDatePresetId;
  setPeriodDatePreset: (id: PeriodDatePresetId) => void;
};

export const usePacingDashboardStore = create<PacingDashboardState>((set) => ({
  tab: "executive-summary",
  setTab: (tab) => set({ tab }),
  filters: buildDefaultDashboardFilters(),
  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: buildDefaultDashboardFilters() }),
  lastSummary: null,
  setLastSummary: (value) => set({ lastSummary: value }),
  simulateLlmDown: false,
  setSimulateLlmDown: (value) => set({ simulateLlmDown: value }),
  personalMode: false,
  setPersonalMode: (value) => set({ personalMode: value }),
  dataSources: [],
  addDataSource: (id) =>
    set((state) =>
      state.dataSources.includes(id)
        ? state
        : { dataSources: [...state.dataSources, id] },
    ),
  removeDataSource: (id) =>
    set((state) => ({
      dataSources: state.dataSources.filter((d) => d !== id),
    })),
  clearDataSources: () => set({ dataSources: [] }),
  periodDatePreset: "month",
  setPeriodDatePreset: (id) => set({ periodDatePreset: id }),
}));
