"use client";

import {
  getProfileInitials,
  PROFILE_AVATAR_STYLE,
} from "@/lib/gbo-explainability/actor-display";
import type { ManualContributorSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ManualContributorsListProps = {
  contributors: ManualContributorSummary[];
  className?: string;
};

/** Per-person list with each change showing before → after values. */
export function ManualContributorsList({
  contributors,
  className,
}: ManualContributorsListProps) {
  if (contributors.length === 0) return null;

  return (
    <ul
      className={cn(
        "divide-y divide-border overflow-hidden rounded-md border border-border bg-background",
        className,
      )}
    >
      {contributors.map((contributor) => (
        <li key={contributor.id} className="px-2.5 py-2">
          <div className="flex min-w-0 items-start gap-2">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                PROFILE_AVATAR_STYLE.bg,
                PROFILE_AVATAR_STYLE.text,
              )}
              aria-hidden
            >
              {getProfileInitials(contributor.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-tight text-foreground">
                <span className="font-medium">{contributor.name}</span>
                {contributor.email ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {contributor.email}
                  </span>
                ) : null}
                {contributor.deactivated ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (deactivated)
                  </span>
                ) : null}
              </p>

              <ul className="mt-1.5 space-y-1">
                {contributor.claims.map((claim, index) => (
                  <li
                    key={`${contributor.id}-${index}`}
                    className="text-xs leading-snug text-muted-foreground before:mr-1.5 before:text-slate-400 before:content-['•']"
                  >
                    {claim}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
