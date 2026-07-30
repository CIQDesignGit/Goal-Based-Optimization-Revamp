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

/** Dense one-line-per-person list for expanded Manual alert details. */
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
        <li
          key={contributor.id}
          className="flex min-w-0 items-center gap-2 px-2.5 py-1.5"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
              PROFILE_AVATAR_STYLE.bg,
              PROFILE_AVATAR_STYLE.text,
            )}
            aria-hidden
          >
            {getProfileInitials(contributor.name)}
          </span>
          <p className="min-w-0 truncate text-xs leading-tight text-foreground">
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
            <span className="text-muted-foreground"> — </span>
            <span className="font-normal">{contributor.changeSummary}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
