"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  GitCompare,
  Users,
} from "lucide-react";

import { AlertConflictCard } from "@/components/gbo-explainability/alert-conflict-card";
import { ChangeRow } from "@/components/gbo-explainability/change-row";
import { ManualContributorsList } from "@/components/gbo-explainability/manual-contributors-list";
import { Button } from "@/components/ui/button";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import {
  alertSectionId,
  explainabilityType,
} from "@/lib/gbo-explainability/explainability-typography";
import type { AlertSummary, ManualContributorSummary } from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowDetailsProps = {
  alert: AlertSummary;
  onViewActionLog: () => void;
};

type DetailSectionProps = {
  title: string;
  count?: number;
  subtitle?: ReactNode;
  sectionId: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

const detailSectionCardClass =
  "overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs scroll-mt-4";

function DetailSection({
  title,
  count,
  subtitle,
  sectionId,
  icon,
  children,
  className,
}: DetailSectionProps) {
  return (
    <section id={sectionId} className={className} aria-labelledby={`${sectionId}-title`}>
      <div className={detailSectionCardClass}>
        <div className="p-4">
          <div className="flex items-center gap-1.5">
            {icon}
            <h4 id={`${sectionId}-title`} className={explainabilityType.l2}>
              {title}
              {count != null ? (
                <span className="font-normal text-slate-500"> ({count})</span>
              ) : null}
            </h4>
          </div>
          {subtitle ? (
            <p className={cn("mt-0.5 pl-[calc(1rem+0.375rem)]", explainabilityType.l4)}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
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
      className={cn(
        explainabilityActionable.aiSummaryCard,
        "scroll-mt-4",
      )}
    >
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Image
            src="/icons/ally-ai.png"
            alt=""
            width={19}
            height={19}
            className="size-[1.1875rem] shrink-0 object-cover"
          />
          <h4 className={explainabilityType.l2}>Summary</h4>
        </div>
        <p className={explainabilityType.body}>{summary}</p>
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
    <ul className="divide-y divide-slate-100">
      {deviations.map((deviation) => (
        <li key={deviation.id}>
          <ChangeRow
            entityName={deviation.entityName}
            field={deviation.field}
            before={deviation.before}
            after={deviation.after}
            trailing={
              <span
                className={cn(
                  "font-medium tabular-nums",
                  explainabilityType.l4,
                )}
              >
                {formatPercentChange(deviation.percentChange)}
              </span>
            }
          />
        </li>
      ))}
    </ul>
  );
}

function buildManualSubtitle(
  contributor: ManualContributorSummary,
): ReactNode {
  return (
    <>
      {contributor.name}
      {contributor.email ? ` · ${contributor.email}` : ""}
      {contributor.deactivated ? " (deactivated)" : ""}
    </>
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
    <div className="bg-slate-50/40 pt-5 pb-0">
      <div className="space-y-3 px-0">
        {alert.role !== "human" ? (
          <AlertAiSummary
            id={alertSectionId(alert.id, "summary")}
            summary={alert.aiSummary}
          />
        ) : null}

        {showManualChanges && manualContributors ? (
          <DetailSection
            sectionId={alertSectionId(alert.id, "manual")}
            title="Manual changes"
            subtitle={
              singleContributor
                ? buildManualSubtitle(singleContributor)
                : `${manualContributors.length} people`
            }
            icon={<Users className="size-4 shrink-0 text-slate-500" aria-hidden />}
          >
            <ManualContributorsList
              contributors={manualContributors}
              hideIdentity={Boolean(singleContributor)}
            />
          </DetailSection>
        ) : null}

        {alert.conflicts.length > 0 ? (
          <DetailSection
            sectionId={alertSectionId(alert.id, "overrides")}
            title="Overrides"
            count={alert.conflicts.length}
            icon={<GitCompare className="size-4 shrink-0 text-slate-500" aria-hidden />}
          >
            <ul className="divide-y divide-slate-100">
              {alert.conflicts.map((conflict) => (
                <li key={conflict.id}>
                  <AlertConflictCard conflict={conflict} />
                </li>
              ))}
            </ul>
          </DetailSection>
        ) : null}

        {alert.deviations.length > 0 ? (
          <DetailSection
            sectionId={alertSectionId(alert.id, "deviations")}
            title="High deviations"
            count={alert.deviations.length}
            icon={<Activity className="size-4 shrink-0 text-slate-500" aria-hidden />}
          >
            <DeviationsPanel deviations={alert.deviations} />
          </DetailSection>
        ) : null}
      </div>

      <footer
        id={alertSectionId(alert.id, "actions")}
        className="mt-4 flex scroll-mt-4 justify-start py-3 pr-4"
      >
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
      </footer>
    </div>
  );
}
