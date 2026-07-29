"use client";

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

type ActorChangeCardProps = {
  side: ConflictActorChange;
  borderClassName: string;
};

/** One actor's change — actor + time, value, one-line summary. */
function ActorChangeCard({ side, borderClassName }: ActorChangeCardProps) {
  return (
    <div
      className={`flex h-full flex-col rounded-md border bg-white p-3 ${borderClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {displayActor(side)}
        </p>
        <p className="shrink-0 font-mono text-xs text-muted-foreground">
          {side.timestamp}
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{side.change}</p>
      <p className="mt-auto pt-2 text-sm leading-snug text-muted-foreground">
        {side.summary}
      </p>
    </div>
  );
}

/** Two cards comparing the first actor's change vs the second that superseded it. */
export function AlertConflictCard({ conflict }: AlertConflictCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <ActorChangeCard
          side={conflict.otherChange}
          borderClassName="border-border"
        />
        <ActorChangeCard
          side={conflict.inEffectNow}
          borderClassName="border-success-200"
        />
      </div>
    </article>
  );
}
