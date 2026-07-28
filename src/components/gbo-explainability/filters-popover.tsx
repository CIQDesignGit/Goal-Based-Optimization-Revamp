"use client";

import { ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { describeAutomationFilterOptions } from "@/lib/gbo-explainability/account-tabs";
import type {
  AccountOptimizerConfig,
  ActionTab,
  FilterState,
} from "@/lib/gbo-explainability/types";

type FiltersPopoverProps = {
  tab: ActionTab;
  filters: FilterState;
  config: AccountOptimizerConfig;
  onChange: (patch: Partial<FilterState>) => void;
};

const selectClass =
  "h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function FiltersPopover({
  tab,
  filters,
  config,
  onChange,
}: FiltersPopoverProps) {
  const automationOptions = describeAutomationFilterOptions(config);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" />
        }
      >
        <ListFilter className="size-3.5" />
        Filters
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-3 p-3">
        <PopoverHeader>
          <PopoverTitle>
            {tab === "automation" ? "Automation filters" : "Setup filters"}
          </PopoverTitle>
        </PopoverHeader>

        {tab === "setup" ? (
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Who made the change</Label>
              <select
                className={selectClass}
                value={filters.user ?? "all"}
                onChange={(e) => onChange({ user: e.target.value })}
              >
                <option value="all">Anyone</option>
                <option value="priyal.j@commerceiq.ai">Priyal Jain</option>
                <option value="alex.r@example.com">Alex Rivera</option>
                <option value="sam.c@example.com">Sam Chen</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Change status</Label>
              <select
                className={selectClass}
                value={filters.changeStatus ?? "all"}
                onChange={(e) =>
                  onChange({
                    changeStatus: e.target.value as FilterState["changeStatus"],
                  })
                }
              >
                <option value="all">Any</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Step</Label>
              <select
                className={selectClass}
                value={filters.setupStep ?? "all"}
                onChange={(e) => onChange({ setupStep: e.target.value })}
              >
                <option value="all">Any step</option>
                <option value="General">General</option>
                <option value="Goals & Budgets">Goals & Budgets</option>
                <option value="Seasonality">Seasonality</option>
                <option value="Constraints">Constraints</option>
                <option value="Optimizer">Optimizer</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type of automation</Label>
              <select
                className={selectClass}
                value={filters.automationType ?? "all"}
                onChange={(e) =>
                  onChange({
                    automationType: e.target
                      .value as FilterState["automationType"],
                  })
                }
              >
                <option value="all">Any</option>
                {automationOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action type</Label>
              <select
                className={selectClass}
                value={filters.actionType ?? "all"}
                onChange={(e) =>
                  onChange({
                    actionType: e.target.value as FilterState["actionType"],
                  })
                }
              >
                <option value="all">Any</option>
                <option value="bid-change">Bid change</option>
                <option value="budget-change">Budget change</option>
                <option value="day-parting-change">Day-parting change</option>
                <option value="status-change">Status change</option>
                <option value="out-of-budget">Out of budget</option>
                <option value="api-failure">API failure</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Failure reason</Label>
              <select
                className={selectClass}
                value={filters.failureCategory ?? "all"}
                onChange={(e) =>
                  onChange({
                    failureCategory: e.target
                      .value as FilterState["failureCategory"],
                  })
                }
              >
                <option value="all">Any</option>
                <option value="business-rule">Business rule</option>
                <option value="retailer-api">Retailer API</option>
                <option value="transient">Transient / rate limit</option>
                <option value="logic">Logic / data</option>
                <option value="validation">Validation</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters.outOfBudgetOnly)}
                onChange={(e) =>
                  onChange({ outOfBudgetOnly: e.target.checked })
                }
                className="size-3.5 rounded border-border"
              />
              Out-of-budget only
            </label>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
