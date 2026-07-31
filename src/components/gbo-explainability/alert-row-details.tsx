"use client";

import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  GitCompare,
  Users,
} from "lucide-react";

import { AlertConflictCard } from "@/components/gbo-explainability/alert-conflict-card";
import { ActorMark } from "@/components/gbo-explainability/actor-mark";
import {
  ContributorAvatar,
  ManualContributorsList,
} from "@/components/gbo-explainability/manual-contributors-list";
import { Button } from "@/components/ui/button";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import type { AlertSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowDetailsProps = {
  alert: AlertSummary;
  onViewActionLog: () => void;
};

type DetailSectionProps = {
  title: ReactNode;
  icon: ReactNode;
  iconClassName: string;
  iconShape?: "square" | "avatar";
  titleId?: string;
  children: ReactNode;
  className?: string;
};

function DetailSection({
  title,
  icon,
  iconClassName,
  iconShape = "square",
  titleId,
  children,
  className,
}: DetailSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            iconShape === "avatar"
              ? "bg-transparent p-0"
              : "size-7 rounded-lg",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h4
          id={titleId}
          className="text-sm font-semibold tracking-tight text-slate-800"
        >
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function AlertAiSummary({
  id,
  summary,
}: {
  id: string;
  summary: string;
}) {
  return (
    <div
      id={id}
      role="note"
      aria-label="Summary"
      className={explainabilityActionable.aiSummaryCard}
    >
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <ActorMark kind="ally-ai" size="sm" className="shrink-0" />
          <h4 className="text-sm font-semibold tracking-tight text-slate-800">
            Summary
          </h4>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
      </div>
    </div>
  );
}

function formatPercentChange(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function DeviationsPanel({
  deviations,
}: {
  deviations: AlertSummary["deviations"];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-sky-100/80 bg-white shadow-xs">
      <div
        className="hidden gap-x-4 border-b border-sky-100/80 bg-sky-50/80 px-4 py-2 text-[10px] font-medium tracking-wider text-slate-500 uppercase sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_4.5rem]"
        aria-hidden
      >
        <span>Entity</span>
        <span>Field</span>
        <span>Before → After</span>
        <span className="text-right">Change</span>
      </div>
      <ul className="divide-y divide-sky-50">
        {deviations.map((deviation) => (
          <li
            key={deviation.id}
            className="grid grid-cols-1 gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_4.5rem] sm:items-center"
          >
            <p className="truncate text-sm font-medium text-slate-800">
              {deviation.entityName}
            </p>
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              {deviation.field}
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs sm:text-sm">
              <span className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-slate-500">
                {deviation.before}
              </span>
              <ArrowRight
                className="size-3 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono font-medium text-sky-900">
                {deviation.after}
              </span>
            </div>
            <span className="shrink-0 justify-self-start text-xs font-medium tabular-nums text-slate-500 sm:justify-self-end sm:text-right">
              {formatPercentChange(deviation.percentChange)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AlertRowDetails({
  alert,
  onViewActionLog,
}: AlertRowDetailsProps) {
  const manualContributors = alert.manualContributors;
  const showManualChanges = Boolean(manualContributors?.length);
  const singleContributor =
    manualContributors?.length === 1 ? manualContributors[0] : null;

  return (
    <div className="space-y-7 bg-slate-50/40 py-6">
      {alert.role !== "human" ? (
        <AlertAiSummary
          id={`${alert.id}-ai-summary`}
          summary={alert.aiSummary}
        />
      ) : null}

      {showManualChanges && manualContributors ? (
        <DetailSection
              title={
                singleContributor ? (
                  <>
                    Changes done by {singleContributor.name}
                    {singleContributor.email ? (
                      <span className="font-normal text-slate-400">
                        {" "}
                        · {singleContributor.email}
                      </span>
                    ) : null}
                    {singleContributor.deactivated ? (
                      <span className="font-normal text-slate-400">
                        {" "}
                        (deactivated)
                      </span>
                    ) : null}
                  </>
                ) : (
                  `Manual changes by person (${manualContributors.length})`
                )
              }
              icon={
                singleContributor ? (
                  <ContributorAvatar name={singleContributor.name} />
                ) : (
                  <Users className="size-3.5" aria-hidden />
                )
              }
              iconShape={singleContributor ? "avatar" : "square"}
              iconClassName={
                singleContributor ? "" : "bg-slate-100 text-slate-600"
              }
              className="space-y-2.5"
            >
              <ManualContributorsList
                contributors={manualContributors}
                hideIdentity={Boolean(singleContributor)}
              />
            </DetailSection>
          ) : null}

          {alert.conflicts.length > 0 ? (
            <DetailSection
              title={`Overrides (${alert.conflicts.length})`}
              icon={<GitCompare className="size-3.5" aria-hidden />}
              iconClassName="bg-amber-50 text-amber-700"
            >
              <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
                <ul className="divide-y divide-slate-100">
                  {alert.conflicts.map((conflict) => (
                    <li key={conflict.id}>
                      <AlertConflictCard conflict={conflict} />
                    </li>
                  ))}
                </ul>
              </div>
            </DetailSection>
          ) : null}

          {alert.deviations.length > 0 ? (
            <DetailSection
              title={`High deviations (${alert.deviations.length})`}
              icon={<Activity className="size-3.5" aria-hidden />}
              iconClassName="bg-sky-50 text-sky-700"
              className="space-y-2.5"
            >
              <DeviationsPanel deviations={alert.deviations} />
            </DetailSection>
          ) : null}

      <Button
        type="button"
        size="default"
        className={cn(
          "gap-1.5 rounded-[8px] shadow-xs",
          explainabilityActionable.primaryButton,
        )}
        onClick={onViewActionLog}
      >
        View in Action Log
        <ArrowRight className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
