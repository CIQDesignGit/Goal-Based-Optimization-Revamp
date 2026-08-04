"use client";

import type { SummarySource } from "@/lib/gbo-explainability/types";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
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
      className={cn(explainabilityType.l1, className)}
    >
      {claim}
    </p>
  );
}
