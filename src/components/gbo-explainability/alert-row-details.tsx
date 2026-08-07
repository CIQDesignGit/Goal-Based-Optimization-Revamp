"use client";

import type { ReactNode } from "react";
import {
  Activity,
  GitCompare,
  Users,
} from "lucide-react";

import { AlertConflictCard } from "@/components/gbo-explainability/alert-conflict-card";
import { ActorMark } from "@/components/gbo-explainability/actor-mark";
import { ChangeRow } from "@/components/gbo-explainability/change-row";
import { ManualContributorsList } from "@/components/gbo-explainability/manual-contributors-list";
import { explainabilityActionable } from "@/lib/gbo-explainability/actionable-styles";
import {
  detailChangeRowItem,
  detailChangeRowList,
} from "@/lib/gbo-explainability/detail-layout";
import {
  alertSectionId,
  explainabilityType,
} from "@/lib/gbo-explainability/explainability-typography";
import type {
  AlertRole,
  AlertSummary,
  ManualContributorSummary,
} from "@/lib/gbo-explainability/types";
import { cn } from "@/lib/utils";

type AlertRowDetailsProps = {
  alert: AlertSummary;
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

/** Maps alert role → ActorMark kind (same four explainability actors). */
function actorKindForRole(role: AlertRole) {
  return role === "human" ? "human" : role;
}

function AlertAiSummary({
  id,
  summary,
  role,
  personName,
}: {
  id: string;
  summary: string;
  role: AlertRole;
  /** Used for Manual summary avatar initials. */
  personName?: string;
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
          <ActorMark
            kind={actorKindForRole(role)}
            name={personName}
            size="sm"
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
    <ul className={detailChangeRowList}>
      {deviations.map((deviation) => (
        <li key={deviation.id} className={detailChangeRowItem}>
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

export function AlertRowDetails({ alert }: AlertRowDetailsProps) {
  const manualContributors = alert.manualContributors;
  const showManualChanges = Boolean(manualContributors?.length);
  const singleContributor =
    manualContributors?.length === 1 ? manualContributors[0] : null;

  // Temporarily hide Manual changes in the detail pane — keep the block below for easy restore.
  const showManualChangesSection = false;

  return (
    <div className="space-y-4">
      {/* Summary is always shown — Ally AI, Rule Based, Day Parting, and Manual */}
      <AlertAiSummary
        id={alertSectionId(alert.id, "summary")}
        summary={alert.aiSummary}
        role={alert.role}
        personName={
          alert.role === "human"
            ? (singleContributor?.name ?? alert.actor.label)
            : undefined
        }
      />

      {showManualChangesSection && showManualChanges && manualContributors ? (
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
          icon={<GitCompare className="size-4 shrink-0 text-amber-600" aria-hidden />}
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
          icon={<Activity className="size-4 shrink-0 text-sky-600" aria-hidden />}
        >
          <DeviationsPanel deviations={alert.deviations} />
        </DetailSection>
      ) : null}
    </div>
  );
}
