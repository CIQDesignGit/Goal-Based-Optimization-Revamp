"use client";

import type { SummarySource } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ClaimSentenceProps = {
  claim: string;
  summarySource: SummarySource;
  className?: string;
};

/** Primary row claim text. Templated fallbacks use muted styling. */
export function ClaimSentence({
  claim,
  summarySource,
  className,
}: ClaimSentenceProps) {
  return (
    <p
      className={cn(
        "text-sm font-medium leading-snug tracking-tight text-slate-900",
        summarySource === "template" && "text-slate-600",
        className,
      )}
    >
      {claim}
    </p>
  );
}
