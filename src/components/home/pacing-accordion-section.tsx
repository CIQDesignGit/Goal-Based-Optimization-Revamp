"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type PacingAccordionSectionProps = {
  title: string;
  /** Short subtitle under the title — required for consistent section headers. */
  description: string;
  /** Extra controls in the header (e.g. GBO stats). */
  headerRight?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Collapsible card shell for Pacing report sections.
 * Body stays in the DOM for print/PDF (hidden with CSS when collapsed).
 */
export function PacingAccordionSection({
  title,
  description,
  headerRight,
  defaultOpen = true,
  className,
  children,
}: PacingAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs",
        className,
      )}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-slate-400 transition-transform print:hidden",
              open && "rotate-180",
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </button>
        {headerRight ? (
          <div className="shrink-0 pl-6 sm:pl-0">{headerRight}</div>
        ) : null}
      </header>

      <div
        data-pacing-accordion-body=""
        className={cn(!open && "hidden print:block!")}
      >
        {children}
      </div>
    </section>
  );
}
