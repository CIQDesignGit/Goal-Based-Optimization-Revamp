import type { Actor, ActorKind } from "./types";

export const ACTOR_KIND_LABELS: Record<ActorKind, string> = {
  "ally-ai": "Ally AI",
  "rule-based": "Rule Based",
  human: "Manual",
  "day-parting": "Day Parting",
};

/** 4px corner radius — all actor / contributor avatars. */
export const ACTOR_AVATAR_RADIUS = "rounded";

/** Avatar sizes aligned to adjacent label line-height (font-size × leading-snug). */
export const ACTOR_AVATAR_SIZES = {
  /** text-sm + leading-snug → 14px × 1.375 */
  sm: "size-[1.1875rem]",
  /** text-base + leading-snug → 16px × 1.375 */
  label: "size-[1.375rem]",
} as const;

export const ACTOR_AVATAR_TEXT = {
  // ! important so parent selectors like [&_span]:text-base cannot blow up initials
  sm: "!text-[9px] font-semibold leading-none",
  label: "!text-[10px] font-medium leading-none",
} as const;

export type ActorAvatarSize = keyof typeof ACTOR_AVATAR_SIZES;

export type ProfileAvatarStyle = {
  bg: string;
  text: string;
  ring: string;
};

/**
 * One color for all manual / Setup person chips — soft lime
 * (distinct from Ally violet, Rule Based sky, Day Parting pink).
 */
export const PROFILE_AVATAR_STYLE: ProfileAvatarStyle = {
  bg: "bg-lime-50",
  text: "text-lime-900",
  ring: "ring-1 ring-lime-200/80",
};

/** Multi-person “Users” mark — same manual green family. */
export const MULTI_CONTRIBUTOR_AVATAR_STYLE: ProfileAvatarStyle =
  PROFILE_AVATAR_STYLE;

/** Always the manual lime chip (name kept for call-site compatibility). */
export function getProfileAvatarStyle(_name?: string): ProfileAvatarStyle {
  return PROFILE_AVATAR_STYLE;
}

/** Icon / avatar marks — aligned with ACTOR_LABEL_TEXT + ACTOR_ACCENT_BAR. */
export const ACTOR_MARK_STYLE: Record<
  ActorKind,
  { bg: string; text: string; ring?: string }
> = {
  "ally-ai": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-1 ring-violet-200",
  },
  "rule-based": {
    bg: "bg-sky-50",
    text: "text-sky-600",
    ring: "ring-1 ring-sky-200",
  },
  human: {
    bg: PROFILE_AVATAR_STYLE.bg,
    text: PROFILE_AVATAR_STYLE.text,
    ring: PROFILE_AVATAR_STYLE.ring,
  },
  "day-parting": {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-1 ring-amber-200/80",
  },
};

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

/** First letter of the given name — e.g. "Maya Wong" → "M". */
export function getProfileInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0]!.toUpperCase();
}

export const ACTOR_LABEL_TEXT: Record<ActorKind, string> = {
  "ally-ai": "text-indigo-700",
  "rule-based": "text-sky-600",
  human: "text-lime-900",
  "day-parting": "text-amber-800",
};

export const ACTOR_ACCENT_BAR: Record<ActorKind, string> = {
  "ally-ai": "bg-indigo-500",
  "rule-based": "bg-sky-500",
  human: "bg-lime-500",
  "day-parting": "bg-amber-500",
};
