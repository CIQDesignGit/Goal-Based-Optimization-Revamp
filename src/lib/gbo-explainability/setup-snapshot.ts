import { PORTFOLIO_CHANGE_SCOPE_ID } from "@/lib/gbo-optimization/setup-session-store";
import type {
  ChangeLedgerEntry,
  SetupChangeCategory,
  SetupChangeStep,
} from "@/lib/gbo-optimization/setup-session-store";
import type { LogActionDetail, LogEntry, SetupSessionSnapshot } from "./types";

function mapSetupStep(setupStep?: string): SetupChangeStep {
  switch (setupStep) {
    case "Goals & Budgets":
      return "goals-budgets";
    case "Constraints":
      return "constraints";
    case "Seasonality":
      return "seasonality";
    case "Optimizer":
      return "optimizer";
    case "General":
      return "general";
    default:
      return "goals-budgets";
  }
}

function inferCategory(
  child: LogActionDetail,
  step: SetupChangeStep,
): SetupChangeCategory {
  const label = `${child.label} ${child.diffs[0]?.field ?? ""}`.toLowerCase();

  if (label.includes("budget")) return "budget";
  if (label.includes("goal") || label.includes("iroas") || label.includes("roas")) {
    return "goal";
  }
  if (label.includes("seasonality")) return "seasonality";
  if (
    label.includes("constraint") ||
    label.includes("floor") ||
    label.includes("ceiling") ||
    label.includes("spend")
  ) {
    return "constraint";
  }
  if (step === "optimizer") return "optimizer";
  if (step === "general") return "general";
  return "budget";
}

function childToLedgerEntry(
  child: LogActionDetail,
  entry: LogEntry,
  index: number,
): ChangeLedgerEntry {
  const step = mapSetupStep(entry.setupStep);
  const primaryDiff = child.diffs[0];

  return {
    id: child.id || `${entry.id}-child-${index}`,
    step,
    scopeId: child.entityId || PORTFOLIO_CHANGE_SCOPE_ID,
    scopeName: child.entityName,
    field: primaryDiff?.field ?? child.label,
    fieldLabel: primaryDiff?.field ?? child.label,
    from: primaryDiff?.before ?? "",
    to: primaryDiff?.after ?? "",
    category: inferCategory(child, step),
    timestamp: new Date(entry.timestamp).getTime() + index,
  };
}

/** Prefer frozen snapshot; otherwise build a best-effort ledger from session children. */
export function resolveSetupSnapshot(entry: LogEntry): SetupSessionSnapshot | null {
  if (entry.setupSnapshot) {
    return entry.setupSnapshot;
  }

  if (!entry.isSessionGroup || !entry.children?.length) {
    return null;
  }

  return {
    changeLedger: entry.children.map((child, index) =>
      childToLedgerEntry(child, entry, index),
    ),
  };
}

export function hasSetupSummary(entry: LogEntry): boolean {
  return resolveSetupSnapshot(entry) !== null;
}
