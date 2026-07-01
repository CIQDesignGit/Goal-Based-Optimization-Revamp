import { CircleHelp } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type InfoLabelProps = {
  label: string;
  tooltip?: string;
};

export function InfoLabel({ label, tooltip }: InfoLabelProps) {
  return (
    <span className="inline-flex items-center gap-1">
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
