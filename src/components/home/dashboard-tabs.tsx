"use client";

import { DashboardFiltersBar } from "@/components/home/dashboard-filters-bar";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import {
  type DashboardTab,
  usePacingDashboardStore,
} from "@/lib/home/pacing-dashboard-store";
import { cn } from "@/lib/utils";

/**
 * Same chrome as Explainability: tabs on top, Filters funnel button on the
 * right of the row below (chips appear to the left of the button when active).
 */
export function DashboardTabs() {
  const tab = usePacingDashboardStore((s) => s.tab);
  const setTab = usePacingDashboardStore((s) => s.setTab);

  return (
    <div className="shrink-0 border-b border-slate-200/80 bg-white py-1.5">
      <div className="space-y-1.5">
        <div
          role="tablist"
          aria-label="Budget Pacing Dashboard views"
          className="flex gap-6 border-b border-slate-200 px-4 md:px-5"
        >
          <TabButton
            active={tab === "executive-summary"}
            onClick={() => setTab("executive-summary")}
          >
            Executive Summary
          </TabButton>
          <TabButton
            active={tab === "pacing"}
            onClick={() => setTab("pacing")}
          >
            Pacing
          </TabButton>
        </div>

        <DashboardFiltersBar />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 pt-0.5 text-sm transition-colors",
        active
          ? cn(
              explainabilityActionable.tabActive,
              "font-semibold text-slate-900",
            )
          : "border-transparent font-medium text-slate-500 hover:border-slate-200 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

export type { DashboardTab };
