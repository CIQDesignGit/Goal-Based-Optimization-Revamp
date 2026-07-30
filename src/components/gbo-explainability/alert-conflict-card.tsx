"use client";

import { ArrowRight } from "lucide-react";

import { ConflictActorMark } from "@/components/gbo-explainability/actor-mark";
import type {
  AlertConflictDetail,
  ConflictActorChange,
} from "@/lib/gbo-explainability/types";

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

type ActorChangeSideProps = {
  side: ConflictActorChange;
};

function ChangeValues({ side }: { side: ConflictActorChange }) {
  const { before, after } = resolveChangeValues(side);
  const hasBeforeAfter = Boolean(before && after);
  const isHeld = hasBeforeAfter && before === after;

  if (hasBeforeAfter && !isHeld) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-sm">
        <span className="font-mono text-muted-foreground line-through decoration-slate-300">
          {before}
        </span>
        <ArrowRight className="size-3.5 shrink-0 text-slate-500" aria-hidden />
        <span className="rounded bg-brand-50 px-1 py-px font-mono font-medium text-brand-800">
          {after}
        </span>
      </span>
    );
  }

  if (isHeld) {
    return (
      <span className="font-mono text-sm text-slate-600">Held at {after}</span>
    );
  }

  if (after) {
    return (
      <span className="rounded bg-brand-50 px-1 py-px font-mono text-sm font-semibold text-brand-800">
        Set to {after}
      </span>
    );
  }

  if (before) {
    return (
      <span className="font-mono text-sm text-muted-foreground line-through">
        {before}
      </span>
    );
  }

  return <span className="text-sm text-slate-500">{side.change}</span>;
}

function ActorChangeSide({ side }: ActorChangeSideProps) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5">
      <ConflictActorMark
        actorType={side.actorType}
        actorName={side.actorName}
        className="row-start-1 self-center"
      />

      <div className="row-start-1 min-w-0">
        <span className="truncate text-sm font-medium text-slate-700">
          {displayActor(side)}
        </span>
      </div>

      <div className="col-span-2 row-start-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <ChangeValues side={side} />
        <time className="shrink-0 text-2xs tabular-nums text-muted-foreground">
          {side.timestamp}
        </time>
      </div>
    </div>
  );
}

/** Before/after actor comparison for one overridden entity. */
export function AlertConflictCard({ conflict }: AlertConflictCardProps) {
  return (
    <div className="px-4 py-3.5">
      <p className="mb-4 truncate text-sm font-semibold text-slate-700">
        {conflict.entityName}
        <span className="ml-1.5 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-700">
          {conflict.field}
        </span>
      </p>

      <div className="grid items-start gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-6">
        <ActorChangeSide side={conflict.otherChange} />

        <div
          className="flex shrink-0 items-center justify-center px-3 py-1 text-slate-400 sm:self-center"
          aria-hidden
        >
          <ArrowRight
            className="h-4 w-7 rotate-90 sm:rotate-0"
            strokeWidth={2.25}
          />
        </div>

        <ActorChangeSide side={conflict.inEffectNow} />
      </div>
    </div>
  );
}
