import type { Actor, ActorKind } from "./types";

export const ACTOR_KIND_LABELS: Record<ActorKind, string> = {
  "ally-ai": "Ally AI",
  "rule-based": "Rule Based",
  human: "Manual",
  "day-parting": "Day Parting",
};

/** Single style for all manual profile avatars. */
export const PROFILE_AVATAR_STYLE = {
  bg: "bg-slate-200",
  text: "text-slate-700",
} as const;

export function getActorLabel(actor: Actor): string {
  return ACTOR_KIND_LABELS[actor.kind];
}

export function getActorTooltip(actor: Actor): string {
  const label = getActorLabel(actor);

  if (actor.kind === "human") {
    return `${actor.label}${actor.email ? ` · ${actor.email}` : ""}${actor.deactivated ? " (deactivated)" : ""}`;
  }

  if (actor.triggerOrRule) {
    return `${label} · ${actor.triggerOrRule}`;
  }

  return label;
}

export function getProfileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export const ACTOR_LABEL_TEXT: Record<ActorKind, string> = {
  "ally-ai": "text-violet-700",
  "rule-based": "text-sky-600",
  human: "text-slate-600",
  "day-parting": "text-pink-700",
};

export const ACTOR_ACCENT_BAR: Record<ActorKind, string> = {
  "ally-ai": "bg-violet-500",
  "rule-based": "bg-sky-500",
  human: "bg-slate-400",
  "day-parting": "bg-pink-500",
};
