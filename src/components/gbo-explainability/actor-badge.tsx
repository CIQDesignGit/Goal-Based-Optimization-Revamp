"use client";

import { Badge } from "@/components/ui/badge";
import {
  getActorLabel,
  getActorTooltip,
} from "@/lib/gbo-explainability/actor-display";
import type { Actor } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  Actor["kind"],
  { className: string }
> = {
  "ally-ai": {
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  "rule-based": {
    className: "bg-info-100 text-info-700 border-info-200",
  },
  human: {
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  "day-parting": {
    className: "bg-warning-100 text-warning-700 border-warning-200",
  },
};

type ActorBadgeProps = {
  actor: Actor;
  className?: string;
};

/** Compact chip for inline log rows — distinct from alert-column ActorLabel. */
export function ActorBadge({ actor, className }: ActorBadgeProps) {
  const style = KIND_STYLES[actor.kind];
  const label = getActorLabel(actor);

  return (
    <Badge
      variant="outline"
      className={cn(style.className, "rounded-full font-medium", className)}
      title={getActorTooltip(actor)}
    >
      {label}
    </Badge>
  );
}
