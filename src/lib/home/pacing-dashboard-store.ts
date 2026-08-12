import { create } from "zustand";

import {
  buildDefaultDashboardFilters,
  type DashboardFilters,
} from "@/lib/home/dashboard-filters";
import type { ExecutiveSummaryResult } from "@/lib/home/executive-summary";

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
}));
