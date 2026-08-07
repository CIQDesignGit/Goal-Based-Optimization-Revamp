"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportPopoverProps = {
  filteredCount: number;
  onExportFiltered: () => void;
};

/** Export current Action Log view to CSV. */
export function ExportPopover({
  filteredCount,
  onExportFiltered,
}: ExportPopoverProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={filteredCount === 0}
      onClick={onExportFiltered}
      title={
        filteredCount === 0
          ? "No rows to export for the active filters."
          : `Export ${filteredCount} row${filteredCount === 1 ? "" : "s"} to CSV`
      }
    >
      <Download className="size-3.5" />
      Export
    </Button>
  );
}
