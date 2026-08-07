"use client";

import { Users } from "lucide-react";

import { ActorMark } from "@/components/gbo-explainability/actor-mark";
import { ContributorAvatar } from "@/components/gbo-explainability/manual-contributors-list";
import {
  ACTOR_AVATAR_RADIUS,
  ACTOR_AVATAR_SIZES,
  getActorLabel,
  getActorTooltip,
  MULTI_CONTRIBUTOR_AVATAR_STYLE,
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
  // Match text-sm + leading-snug name (~19px) — see ACTOR_AVATAR_SIZES.sm
  const size = "sm" as const;

  if (actor.kind === "human") {
    if (contributors.length > 1) {
      return (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            MULTI_CONTRIBUTOR_AVATAR_STYLE.bg,
            MULTI_CONTRIBUTOR_AVATAR_STYLE.text,
            MULTI_CONTRIBUTOR_AVATAR_STYLE.ring,
            ACTOR_AVATAR_RADIUS,
            ACTOR_AVATAR_SIZES[size],
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
        size={size}
      />
    );
  }

  return <ActorMark kind={actor.kind} size={size} />;
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
            "block truncate text-sm font-semibold leading-snug tracking-tight text-slate-700",
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
