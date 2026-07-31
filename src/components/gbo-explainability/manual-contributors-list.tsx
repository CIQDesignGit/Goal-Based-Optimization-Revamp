"use client";

import {
  getProfileInitials,
  PROFILE_AVATAR_STYLE,
} from "@/lib/gbo-explainability/actor-display";
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
  className?: string;
};

/** Initials avatar for manual contributors — reused in list rows and section headers. */
export function ContributorAvatar({ name, className }: ContributorAvatarProps) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ring-1 ring-slate-200/80",
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

/** Per-person list with each change showing before → after values. */
export function ManualContributorsList({
  contributors,
  hideIdentity = false,
  className,
}: ManualContributorsListProps) {
  if (contributors.length === 0) return null;

  return (
    <ul
      className={cn(
        "divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs",
        className,
      )}
    >
      {contributors.map((contributor) => (
        <li key={contributor.id} className="px-4 py-3">
          {hideIdentity ? (
            <ul className="space-y-1.5">
              {contributor.claims.map((claim, index) => (
                <li
                  key={`${contributor.id}-${index}`}
                  className="text-sm leading-snug text-slate-600"
                >
                  {claim}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-w-0 items-start gap-2.5">
              <ContributorAvatar name={contributor.name} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight text-slate-800">
                  <span className="font-medium">{contributor.name}</span>
                  {contributor.email ? (
                    <span className="font-normal text-slate-400">
                      {" "}
                      · {contributor.email}
                    </span>
                  ) : null}
                  {contributor.deactivated ? (
                    <span className="font-normal text-slate-400">
                      {" "}
                      (deactivated)
                    </span>
                  ) : null}
                </p>

                <ul className="mt-2 space-y-1.5">
                  {contributor.claims.map((claim, index) => (
                    <li
                      key={`${contributor.id}-${index}`}
                      className="text-sm leading-snug text-slate-600"
                    >
                      {claim}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
