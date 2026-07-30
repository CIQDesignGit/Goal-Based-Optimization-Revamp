"use client";

import { AlertRow } from "@/components/gbo-explainability/alert-row";
import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import type { AlertSummary } from "@/lib/gbo-explainability/types";

type AlertsViewProps = {
  alerts: AlertSummary[];
  onAlertClick: (alert: AlertSummary) => void;
};

export function AlertsView({ alerts, onAlertClick }: AlertsViewProps) {
  if (alerts.length === 0) {
    return <ActionLogsEmptyState kind="no-activity" />;
  }

  return (
    <section className="overflow-hidden border border-border bg-background">
      <ul>
        {alerts.map((alert) => (
          <AlertRow
            key={alert.id}
            alert={alert}
            onClick={() => onAlertClick(alert)}
          />
        ))}
      </ul>
    </section>
  );
}
