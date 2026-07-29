"use client";

import { AlertRow } from "@/components/gbo-explainability/alert-row";
import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import {
  formatAlertDateSeparator,
  groupAlertsByDate,
} from "@/lib/gbo-explainability/aggregate-alerts";
import type { AlertSummary } from "@/lib/gbo-explainability/types";

type AlertsViewProps = {
  alerts: AlertSummary[];
  onAlertClick: (alert: AlertSummary) => void;
};

export function AlertsView({ alerts, onAlertClick }: AlertsViewProps) {
  if (alerts.length === 0) {
    return <ActionLogsEmptyState kind="no-activity" />;
  }

  const groups = groupAlertsByDate(alerts);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
          <section
            key={group.date}
            aria-labelledby={`alert-date-${group.date}`}
            className="overflow-hidden rounded-lg border border-border bg-background"
          >
            <div
              id={`alert-date-${group.date}`}
              className="border-b border-border bg-slate-50 px-4 py-2.5"
            >
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {formatAlertDateSeparator(group.date)}
              </span>
            </div>
            <ul>
              {group.alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onClick={() => onAlertClick(alert)}
                />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
