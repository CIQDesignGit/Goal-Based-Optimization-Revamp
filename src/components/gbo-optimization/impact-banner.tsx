"use client";

import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImpactBannerProps = {
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

/** Non-blocking guidance banner for goal-change and compatibility messages (FR-004, FR-006). */
export function ImpactBanner({
  title = "Heads up",
  children,
  onDismiss,
  className,
}: ImpactBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-amber-900">{title}</p>
        <div className="leading-relaxed text-amber-900/90">{children}</div>
      </div>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          className="shrink-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
          aria-label="Dismiss message"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
