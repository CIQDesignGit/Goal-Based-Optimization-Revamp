"use client";

import Image from "next/image";
import { Binary, Calendar } from "lucide-react";

import {
  ACTOR_MARK_STYLE,
  getProfileInitials,
} from "@/lib/gbo-explainability/actor-display";
import type { Actor, ActorKind } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ActorMarkProps = {
  kind: ActorKind;
  /** Person name for manual actors — used for initials. */
  name?: string;
  size?: "sm" | "md";
  className?: string;
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
  className?: string;
};

/** Avatar / icon mark for a conflict card actor label. */
export function ConflictActorMark({
  actorType,
  actorName,
  className,
}: ConflictActorMarkProps) {
  const kind = actorKindFromType(actorType);
  const name =
    kind === "human"
      ? (actorName ??
        (actorType.replace(/^manual\s*/i, "").trim() || "Manual"))
      : undefined;

  return <ActorMark kind={kind} name={name} className={className} />;
}

/** Avatar / icon mark aligned with Action Log user column styling. */
export function ActorMark({ kind, name, size = "md", className }: ActorMarkProps) {
  const isSmall = size === "sm";
  const markSize = isSmall ? "size-5" : "size-6";
  const iconSize = isSmall ? "size-3" : "size-3.5";
  const imageSize = isSmall ? 20 : 24;
  const markClass = cn(
    "inline-flex shrink-0 items-center justify-center",
    markSize,
    ACTOR_MARK_STYLE[kind].shape === "rounded" ? "rounded-md" : "rounded-full",
    ACTOR_MARK_STYLE[kind].bg,
    ACTOR_MARK_STYLE[kind].text,
    ACTOR_MARK_STYLE[kind].ring,
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
          className={cn(
            markClass,
            isSmall ? "text-[9px]" : "text-[10px]",
            "font-semibold leading-none",
          )}
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
  size = "md",
}: {
  actor: Actor;
  size?: "sm" | "md";
}) {
  return (
    <ActorMark
      kind={actor.kind}
      size={size}
      name={actor.kind === "human" ? actor.label : undefined}
    />
  );
}
