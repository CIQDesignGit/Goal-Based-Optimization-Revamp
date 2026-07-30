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

type ActorChangeCardProps = {
  side: ConflictActorChange;
  field: string;
  role: "earlier" | "current";
};

function ChangeValues({ side }: { side: ConflictActorChange }) {
  const { before, after } = resolveChangeValues(side);
  const hasBeforeAfter = Boolean(before && after);
  const isHeld = hasBeforeAfter && before === after;

  if (hasBeforeAfter && !isHeld) {
    return (
      <>
        <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground line-through decoration-slate-300">
          {before}
        </span>
        <ArrowRight className="size-3 shrink-0 text-brand-500" aria-hidden />
        <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-800">
          {after}
        </span>
      </>
    );
  }

  if (isHeld) {
    return (
      <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-700">
        Held at {after}
      </span>
    );
  }

  if (after) {
    return (
      <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-800">
        Set to {after}
      </span>
    );
  }

  if (before) {
    return (
      <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground line-through">
        {before}
      </span>
    );
  }

  return <span className="text-xs font-medium text-slate-800">{side.change}</span>;
}

function ActorChangeCard({ side, field, role }: ActorChangeCardProps) {
  const isCurrent = role === "current";
  const roleLabel = isCurrent ? "Override (in effect)" : "Previous change";

  return (
    <div
      className={cn(
        "rounded-md border bg-background px-3 py-2.5",
        isCurrent
          ? "border-emerald-200/80 ring-1 ring-emerald-100"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <ConflictActorMark
            actorType={side.actorType}
            actorName={side.actorName}
          />
          <p className="truncate text-xs font-medium text-slate-600">
            {displayActor(side)}
          </p>
        </div>
        <time className="shrink-0 text-2xs text-muted-foreground">
          {side.timestamp}
        </time>
      </div>

      <p className="mt-2 text-xs font-medium text-muted-foreground">{field}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <ChangeValues side={side} />
        </div>
        <p className="shrink-0 text-2xs font-medium text-muted-foreground">
          {roleLabel}
        </p>
      </div>
    </div>
  );
}

/** Before/after actor comparison for one overridden entity. */
export function AlertConflictCard({ conflict }: AlertConflictCardProps) {
  return (
    <div className="px-3 py-2.5">
      <header className="mb-2">
        <p className="text-sm font-semibold text-foreground">
          {conflict.entityName}
        </p>
        <p className="text-2xs text-muted-foreground">
          {conflict.field} · {conflict.overriddenActor} was overridden{" "}
          {conflict.timeSinceOverride}
        </p>
      </header>

      <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <ActorChangeCard
          side={conflict.otherChange}
          field={conflict.field}
          role="earlier"
        />
        <div
          className="hidden items-center justify-center text-muted-foreground sm:flex"
          aria-hidden
        >
          <ArrowRight className="size-3.5" />
        </div>
        <ActorChangeCard
          side={conflict.inEffectNow}
          field={conflict.field}
          role="current"
        />
      </div>
    </div>
  );
}
