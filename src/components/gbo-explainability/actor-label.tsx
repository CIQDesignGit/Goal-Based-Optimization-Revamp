"use client";

import { Users } from "lucide-react";

import { ActorMark } from "@/components/gbo-explainability/actor-mark";
import { ContributorAvatar } from "@/components/gbo-explainability/manual-contributors-list";
import {
  ACTOR_AVATAR_RADIUS,
  ACTOR_AVATAR_SIZES,
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

function ActorLabelAvatar({
  actor,
  manualContributors,
}: {
  actor: Actor;
  manualContributors?: ManualContributorSummary[];
}) {
  const contributors = manualContributors ?? [];
  const singleContributor =
    contributors.length === 1 ? contributors[0] : null;

  if (actor.kind === "human") {
    if (contributors.length > 1) {
      return (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center bg-slate-100 text-slate-600 ring-1 ring-slate-200",
            ACTOR_AVATAR_RADIUS,
            ACTOR_AVATAR_SIZES.sm,
          )}
          aria-hidden
        >
          <Users className="size-3" />
        </span>
      );
    }

    return (
      <ContributorAvatar
        name={singleContributor?.name ?? actor.label}
        size="sm"
      />
    );
  }

  return <ActorMark kind={actor.kind} size="sm" />;
}

/** Actor column for alert rows — avatar + label. */
export function ActorLabel({
  actor,
  manualContributors,
  className,
}: ActorLabelProps) {
  const label =
    actor.kind === "human" ? actor.label : getActorLabel(actor);
  const contributorCount = manualContributors?.length ?? 0;
  const tooltip =
    contributorCount > 0
      ? buildManualTooltip(manualContributors!)
      : getActorTooltip(actor);

  return (
    <div
      className={cn("flex w-full min-w-0 items-center gap-2", className)}
      title={tooltip}
    >
      <ActorLabelAvatar
        actor={actor}
        manualContributors={manualContributors}
      />
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium leading-snug tracking-tight",
            ACTOR_LABEL_TEXT[actor.kind],
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
