"use client";

import Image from "next/image";
import { Binary, Calendar } from "lucide-react";

import {
  ACTOR_AVATAR_RADIUS,
  ACTOR_AVATAR_SIZES,
  ACTOR_AVATAR_TEXT,
  ACTOR_MARK_STYLE,
  getProfileAvatarStyle,
  getProfileInitials,
  type ActorAvatarSize,
} from "@/lib/gbo-explainability/actor-display";
import type { Actor, ActorKind } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ActorMarkProps = {
  kind: ActorKind;
  /** Person name for manual actors — used for initials. */
  name?: string;
  size?: ActorAvatarSize;
  className?: string;
};

const ACTOR_MARK_ICON_SIZE: Record<ActorAvatarSize, string> = {
  sm: "size-3",
  label: "size-3.5",
};

const ACTOR_MARK_IMAGE_PX: Record<ActorAvatarSize, number> = {
  sm: 19,
  label: 22,
};

function actorKindFromType(actorType: string): ActorKind {
  const normalized = actorType.toLowerCase();

  if (normalized.includes("ally")) return "ally-ai";
  if (normalized.includes("rule")) return "rule-based";
  if (normalized.includes("day part")) return "day-parting";
  return "human";
}

type ConflictActorMarkProps = {
  actorType: string;
  actorName?: string;
  size?: ActorAvatarSize;
  className?: string;
};

/** Avatar / icon mark for a conflict card actor label. */
export function ConflictActorMark({
  actorType,
  actorName,
  size = "sm",
  className,
}: ConflictActorMarkProps) {
  const kind = actorKindFromType(actorType);
  const name =
    kind === "human"
      ? (actorName ??
        (actorType.replace(/^manual\s*/i, "").trim() || "Manual"))
      : undefined;

  return (
    <ActorMark
      kind={kind}
      name={name}
      size={size}
      className={className}
    />
  );
}

/** Avatar / icon mark aligned with Action Log user column styling. */
export function ActorMark({
  kind,
  name,
  size = "sm",
  className,
}: ActorMarkProps) {
  const markSize = ACTOR_AVATAR_SIZES[size];
  const iconSize = ACTOR_MARK_ICON_SIZE[size];
  const imageSize = ACTOR_MARK_IMAGE_PX[size];
  // People get a soft tint from their name; automation kinds use fixed brand colors
  const style =
    kind === "human"
      ? getProfileAvatarStyle(name ?? "Manual")
      : ACTOR_MARK_STYLE[kind];
  const markClass = cn(
    "inline-flex shrink-0 items-center justify-center",
    ACTOR_AVATAR_RADIUS,
    markSize,
    style.bg,
    style.text,
    style.ring,
    className,
  );

  switch (kind) {
    case "ally-ai":
      return (
        <span className={cn(markClass, "overflow-hidden")}>
          <Image
            src="/icons/ally-ai.png"
            alt=""
            width={imageSize}
            height={imageSize}
            className={cn(markSize, "object-cover")}
          />
        </span>
      );

    case "rule-based":
      return (
        <span className={markClass}>
          <Binary className={iconSize} aria-hidden />
        </span>
      );

    case "day-parting":
      return (
        <span className={markClass}>
          <Calendar className={iconSize} aria-hidden />
        </span>
      );

    case "human":
      return (
        <span
          className={cn(markClass, ACTOR_AVATAR_TEXT[size])}
          aria-hidden
        >
          {getProfileInitials(name ?? "Manual")}
        </span>
      );
  }
}

/** Convenience wrapper for Action Log rows. */
export function ActorMarkFromActor({
  actor,
  size = "sm",
}: {
  actor: Actor;
  size?: ActorAvatarSize;
}) {
  return (
    <ActorMark
      kind={actor.kind}
      size={size}
      name={actor.kind === "human" ? actor.label : undefined}
    />
  );
}
