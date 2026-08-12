"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Delays rendering children so each widget can “load” independently.
 * Slowest widget must not block siblings (FR-012).
 * Remount with a new `key` when filters change to restart the delay.
 */
export function DeferredWidget({
  delayMs,
  skeleton,
  children,
  className,
}: {
  delayMs: number;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [ready, setReady] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  return <div className={cn(className)}>{ready ? children : skeleton}</div>;
}
