"use client";

import {
  formatUsd,
  type PacingRow,
} from "@/lib/home/pacing-instance";
import {
  formatPacingPercent,
  getPacingBandStatus,
  pacingStatusLabel,
  ratioToPercent,
} from "@/lib/home/pacing-status";
import { cn } from "@/lib/utils";

type PacingStateTableProps = {
  rollup: PacingRow | undefined;
  groups: { level1: string; rows: PacingRow[] }[];
};

/** Wide MTD pacing table used in Section A. */
export function PacingStateTable({ rollup, groups }: PacingStateTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <th className="px-3 py-2.5 font-semibold">Level 1</th>
            <th className="px-3 py-2.5 font-semibold">Level 2</th>
            <th className="px-3 py-2.5 font-semibold text-right">Planned MTD</th>
            <th className="px-3 py-2.5 font-semibold text-right">Actual MTD</th>
            <th className="px-3 py-2.5 font-semibold text-right">Pacing %</th>
            <th className="px-3 py-2.5 font-semibold">Goal</th>
            <th className="px-3 py-2.5 font-semibold text-right">Goal Value</th>
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
  );
}

export function groupByLevel1(rows: PacingRow[]) {
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

function GroupRows({
  group,
}: {
  group: { level1: string; rows: PacingRow[] };
}) {
  return (
    <>
      <tr className="bg-brand-50/80">
        <td
          colSpan={10}
          className="px-3 py-1.5 text-xs font-semibold text-brand-800"
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
      : status === "on-plan" || status === "ahead"
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
        "border-b border-slate-100",
        row.isRollup && "bg-slate-50/80 font-medium",
      )}
    >
      <td className="px-3 py-2.5 text-slate-800">
        {hideLevel1 ? "" : row.level1}
        {row.isRollup ? (
          <span className="ml-1.5 text-2xs font-normal text-slate-500">
            (rollup)
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
