import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import {
  ChangeValueAfter,
  ChangeValueBefore,
  ChangeValueDisplay,
} from "@/components/gbo-explainability/change-value-display";
import { detailChangeRowGrid } from "@/lib/gbo-explainability/detail-layout";
import { explainabilityType } from "@/lib/gbo-explainability/explainability-typography";
import { cn } from "@/lib/utils";

type ChangeRowProps = {
  entityName: string;
  field: string;
  before: string | null;
  after: string | null;
  trailing?: ReactNode;
  className?: string;
};

function FieldBadge({ field }: { field: string }) {
  return (
    <span className="inline-flex max-w-full truncate rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
      {field}
    </span>
  );
}

/** Scannable entity / field / before→after row — shared across detail sections. */
export function ChangeRow({
  entityName,
  field,
  before,
  after,
  trailing,
  className,
}: ChangeRowProps) {
  const showArrow = Boolean(before && after && before !== after);

  return (
    <div className={cn(detailChangeRowGrid, className)}>
      <p className={cn("min-w-0 truncate", explainabilityType.l3)}>
        {entityName}
      </p>

      <div className="min-w-0 sm:hidden">
        <span className={explainabilityType.l4}>Field </span>
        <FieldBadge field={field} />
      </div>
      <div className="hidden min-w-0 justify-self-start sm:block">
        <FieldBadge field={field} />
      </div>

      {/* Mobile — inline before → after */}
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-3 gap-y-1 sm:hidden">
        <ChangeValueDisplay before={before} after={after} />
        {trailing}
      </div>

      {/* Desktop — subgrid columns align before / after across rows */}
      <div className="hidden min-w-0 justify-self-start sm:block">
        <ChangeValueBefore value={before} />
      </div>

      <div
        className="hidden items-center justify-center text-slate-400 sm:flex"
        aria-hidden={!showArrow}
      >
        {showArrow ? <ArrowRight className="size-3 shrink-0" /> : null}
      </div>

      <div className="hidden min-w-0 justify-self-start sm:block">
        <ChangeValueAfter value={after} />
      </div>

      <div className="hidden min-w-0 justify-self-start sm:block">
        {trailing}
      </div>
    </div>
  );
}
