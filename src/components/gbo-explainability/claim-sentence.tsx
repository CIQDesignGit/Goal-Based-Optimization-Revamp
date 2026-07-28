"use client";

import { Sparkles } from "lucide-react";

import type { SummarySource } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type ClaimSentenceProps = {
  claim: string;
  summarySource: SummarySource;
  className?: string;
};

/**
 * Primary row content. AI summaries get a small marker;
 * templated fallbacks stay undecorated so they don't pretend to be analytical.
 */
export function ClaimSentence({
  claim,
  summarySource,
  className,
}: ClaimSentenceProps) {
  return (
    <div className={cn("flex min-w-0 items-start gap-2", className)}>
      <p
        className={cn(
          "text-sm font-medium leading-snug text-foreground",
          summarySource === "template" && "text-slate-600",
        )}
      >
        {claim}
      </p>
      {summarySource === "ai" ? (
        <span
          className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-2xs font-medium text-brand-700"
          title="AI-generated summary — verify numbers in the expanded detail"
        >
          <Sparkles className="size-2.5" aria-hidden />
          AI
        </span>
      ) : null}
    </div>
  );
}
