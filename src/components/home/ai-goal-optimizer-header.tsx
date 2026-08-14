"use client";

import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Download,
  HelpCircle,
  History,
  Home,
  Lightbulb,
  Megaphone,
  MessageSquareWarning,
  Monitor,
  PencilLine,
  Star,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const utilityActions: Array<{
  label: string;
  icon: typeof Monitor;
  badge?: "success" | "alert";
}> = [
  { label: "Workspace status", icon: Monitor, badge: "success" },
  { label: "Help", icon: HelpCircle },
  { label: "Insights", icon: Lightbulb },
  { label: "Downloads", icon: Download },
  { label: "Reports", icon: BarChart3 },
  { label: "Announcements", icon: Megaphone, badge: "alert" },
  { label: "Feedback", icon: MessageSquareWarning },
];

function UtilityToolbar({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {utilityActions.map(({ label, icon: Icon, badge }) => (
        <Button
          key={label}
          variant="ghost"
          size="icon"
          aria-label={label}
          className="relative size-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Icon className="size-[18px]" />
          {badge === "success" ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-success-500 ring-2 ring-white" />
          ) : null}
          {badge === "alert" ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-white" />
          ) : null}
        </Button>
      ))}
      <Avatar size="sm" className="ml-1 size-8 bg-pink-500 after:border-pink-600">
        <AvatarFallback className="bg-pink-500 text-xs font-semibold text-white">
          VW
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

/** Two-row page header for the AI Goal Optimizer home screen. */
export function AiGoalOptimizerHeader() {
  return (
    <section className="border-b border-slate-200 bg-white px-6 pb-5 pt-4">
      <div className="flex items-center justify-between gap-4">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center text-slate-500 transition-colors hover:text-slate-800"
            aria-label="Home"
          >
            <Home className="size-4" />
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="shrink-0">Advertising</span>
          <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="shrink-0">Optimization</span>
          <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
        </nav>

        <UtilityToolbar className="hidden sm:flex" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Star
            className="size-6 shrink-0 stroke-[1.75] text-warning-500"
            aria-hidden
          />
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-slate-700">
            AI Goal Optimizer
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="h-9 gap-2 rounded-md border-slate-200 bg-white px-4 text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:border-slate-400 focus-visible:ring-slate-200/70"
            render={<Link href="/gbo-optimization" />}
          >
            <PencilLine className="size-4" />
            Edit optimization
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="h-9 gap-2 rounded-md border-slate-200 bg-white px-4 text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:border-slate-400 focus-visible:ring-slate-200/70"
            render={<Link href="/explainability-dashboard" />}
          >
            <History className="size-4" />
            Alerts
          </Button>
        </div>
      </div>

      <UtilityToolbar className="mt-3 sm:hidden" />
    </section>
  );
}
