"use client";

import type { PacingInstance } from "@/lib/home/pacing-instance";

type PacingSectionCdeProps = {
  instance: PacingInstance;
};

/** Sections C–E — Budget Pacing Report narrative style. */
export function PacingSectionCde({ instance }: PacingSectionCdeProps) {
  if (instance.aiNarrativeUnavailable) {
    return (
      <div className="space-y-8">
        <PendingBlock title="Section C – What changed and why" />
        <PendingBlock title="Section D – What to do this week" />
        <PendingBlock title="Section E – Watchouts" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white">
      {/* Section C */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Section C – What changed and why
        </h2>
        <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-800">
          {instance.changeDrivers.map((d) => (
            <li key={d.id}>
              <span className="font-semibold lowercase">{d.title}:</span>{" "}
              {d.detail}
            </li>
          ))}
        </ul>
      </section>

      {/* Section D */}
      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          Section D – What to do this week
        </h2>
        {instance.recommendations.length === 0 ? (
          <p className="text-sm text-slate-600">
            No prioritized actions for this selection. Coverage gaps still
            appear in recommendation-coverage % (Section A).
          </p>
        ) : (
          <ol className="space-y-6">
            {instance.recommendations.map((r, index) => (
              <li key={r.id} className="space-y-2 text-sm leading-relaxed text-slate-800">
                <p className="font-bold text-slate-900">
                  {index + 1}. {r.action}
                </p>
                <ReportField label="Action" value={r.action} />
                <ReportField label="Lever used" value={r.lever} />
                <ReportField
                  label="Exact setting change"
                  value={r.exactSettingChange}
                />
                <ReportField label="Why this now" value={r.whyNow} />
                <ReportField label="Expected impact" value={r.expectedImpact} />
                <ReportField label="Risk" value={r.risk} />
                <ReportField
                  label="How to monitor this week"
                  value={r.howToMonitor}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Section E */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Section E – Watchouts
        </h2>
        <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-800">
          {instance.watchouts.map((w) => (
            <li key={w.id}>
              <span className="font-semibold">{w.title}.</span> {w.detail}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

function PendingBlock({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="text-sm italic text-slate-500">Summary pending</p>
    </section>
  );
}
