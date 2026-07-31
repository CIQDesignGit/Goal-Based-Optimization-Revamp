"use client";

import type { SummarySource } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ClaimSentenceProps = {
  claim: string;
  summarySource: SummarySource;
  className?: string;
};

/** Primary row claim text. */
export function ClaimSentence({
  claim,
  summarySource: _summarySource,
  className,
}: ClaimSentenceProps) {
  return (
    <p
      className={cn(
        "text-base font-normal leading-snug tracking-tight text-slate-700",
        className,
      )}
    >
      {claim}
    </p>
  );
}
