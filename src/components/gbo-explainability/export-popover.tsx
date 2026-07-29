"use client";

import { ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

type ExportPopoverProps = {
  filteredCount: number;
  todayAllyCount: number;
  onExportFiltered: () => void;
  onExportTodayAlly: () => void;
};

/** Single Export entry point — filtered view and today's Ally AI options. */
export function ExportPopover({
  filteredCount,
  todayAllyCount,
  onExportFiltered,
  onExportTodayAlly,
}: ExportPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" />
        }
      >
        <Download className="size-3.5" />
        Export
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-1 p-1">
        <PopoverHeader className="px-2 pt-1">
          <PopoverTitle>Export to CSV</PopoverTitle>
        </PopoverHeader>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              type="button"
              disabled={filteredCount === 0}
              onClick={onExportFiltered}
              className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-medium text-foreground">
                Current view
              </span>
              <span className="text-xs text-muted-foreground">
                {filteredCount === 0
                  ? "No rows to export for the active filters."
                  : `${filteredCount} row${filteredCount === 1 ? "" : "s"} matching filters and search`}
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              disabled={todayAllyCount === 0}
              onClick={onExportTodayAlly}
              className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-medium text-foreground">
                Today&apos;s Ally AI changes
              </span>
              <span className="text-xs text-muted-foreground">
                {todayAllyCount === 0
                  ? "No Ally AI actions logged today."
                  : `${todayAllyCount} Ally AI action${todayAllyCount === 1 ? "" : "s"} from today`}
              </span>
            </button>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
