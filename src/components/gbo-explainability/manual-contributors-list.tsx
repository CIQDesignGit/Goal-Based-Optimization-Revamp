"use client";

import { ChangeRow } from "@/components/gbo-explainability/change-row";
import {
  ACTOR_AVATAR_RADIUS,
  ACTOR_AVATAR_SIZES,
  ACTOR_AVATAR_TEXT,
  getProfileInitials,
  PROFILE_AVATAR_STYLE,
  type ActorAvatarSize,
} from "@/lib/gbo-explainability/actor-display";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
import { parseChangeClaim } from "@/lib/gbo-explainability/parse-change-claim";
import type { ManualContributorSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ManualContributorsListProps = {
  contributors: ManualContributorSummary[];
  /** When true, only the change lines render (identity shown in the section header). */
  hideIdentity?: boolean;
  className?: string;
};

type ContributorAvatarProps = {
  name: string;
  size?: ActorAvatarSize;
  className?: string;
};

/** Initials avatar for manual contributors — reused in list rows and section headers. */
export function ContributorAvatar({
  name,
  size = "sm",
  className,
}: ContributorAvatarProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center ring-1 ring-slate-200/80",
        ACTOR_AVATAR_RADIUS,
        ACTOR_AVATAR_SIZES[size],
        ACTOR_AVATAR_TEXT[size],
        PROFILE_AVATAR_STYLE.bg,
        PROFILE_AVATAR_STYLE.text,
        className,
      )}
      aria-hidden
    >
      {getProfileInitials(name)}
    </span>
  );
}

function ManualChangeClaimRow({ claim }: { claim: string }) {
  const parsed = parseChangeClaim(claim);

  if (parsed) {
    return (
      <ChangeRow
        entityName={parsed.entityName}
        field={parsed.field}
        before={parsed.before}
        after={parsed.after}
      />
    );
  }

  return (
    <p className={cn("px-4 py-2.5", explainabilityType.l4)}>{claim}</p>
  );
}

/** Per-person list with scannable entity / field / value rows. */
export function ManualContributorsList({
  contributors,
  hideIdentity = false,
  className,
}: ManualContributorsListProps) {
  if (contributors.length === 0) return null;

  return (
    <ul className={cn("divide-y divide-slate-100", className)}>
      {contributors.map((contributor) => (
        <li key={contributor.id}>
          {hideIdentity ? (
            <ul className="divide-y divide-slate-100">
              {contributor.claims.map((claim, index) => (
                <li key={`${contributor.id}-${index}`}>
                  <ManualChangeClaimRow claim={claim} />
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div className="flex min-w-0 items-start gap-2.5 border-b border-slate-100 px-4 py-2">
                <ContributorAvatar name={contributor.name} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className={explainabilityType.l3}>
                    {contributor.name}
                    {contributor.deactivated ? (
                      <span className={explainabilityType.l4}>
                        {" "}
                        (deactivated)
                      </span>
                    ) : null}
                  </p>
                  {contributor.email ? (
                    <p className={explainabilityType.l4}>{contributor.email}</p>
                  ) : null}
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {contributor.claims.map((claim, index) => (
                  <li key={`${contributor.id}-${index}`}>
                    <ManualChangeClaimRow claim={claim} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
