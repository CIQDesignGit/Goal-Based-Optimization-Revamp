"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { useSetupSessionStore } from "@/lib/gbo-optimization/setup-session-store";
import { cn } from "@/lib/utils";

type SetupToastProps = {
  className?: string;
};

export function SetupToast({ className }: SetupToastProps) {
  const toastMessage = useSetupSessionStore((state) => state.toastMessage);
  const toastVariant = useSetupSessionStore((state) => state.toastVariant);

  if (!toastMessage) {
    return null;
  }

  const isSuccess = toastVariant === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg",
        isSuccess
          ? "border-success-200 text-slate-800"
          : "border-amber-200 text-slate-700",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isSuccess ? "bg-success-100" : "bg-amber-100",
        )}
      >
        {isSuccess ? (
          <CheckCircle2
            className="size-4 text-success-600"
            aria-hidden
          />
        ) : (
          <AlertTriangle className="size-3.5 text-amber-600" aria-hidden />
        )}
      </span>
      <span className="font-medium">{toastMessage}</span>
    </div>
  );
}
