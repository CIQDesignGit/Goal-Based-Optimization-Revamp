"use client";

import {
  ACTOR_ACCENT_BAR,
  ACTOR_LABEL_TEXT,
  getActorLabel,
  getActorTooltip,
} from "@/lib/gbo-explainability/actor-display";
import type { Actor } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ActorLabelProps = {
  actor: Actor;
  className?: string;
};

/** Slim category label for alert rows — accent bar + text, not a chip or avatar. */
export function ActorLabel({ actor, className }: ActorLabelProps) {
  const label = getActorLabel(actor);

  return (
    <div
      className={cn("flex min-w-0 items-stretch gap-2", className)}
      title={getActorTooltip(actor)}
    >
      <span
        className={cn(
          "mt-0.5 w-0.5 shrink-0 self-stretch rounded-full",
          ACTOR_ACCENT_BAR[actor.kind],
        )}
        aria-hidden
      />
      <span
        className={cn(
          "text-xs font-semibold leading-snug",
          ACTOR_LABEL_TEXT[actor.kind],
        )}
      >
        {label}
      </span>
    </div>
  );
}
