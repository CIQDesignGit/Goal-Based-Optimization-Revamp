"use client";

import { Info } from "lucide-react";
import type { CSSProperties } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PacingInstance } from "@/lib/home/pacing-instance";
import {
  buildSpendUtilisationComparison,
  buildUtilisationChartSummary,
  utilisationBarScale,
  utilisationPositionOnScale,
} from "@/lib/home/projected-spend-utilisation";
import { formatPacingPercent } from "@/lib/home/pacing-status";

/** Light teal — categorical forecast fill (not success/error). */
const PROJECTED_FILL = "hsl(174 42% 78%)";
const CURRENT_FILL = "#3b82f6"; // brand-500
const TRACK_FILL = "#f1f5f9"; // slate-100
const TICK_CURRENT = "#2563eb"; // brand-600
const TICK_PROJECTED = "hsl(174 45% 40%)";
const TICK_TARGET = "#0f172a"; // slate-900

type ProjectedSpendUtilisationCardProps = {
  instance: PacingInstance;
};

/**
 * KPI card with a composition bar.
 * Legend names the series; the bar only shows $ and % values.
 * Target is always the 100% mark.
 */
export function ProjectedSpendUtilisationCard({
  instance,
}: ProjectedSpendUtilisationCardProps) {
  const { current, projected } = buildSpendUtilisationComparison(instance);
  // Zoom into the marker range so values aren’t stacked at the right edge
  const { min: scaleMin, max: scaleMax } = utilisationBarScale(
    current.utilisationPct,
    projected.utilisationPct,
  );
  const currentPos = utilisationPositionOnScale(
    current.utilisationPct,
    scaleMin,
    scaleMax,
  );
  const projectedPos = utilisationPositionOnScale(
    projected.utilisationPct,
    scaleMin,
    scaleMax,
  );
  const targetPos = utilisationPositionOnScale(100, scaleMin, scaleMax);
  const chartSummary = buildUtilisationChartSummary(current, projected);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Projected spend &amp; utilisation
          </h2>
          <Tooltip>
            <TooltipTrigger
              className="inline-flex text-slate-400 transition-colors hover:text-slate-600"
              aria-label="About projected spend and utilisation"
            >
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-[280px] flex-col items-start gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-800 shadow-md [&>div:last-child]:hidden"
            >
              <p className="text-sm font-semibold text-slate-900">
                Projected spend &amp; utilisation
              </p>
              <p className="text-xs font-normal leading-relaxed text-slate-600">
                Solid blue = current MTD. Striped teal = projected month-end.
                The black tick is always the 100% monthly target.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="space-y-5 bg-white p-4">
        <div>
          <p className="text-sm text-slate-500">Projected month-end</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
              {projected.spendLabel}
            </p>
            <p className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold tabular-nums tracking-tight text-slate-700">
                {projected.utilisationLabel}
              </span>
              <span className="text-sm text-slate-500">utilisation</span>
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm leading-snug text-slate-600">
            <SummaryText text={chartSummary} />
          </p>

          <CompositionBar
            currentPos={currentPos}
            projectedPos={projectedPos}
            targetPos={targetPos}
            scaleMax={scaleMax}
            currentSpend={current.spendLabel}
            currentPct={current.utilisationLabel}
            projectedSpend={projected.spendLabel}
            projectedPct={projected.utilisationLabel}
            targetSpend={projected.plannedBudgetLabel}
            ariaLabel={chartSummary.replace(/\*\*/g, "")}
            showCurrent={current.hasPlan}
            showProjected={projected.hasPlan}
          />

          {/* Legend under the bar */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: CURRENT_FILL }}
                aria-hidden
              />
              Current
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={projectedSwatchStyle}
                aria-hidden
              />
              Projected
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-px"
                style={{ backgroundColor: TICK_TARGET }}
                aria-hidden
              />
              Target (100%)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const projectedSwatchStyle: CSSProperties = {
  backgroundColor: PROJECTED_FILL,
  backgroundImage: `repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.55) 2px,
    rgba(255,255,255,0.55) 4px
  )`,
};

/** Renders **bold** markers so $ and % stand out in the summary. */
function SummaryText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

/**
 * Composition bar — value labels sit on their ticks (Current / Projected / Target).
 * Current + Target below; Projected above — so nearby ticks don’t collide.
 */
function CompositionBar({
  currentPos,
  projectedPos,
  targetPos,
  scaleMax,
  currentSpend,
  currentPct,
  projectedSpend,
  projectedPct,
  targetSpend,
  ariaLabel,
  showCurrent,
  showProjected,
}: {
  currentPos: number;
  projectedPos: number;
  targetPos: number;
  scaleMax: number;
  currentSpend: string;
  currentPct: string;
  projectedSpend: string;
  projectedPct: string;
  targetSpend: string;
  ariaLabel: string;
  showCurrent: boolean;
  showProjected: boolean;
}) {
  const W = 1000;
  const H = 118;
  const trackY = 40;
  const trackH = 14;
  const trackX = 8; // inset so edge ticks/labels aren’t clipped
  const trackW = 984;
  const radius = 7;

  const xAt = (pct: number) => trackX + (pct / 100) * trackW;
  const currentX = xAt(currentPos);
  const projectedX = xAt(projectedPos);
  const targetX = xAt(targetPos);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <pattern
          id="projected-hatch"
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(-45)"
        >
          <rect width="8" height="8" fill={PROJECTED_FILL} />
          <rect width="3" height="8" fill="rgba(255,255,255,0.45)" />
        </pattern>
        <clipPath id="track-clip">
          <rect
            x={trackX}
            y={trackY}
            width={trackW}
            height={trackH}
            rx={radius}
            ry={radius}
          />
        </clipPath>
      </defs>

      <rect
        x={trackX}
        y={trackY}
        width={trackW}
        height={trackH}
        rx={radius}
        ry={radius}
        fill={TRACK_FILL}
      />

      <g clipPath="url(#track-clip)">
        {showProjected ? (
          <rect
            x={trackX}
            y={trackY}
            width={Math.max(0, projectedX - trackX)}
            height={trackH}
            fill="url(#projected-hatch)"
          />
        ) : null}
        {showCurrent ? (
          <rect
            x={trackX}
            y={trackY}
            width={Math.max(0, currentX - trackX)}
            height={trackH}
            fill={CURRENT_FILL}
          />
        ) : null}
      </g>

      {showCurrent ? (
        <line
          x1={currentX}
          x2={currentX}
          y1={trackY - 4}
          y2={trackY + trackH + 4}
          stroke={TICK_CURRENT}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
      {showProjected ? (
        <line
          x1={projectedX}
          x2={projectedX}
          y1={trackY - 4}
          y2={trackY + trackH + 4}
          stroke={TICK_PROJECTED}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
      {showProjected ? (
        <line
          x1={targetX}
          x2={targetX}
          y1={trackY - 4}
          y2={trackY + trackH + 4}
          stroke={TICK_TARGET}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}

      {/* Values glued to their ticks — $ primary, % quieter underneath */}
      {showCurrent ? (
        <ValueLabel
          x={currentX}
          y={trackY + trackH + 18}
          spend={currentSpend}
          pct={currentPct}
          anchor="middle"
        />
      ) : null}

      {showProjected ? (
        <ValueLabel
          x={projectedX}
          y={trackY - 28}
          spend={projectedSpend}
          pct={projectedPct}
          anchor="middle"
        />
      ) : null}

      {showProjected ? (
        <ValueLabel
          x={targetX}
          y={trackY + trackH + 18}
          spend={targetSpend}
          pct="100%"
          anchor={targetPos >= 90 ? "end" : "middle"}
        />
      ) : null}

      {/* Scale ends: 0 → max(target, projected) */}
      <text
        x={trackX}
        y={H - 6}
        textAnchor="start"
        fill="#94a3b8"
        style={{ fontSize: 10, fontWeight: 400 }}
      >
        0%
      </text>
      <text
        x={trackX + trackW}
        y={H - 6}
        textAnchor="end"
        fill="#94a3b8"
        style={{ fontSize: 10, fontWeight: 400 }}
      >
        {formatPacingPercent(scaleMax)}
      </text>
    </svg>
  );
}

/** Stacked $ + muted % under/above a tick. */
function ValueLabel({
  x,
  y,
  spend,
  pct,
  anchor,
}: {
  x: number;
  y: number;
  spend: string;
  pct: string;
  anchor: "start" | "middle" | "end";
}) {
  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fill="#0f172a"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {spend}
      </text>
      <text
        x={x}
        y={y + 14}
        textAnchor={anchor}
        fill="#94a3b8"
        style={{ fontSize: 10, fontWeight: 400 }}
      >
        {pct}
      </text>
    </g>
  );
}
