"use client";

import type { PacingInstance } from "@/lib/home/pacing-instance";
import { cn } from "@/lib/utils";

type PacingSectionBProps = {
  instance: PacingInstance;
};

/** Section B — Constraint analysis (Budget Pacing Report style). */
export function PacingSectionB({ instance }: PacingSectionBProps) {
  const { constraints } = instance;

  return (
    <section className="space-y-4 bg-white">
      <h2 className="text-base font-bold text-slate-900">
        Section B – Constraint analysis
      </h2>

      {constraints.length === 0 ? (
        <p className="text-sm text-slate-600">No constraints set.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                  <th className="px-3 py-2.5 font-semibold">Alert</th>
                  <th className="px-3 py-2.5 font-semibold">Level 1</th>
                  <th className="px-3 py-2.5 font-semibold">Level 2</th>
                  <th className="px-3 py-2.5 font-semibold">Group</th>
                  <th className="px-3 py-2.5 font-semibold">Constraint Type</th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Constraint %
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Spend Share %
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Deviation
                  </th>
                </tr>
              </thead>
              <tbody>
                {constraints.map((c) => (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded border px-2 py-0.5 text-2xs font-semibold",
                          c.alert === "High Deviation"
                            ? "border-error-500/40 bg-error-50 text-error-600"
                            : "border-warning-500/40 bg-warning-50 text-warning-700",
                        )}
                      >
                        {c.alert}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">{c.level1}</td>
                    <td className="px-3 py-2.5 text-slate-700">{c.level2}</td>
                    <td className="px-3 py-2.5 text-slate-700">{c.group}</td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {c.constraintType}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
                      {c.constraintPercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">
                      {c.spendSharePercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-error-600">
                      {Math.abs(c.deviationPoints).toFixed(1)}pp (
                      {Math.abs(c.deviationRelativePercent).toFixed(0)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-800">
            {constraints.map((c) => (
              <li key={`${c.id}-note`}>{c.plainLanguage}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
