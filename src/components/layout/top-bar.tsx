"use client";

import { Bell, HelpCircle, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const topBarActions = [
  { label: "Notifications", icon: Bell, href: undefined },
  { label: "Help", icon: HelpCircle, href: undefined },
  { label: "Settings", icon: Settings, href: "/settings" },
] as const;

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-1 border-b border-border bg-background px-4">
      {topBarActions.map(({ label, icon: Icon, href }) =>
        href ? (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-neutral-100"
            render={<Link href={href} aria-label={label} />}
          >
            <Icon className="size-5" />
          </Button>
        ) : (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            aria-label={label}
            className="text-muted-foreground hover:bg-neutral-100"
          >
            <Icon className="size-5" />
          </Button>
        ),
      )}
    </header>
  );
}
