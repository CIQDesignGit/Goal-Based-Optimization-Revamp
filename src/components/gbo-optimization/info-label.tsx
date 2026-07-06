import { CircleHelp } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InfoLabelProps = {
  label: string;
  tooltip?: string;
  className?: string;
};

export function InfoLabel({ label, tooltip, className }: InfoLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {label}
      <Tooltip>
        <TooltipTrigger
          className="inline-flex text-slate-400"
          aria-label={`More info about ${label}`}
        >
          <CircleHelp className="size-3.5" />
        </TooltipTrigger>
        {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
      </Tooltip>
    </span>
  );
}
