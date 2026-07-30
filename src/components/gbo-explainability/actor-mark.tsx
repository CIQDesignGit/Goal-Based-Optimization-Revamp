"use client";

import Image from "next/image";
import { Binary, Calendar } from "lucide-react";

import {
  getProfileInitials,
  PROFILE_AVATAR_STYLE,
} from "@/lib/gbo-explainability/actor-display";
import type { Actor, ActorKind } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ActorMarkProps = {
  kind: ActorKind;
  /** Person name for manual actors — used for initials. */
  name?: string;
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
export function ActorMark({ kind, name, className }: ActorMarkProps) {
  const markClass = cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full", className);

  switch (kind) {
    case "ally-ai":
      return (
        <span className={cn(markClass, "overflow-hidden bg-white")}>
          <Image
            src="/icons/ally-ai.png"
            alt=""
            width={24}
            height={24}
            className="size-6 object-cover"
          />
        </span>
      );

    case "rule-based":
      return (
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-info-50 text-info-600",
            className,
          )}
        >
          <Binary className="size-3.5" aria-hidden />
        </span>
      );

    case "day-parting":
      return (
        <span
          className={cn(
            markClass,
            "bg-orange-100 text-orange-800 ring-1 ring-orange-200/80",
          )}
        >
          <Calendar className="size-3.5" aria-hidden />
        </span>
      );

    case "human":
      return (
        <span
          className={cn(
            markClass,
            "text-[10px] font-semibold leading-none",
            PROFILE_AVATAR_STYLE.bg,
            PROFILE_AVATAR_STYLE.text,
          )}
          aria-hidden
        >
          {getProfileInitials(name ?? "Manual")}
        </span>
      );
  }
}

/** Convenience wrapper for Action Log rows. */
export function ActorMarkFromActor({ actor }: { actor: Actor }) {
  return (
    <ActorMark
      kind={actor.kind}
      name={actor.kind === "human" ? actor.label : undefined}
    />
  );
}
