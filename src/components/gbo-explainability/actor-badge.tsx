"use client";

import { Badge } from "@/components/ui/badge";
import type { Actor } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  Actor["kind"],
  { className: string; defaultLabel: string }
> = {
  "ally-ai": {
    className: "bg-brand-100 text-brand-700 border-brand-200",
    defaultLabel: "Ally AI",
  },
  "rule-based": {
    className: "bg-info-100 text-info-700 border-info-200",
    defaultLabel: "Rule Based",
  },
  human: {
    className: "bg-slate-100 text-slate-700 border-slate-200",
    defaultLabel: "Manual",
  },
  system: {
    className: "bg-slate-100 text-slate-500 border-slate-200",
    defaultLabel: "System",
  },
};

type ActorBadgeProps = {
  actor: Actor;
  className?: string;
};

/** Colored pill + text label (never color alone). */
export function ActorBadge({ actor, className }: ActorBadgeProps) {
  const style = KIND_STYLES[actor.kind];
  const label =
    actor.kind === "human" || actor.kind === "system"
      ? style.defaultLabel
      : style.defaultLabel;

  return (
    <Badge
      variant="outline"
      className={cn(style.className, "rounded-full font-medium", className)}
      title={
        actor.kind === "human"
          ? `${actor.label}${actor.email ? ` · ${actor.email}` : ""}${actor.deactivated ? " (deactivated)" : ""}`
          : actor.triggerOrRule
            ? `${label} · ${actor.triggerOrRule}`
            : label
      }
    >
      {label}
      {actor.deactivated ? " (deactivated)" : null}
    </Badge>
  );
}
