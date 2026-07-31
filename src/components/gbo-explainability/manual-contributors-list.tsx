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
        "divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs",
        className,
      )}
    >
      {contributors.map((contributor) => (
        <li key={contributor.id} className="px-4 py-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ring-1 ring-slate-200/80",
                PROFILE_AVATAR_STYLE.bg,
                PROFILE_AVATAR_STYLE.text,
              )}
              aria-hidden
            >
              {getProfileInitials(contributor.name)}
            </span>
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
        </li>
      ))}
    </ul>
  );
}
