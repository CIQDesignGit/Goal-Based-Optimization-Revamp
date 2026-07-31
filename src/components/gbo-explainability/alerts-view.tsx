"use client";

import { AlertRow } from "@/components/gbo-explainability/alert-row";
import { ActionLogsEmptyState } from "@/components/gbo-explainability/action-logs-empty-state";
import {
  ExplainabilityPanel,
  ExplainabilityPanelHeader,
} from "@/components/gbo-explainability/explainability-panel";
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

  const dateGroups = groupAlertsByDate(alerts);

  return (
    <ExplainabilityPanel>
      <ExplainabilityPanelHeader title="Alerts" />

      <div className="divide-y divide-slate-100">
        {dateGroups.map((group) => (
          <section key={group.date} aria-label={formatAlertDateSeparator(group.date)}>
            <header className="sticky top-0 z-10 border-b border-slate-100/80 bg-slate-50/95 px-5 py-2 backdrop-blur-sm">
              <h3 className="text-[11px] font-semibold leading-none tracking-wide text-slate-500 uppercase">
                {formatAlertDateSeparator(group.date)}
              </h3>
            </header>

            <ul className="divide-y divide-slate-100">
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
    </ExplainabilityPanel>
  );
}
