"use client";

import { Plus } from "lucide-react";

import { AiGoalOptimizerHeader } from "@/components/home/ai-goal-optimizer-header";
import { BudgetPacingCard } from "@/components/home/budget-pacing-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** Landing page — AI Goal Optimizer dashboard (prototype home). */
export function AiGoalOptimizerHome() {
  return (
    <div className="flex min-h-full w-full flex-col bg-slate-50/80">
      <AiGoalOptimizerHeader />

      {/* Page controls — full-width strip, no nested card */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200/70 bg-slate-50 px-6 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900"
        >
          <Plus className="size-3.5 text-slate-500" />
          Add filter
        </Button>

        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1">
          <Label
            htmlFor="personal-mode"
            className="text-xs font-normal text-slate-600"
          >
            Personal Mode
          </Label>
          <Switch id="personal-mode" size="sm" defaultChecked />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 pt-4">
        <BudgetPacingCard />
      </div>
    </div>
  );
}
