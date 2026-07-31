"use client";

import {
  ACTOR_ACCENT_BAR,
  ACTOR_LABEL_TEXT,
  getActorLabel,
  getActorTooltip,
} from "@/lib/gbo-explainability/actor-display";
import type { Actor, ManualContributorSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ActorLabelProps = {
  actor: Actor;
  manualContributors?: ManualContributorSummary[];
  className?: string;
};

function buildManualTooltip(contributors: ManualContributorSummary[]): string {
  return contributors
    .map((contributor) => {
      const identity = contributor.email
        ? `${contributor.name} · ${contributor.email}`
        : contributor.name;
      return `${identity} — ${contributor.changeSummary}`;
    })
    .join("\n");
}

/** Slim category label for alert rows — accent bar + text, not a chip or avatar. */
export function ActorLabel({
  actor,
  manualContributors,
  className,
}: ActorLabelProps) {
  const label = getActorLabel(actor);
  const contributorCount = manualContributors?.length ?? 0;
  const tooltip =
    contributorCount > 0
      ? buildManualTooltip(manualContributors!)
      : getActorTooltip(actor);

  return (
    <div
      className={cn("flex min-w-0 items-stretch gap-2", className)}
      title={tooltip}
    >
      <span
        className={cn(
          "mt-0.5 w-0.5 shrink-0 self-stretch rounded-full",
          ACTOR_ACCENT_BAR[actor.kind],
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <span
          className={cn(
            "block text-xs font-semibold leading-snug tracking-tight",
            ACTOR_LABEL_TEXT[actor.kind],
          )}
        >
          {label}
        </span>
        {contributorCount > 1 ? (
          <span className="mt-0.5 block text-[10px] font-medium leading-snug text-muted-foreground">
            {contributorCount} people
          </span>
        ) : contributorCount === 1 ? (
          <span className="mt-0.5 block truncate text-[10px] leading-snug text-muted-foreground">
            {manualContributors![0].name}
          </span>
        ) : null}
      </div>
    </div>
  );
}
