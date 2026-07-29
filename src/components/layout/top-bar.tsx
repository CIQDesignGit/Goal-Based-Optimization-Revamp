"use client";

import { Bell, ChevronRight, HelpCircle, Settings } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { usePageTitle } from "@/components/layout/page-title-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const topBarActions = [
  { label: "Notifications", icon: Bell, href: undefined },
  { label: "Help", icon: HelpCircle, href: undefined },
  { label: "Settings", icon: Settings, href: "/settings" },
] as const;

export function TopBar() {
  const { breadcrumbs } = usePageTitle();
  const hasBreadcrumbs = breadcrumbs.length > 0;

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center border-b border-border bg-background px-4",
        hasBreadcrumbs ? "justify-between gap-4" : "justify-end",
      )}
    >
      {hasBreadcrumbs ? (
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm"
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <Fragment key={`${item.label}-${index}`}>
                {index > 0 ? (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/70"
                    aria-hidden
                  />
                ) : null}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </Fragment>
            );
          })}
        </nav>
      ) : null}

      <div className="flex shrink-0 items-center gap-1">
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
      </div>
    </header>
  );
}
