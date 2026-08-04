"use client";

import { ArrowRight } from "lucide-react";

import { ChangeValueDisplay } from "@/components/gbo-explainability/change-value-display";
import { ConflictActorMark } from "@/components/gbo-explainability/actor-mark";
import { detailOverrideCompare } from "@/lib/gbo-explainability/detail-layout";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
import type {
  AlertConflictDetail,
  ConflictActorChange,
} from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertConflictCardProps = {
  conflict: AlertConflictDetail;
};

function displayActor(side: ConflictActorChange): string {
  return side.actorName ?? side.actorType;
}

/** Resolve before/after from structured fields or a "X → Y" change string. */
function resolveChangeValues(side: ConflictActorChange): {
  before: string | null;
  after: string | null;
} {
  if (side.before !== null || side.after !== null) {
    return { before: side.before, after: side.after };
  }

  const match = side.change.match(/^(.+?)\s→\s(.+)$/);
  if (match) {
    return { before: match[1].trim(), after: match[2].trim() };
  }

  return { before: null, after: null };
}

type ConflictSideProps = {
  side: ConflictActorChange;
};

function ConflictSide({ side }: ConflictSideProps) {
  const { before, after } = resolveChangeValues(side);

  return (
    <div className="min-w-0">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5">
        <ConflictActorMark
          actorType={side.actorType}
          actorName={side.actorName}
          className="row-start-1 self-center"
        />

        <p className={cn("row-start-1 min-w-0 truncate", explainabilityType.l3)}>
          {displayActor(side)}
        </p>

        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <ChangeValueDisplay before={before} after={after} size="md" />
          <time className={cn("shrink-0 tabular-nums", explainabilityType.l4)}>
            {side.timestamp}
          </time>
        </div>
      </div>
    </div>
  );
}

/** Before/after actor comparison for one overridden entity. */
export function AlertConflictCard({ conflict }: AlertConflictCardProps) {
  return (
    <div className="px-4 py-3">
      <p className={cn("truncate", explainabilityType.l3)}>
        {conflict.entityName}
        <span className="ml-1.5 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
          {conflict.field}
        </span>
      </p>

      <div className={detailOverrideCompare}>
        <ConflictSide side={conflict.otherChange} />

        <div
          className="flex shrink-0 items-center justify-center self-center px-4 py-2 text-slate-400 sm:py-0"
          aria-hidden
        >
          <ArrowRight className="size-4 rotate-90 sm:rotate-0" strokeWidth={2.25} />
        </div>

        <ConflictSide side={conflict.inEffectNow} />
      </div>
    </div>
  );
}
