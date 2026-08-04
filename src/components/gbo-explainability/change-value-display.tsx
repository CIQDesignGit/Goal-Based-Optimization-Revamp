import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ChangeValueSize = "sm" | "md";

type ChangeValuePartProps = {
  value: string | null;
  className?: string;
  size?: ChangeValueSize;
};

type ChangeValueDisplayProps = {
  before: string | null;
  after: string | null;
  className?: string;
  size?: ChangeValueSize;
};

function textSizeClass(size: ChangeValueSize): string {
  return size === "sm" ? "text-xs sm:text-sm" : "text-sm";
}

/** True for currency, percentages, and plain numbers — mono font. Labels use Inter. */
function isNumericChangeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!/\d/.test(trimmed)) return false;

  const normalized = trimmed.replace(/^[\$€£]/, "").replace(/,/g, "");
  return (
    /^[\d.]+[kmb%]?$/i.test(normalized) || /^\d+(\.\d+)?%$/.test(normalized)
  );
}

function changeValueClass(value: string, variant: "before" | "after"): string {
  const numeric = isNumericChangeValue(value);

  if (variant === "before") {
    return cn(
      "text-muted-foreground line-through decoration-slate-300",
      numeric && "font-mono tabular-nums",
    );
  }

  return cn(
    "rounded bg-brand-50 px-1 py-px font-medium text-brand-800",
    numeric && "font-mono tabular-nums",
  );
}

/** Previous / superseded value — left-aligned column in change rows. */
export function ChangeValueBefore({
  value,
  className,
  size = "sm",
}: ChangeValuePartProps) {
  if (!value) return null;

  return (
    <span
      className={cn(
        changeValueClass(value, "before"),
        textSizeClass(size),
        className,
      )}
    >
      {value}
    </span>
  );
}

/** New / in-effect value — left-aligned column in change rows. */
export function ChangeValueAfter({
  value,
  className,
  size = "sm",
}: ChangeValuePartProps) {
  if (!value) return null;

  return (
    <span
      className={cn(changeValueClass(value, "after"), textSizeClass(size), className)}
    >
      {value}
    </span>
  );
}

/** Inline before → after display — used in compact layouts (e.g. override cards). */
export function ChangeValueDisplay({
  before,
  after,
  className,
  size = "sm",
}: ChangeValueDisplayProps) {
  const textSize = textSizeClass(size);

  if (before && after && before !== after) {
    return (
      <span
        className={cn(
          "inline-flex min-w-0 flex-wrap items-center gap-1.5",
          textSize,
          className,
        )}
      >
        <ChangeValueBefore value={before} size={size} />
        <ArrowRight className="size-3 shrink-0 text-slate-400" aria-hidden />
        <ChangeValueAfter value={after} size={size} />
      </span>
    );
  }

  if (after) {
    return <ChangeValueAfter value={after} className={className} size={size} />;
  }

  if (before) {
    return <ChangeValueBefore value={before} className={className} size={size} />;
  }

  return null;
}
