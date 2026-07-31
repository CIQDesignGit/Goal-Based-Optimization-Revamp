"use client";

import Link from "next/link";
import { ArrowRight, LineChart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import { cn } from "@/lib/utils";

const entryPoints = [
  {
    title: "GBO Optimization",
    description: "Tune and optimize GBO workflows and performance.",
    href: "/gbo-optimization",
    icon: Sparkles,
  },
  {
    title: "Action Logs",
    description:
      "See who changed what and why — Ally AI, rules, and human setup in one place.",
    href: "/explainability-dashboard",
    icon: LineChart,
  },
] as const;

export function SettingsHomeContent() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          GBO home
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose an application to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {entryPoints.map(({ title, description, href, icon: Icon }) => {
          const isExplainability = href === "/explainability-dashboard";

          return (
          <Card key={href} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div
                className={cn(
                  "mb-3 flex size-10 items-center justify-center rounded-lg",
                  isExplainability
                    ? "bg-violet-100 text-violet-500"
                    : "bg-brand-100 text-brand-500",
                )}
              >
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
              <Button
                className={cn(
                  "mt-4 w-full",
                  isExplainability && explainabilityActionable.primaryButton,
                )}
                render={<Link href={href} />}
              >
                Open
                <ArrowRight className="size-4" />
              </Button>
            </CardHeader>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
