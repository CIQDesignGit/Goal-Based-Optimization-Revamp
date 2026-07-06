"use client";

import { AlertTriangle } from "lucide-react";

import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

type SetupToastProps = {
  className?: string;
};

export function SetupToast({ className }: SetupToastProps) {
  const toastMessage = useSetupSessionStore((state) => state.toastMessage);

  if (!toastMessage) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-lg",
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="size-3.5 text-amber-600" aria-hidden />
      </span>
      {toastMessage}
    </div>
  );
}
