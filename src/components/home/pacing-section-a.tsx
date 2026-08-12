"use client";

import {
  formatUsd,
  type PacingInstance,
  type PacingRow,
} from "@/lib/home/pacing-instance";
import {
  formatPacingPercent,
  getPacingBandStatus,
  pacingStatusLabel,
  ratioToPercent,
} from "@/lib/home/pacing-status";
import { cn } from "@/lib/utils";

type PacingSectionAProps = {
  instance: PacingInstance;
};

/** Section A — Weekly state of the account (Budget Pacing Report style). */
export function PacingSectionA({ instance }: PacingSectionAProps) {
  const leafRows = instance.rows.filter((r) => !r.isRollup);
  const rollup = instance.rows.find((r) => r.isRollup);
  const groups = groupByLevel1(leafRows);

  return (
    <section className="space-y-4 bg-white">
      <h2 className="text-base font-bold text-slate-900">
        Section A – Weekly state of the account
      </h2>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <th className="px-3 py-2.5 font-semibold">Level 1</th>
              <th className="px-3 py-2.5 font-semibold">Level 2</th>
              <th className="px-3 py-2.5 font-semibold text-right">
                Planned MTD
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">
                Actual MTD
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">Pacing %</th>
              <th className="px-3 py-2.5 font-semibold">Goal</th>
              <th className="px-3 py-2.5 font-semibold text-right">
                Goal Value
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">
                ROAS / iROAS
              </th>
              <th className="px-3 py-2.5 font-semibold">Budget/Bid Opt</th>
              <th className="px-3 py-2.5 font-semibold text-right">
                % Time in Budget
              </th>
            </tr>
          </thead>
          <tbody>
            {rollup ? <PacingTableRow row={rollup} /> : null}
            {groups.map((group) => (
              <GroupRows key={group.level1} group={group} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600">
        GBO execution — budget-change success{" "}
        <span className="font-semibold tabular-nums text-slate-800">
          {instance.gboStats.budgetChangeSuccessPercent.toFixed(1)}%
        </span>
        , bid-change success{" "}
        <span className="font-semibold tabular-nums text-slate-800">
          {instance.gboStats.bidChangeSuccessPercent.toFixed(1)}%
        </span>
        , recommendation coverage{" "}
        <span className="font-semibold tabular-nums text-slate-800">
          {instance.gboStats.recommendationCoveragePercent.toFixed(1)}%
        </span>
        .
      </p>

      {instance.sectionAInsights.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-800">
          {instance.sectionAInsights.map((line) => (
            <li key={line.slice(0, 40)}>{line}</li>
          ))}
        </ul>
      ) : null}

      {instance.sectionATrends.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm italic text-slate-800">
            Month-to-date vs previous month trends (same day range)
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-800">
            {instance.sectionATrends.map((t) => (
              <li key={t.lead}>
                <span className="font-semibold">{t.lead}.</span> {t.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function GroupRows({
  group,
}: {
  group: { level1: string; rows: PacingRow[] };
}) {
  return (
    <>
      <tr className="bg-sky-50">
        <td
          colSpan={10}
          className="px-3 py-1.5 text-xs font-semibold text-sky-800"
        >
          {group.level1}
        </td>
      </tr>
      {group.rows.map((row) => (
        <PacingTableRow key={row.id} row={row} hideLevel1 />
      ))}
    </>
  );
}

function PacingTableRow({
  row,
  hideLevel1,
}: {
  row: PacingRow;
  hideLevel1?: boolean;
}) {
  const pct = ratioToPercent(row.actualMtd, row.plannedMtd);
  const status = pct === null ? null : getPacingBandStatus(pct);
  const pacingTone =
    pct === null || status === null
      ? null
      : status === "on-plan"
        ? "text-success-700"
        : status === "ahead"
          ? "text-success-700"
          : pct >= 85
            ? "text-warning-600"
            : "text-error-600";

  const metricTone =
    row.actualMetricValue === null || row.goalValue === null
      ? "text-slate-800"
      : row.actualMetricValue >= row.goalValue
        ? "text-success-700"
        : "text-error-600";

  const optTone =
    row.budgetOpt === "None" || row.bidOpt === "None"
      ? "text-error-600"
      : "text-slate-800";

  return (
    <tr
      className={cn(
        "border-b border-slate-200",
        row.isRollup && "bg-slate-50 font-medium",
      )}
    >
      <td className="px-3 py-2.5 text-slate-800">
        {hideLevel1 ? "" : row.level1}
        {row.isRollup ? (
          <span className="ml-1.5 text-2xs font-normal text-slate-500">
            (rollup — child budgets)
          </span>
        ) : null}
      </td>
      <td className="px-3 py-2.5 text-slate-700">{row.level2}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {formatUsd(row.plannedMtd)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {formatUsd(row.actualMtd)}
      </td>
      <td className="px-3 py-2.5 text-right">
        {pct === null || status === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className={cn("font-semibold tabular-nums", pacingTone)}>
            {pacingStatusLabel(status)} ({formatPacingPercent(pct)})
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-slate-700">{row.goalMetric}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {row.goalValue === null ? "—" : row.goalValue.toFixed(2)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right font-semibold tabular-nums",
          metricTone,
        )}
      >
        {row.actualMetricValue === null
          ? "—"
          : row.actualMetricValue.toFixed(2)}
      </td>
      <td className={cn("px-3 py-2.5", optTone)}>
        {row.budgetOpt} / {row.bidOpt}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
        {row.percentTimeInBudget === null
          ? "—"
          : `${row.percentTimeInBudget.toFixed(1)}%`}
      </td>
    </tr>
  );
}

function groupByLevel1(rows: PacingRow[]) {
  const map = new Map<string, PacingRow[]>();
  for (const row of rows) {
    const list = map.get(row.level1) ?? [];
    list.push(row);
    map.set(row.level1, list);
  }
  return Array.from(map.entries()).map(([level1, groupRows]) => ({
    level1,
    rows: groupRows,
  }));
}
