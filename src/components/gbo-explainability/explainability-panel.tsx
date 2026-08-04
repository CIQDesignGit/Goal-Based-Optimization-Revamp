import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ExplainabilityPanelProps = {
  children: ReactNode;
  className?: string;
  /** card = inset panel; flush = edge-to-edge workspace shell */
  variant?: "card" | "flush";
};

/** Shared shell for Alerts feed and Action Log table — keeps both views visually aligned. */
export function ExplainabilityPanel({
  children,
  className,
  variant = "card",
}: ExplainabilityPanelProps) {
  return (
    <section
      className={cn(
        variant === "card"
          ? "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
          : "flex h-full min-h-0 flex-col overflow-hidden rounded-none border-0 bg-white shadow-none",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Top bar inside the panel — title, meta, and optional actions. */
export function ExplainabilityPanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
      <div className="min-w-0">
        <h2 className="m-0 text-sm font-semibold tracking-tight text-slate-800">
          {title}
        </h2>
        {description ? (
          <p className="m-0 mt-0.5 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
