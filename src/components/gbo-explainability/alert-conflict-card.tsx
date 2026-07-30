"use client";

import { ArrowRight } from "lucide-react";

import { ConflictActorMark } from "@/components/gbo-explainability/actor-mark";
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

type ActorChangeCardProps = {
  side: ConflictActorChange;
  role: "earlier" | "current";
};

function ActorChangeCard({ side, role }: ActorChangeCardProps) {
  const isCurrent = role === "current";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border bg-background p-4",
        isCurrent
          ? "border-emerald-200/80 ring-1 ring-emerald-100"
          : "border-border",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ConflictActorMark
            actorType={side.actorType}
            actorName={side.actorName}
          />
          <p className="truncate text-sm font-semibold text-foreground">
            {displayActor(side)}
          </p>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground">
          {side.timestamp}
        </time>
      </div>

      <p className="text-base font-medium text-slate-800">
        {side.change}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {side.summary}
      </p>
    </div>
  );
}

/** Before/after actor comparison for one overridden entity. */
export function AlertConflictCard({ conflict }: AlertConflictCardProps) {
  return (
    <div className="p-4">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {conflict.entityName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {conflict.overriddenActor} was overridden
            {conflict.timeSinceOverride
              ? ` · ${conflict.timeSinceOverride}`
              : ""}
          </p>
        </div>
      </header>

      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <ActorChangeCard side={conflict.otherChange} role="earlier" />
        <div
          className="hidden items-center justify-center text-muted-foreground sm:flex"
          aria-hidden
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background">
            <ArrowRight className="size-4" />
          </span>
        </div>
        <ActorChangeCard side={conflict.inEffectNow} role="current" />
      </div>
    </div>
  );
}
