import type {
  AccountOptimizerConfig,
  LogEntry,
} from "./types";

/** Demo account: Ally AI + Rule Based (full tab set). */
export const MOCK_ACCOUNT_CONFIG: AccountOptimizerConfig = {
  hasAllyAi: true,
  hasRuleBased: true,
};

export const MOCK_ACCOUNT_META = {
  accountName: "pilgrims",
  retailer: "Amazon",
  region: "US",
  onboardingDate: "2025-11-01",
};

/** Hours array helper — 1 = active bid multiplier slot */
function hoursFromWindows(
  windows: { start: number; end: number; mult: number }[],
): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const w of windows) {
    for (let h = w.start; h < w.end; h++) {
      hours[h % 24] = w.mult;
    }
  }
  return hours;
}

function hoursAgo(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

function daysAgo(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 14, 0, 0);
  return d.toISOString();
}

export const INITIAL_MOCK_ENTRIES: LogEntry[] = [
  // --- Automation: Ally AI success with AI summary ---
  {
    id: "auto-ally-001",
    tab: "automation",
    timestamp: hoursAgo(2),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Scheduled run",
    },
    status: "success",
    actionType: "budget-change",
    automationType: "ally-ai",
    claim:
      "Raised JBC Fresh budget +40% — projected spend +$2k/mo",
    reason: "Scheduled run — level under-pacing vs plan",
    impact: "Projected spend +$2,000/mo; pacing toward 100%",
    summarySource: "ai",
    entityName: "JBC Fresh",
    entityId: "brand-jbc-fresh",
    scopeLevel: "Brand",
    conflictCount: 1,
    conflictDetails: [
      {
        entityName: "JBC Fresh",
        overriddenActor: "Ally AI",
        timeSinceOverride: "2h 10m later",
        otherChange: {
          actorType: "Ally AI",
          change: "$500 → $700 daily budget",
          timestamp: "Today, 6:15 AM",
          summary:
            "Scheduled run raised budget to close a pacing gap vs monthly plan.",
        },
        inEffectNow: {
          actorType: "Manual",
          actorName: "Priyal Jain",
          change: "$700/day held",
          timestamp: "Today, 8:25 AM",
          summary:
            "Manual setup temporarily held the budget before this session's changes.",
        },
      },
    ],
    diffs: [
      {
        field: "Daily budget",
        before: "$500",
        after: "$700",
        changeStatus: "updated",
      },
    ],
  },

  // --- Automation: Ally AI partial batch (retryable) ---
  {
    id: "auto-ally-002",
    tab: "automation",
    timestamp: hoursAgo(5),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Goal pacing",
    },
    status: "partial",
    actionType: "bid-change",
    automationType: "ally-ai",
    claim: "Applied bid changes across 419 campaigns — 7 failed",
    reason: "Goal pacing — Brand iROAS below target",
    impact: "412 campaigns updated; 7 blocked by retailer rules",
    summarySource: "ai",
    entityName: "pilgrims portfolio",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    batch: { total: 419, succeeded: 412, failed: 7 },
    conflictCount: 3,
    canRetry: true,
    children: [
      {
        id: "auto-ally-002-f1",
        label: "Bid update failed — campaign min bid",
        entityName: "SP Auto - Protein Bars",
        entityId: "camp-sp-auto-pb",
        scopeLevel: "Campaign",
        diffs: [
          {
            field: "Bid",
            before: "$0.45",
            after: "$0.30",
            changeStatus: "updated",
          },
        ],
        failure: {
          category: "business-rule",
          code: "BID_BELOW_MIN",
          message: "Bid can't be less than the retailer minimum ($0.35).",
        },
      },
      {
        id: "auto-ally-002-f2",
        label: "Bid update failed — rate limit",
        entityName: "SB Video - Fresh Pack",
        entityId: "camp-sb-video-fp",
        scopeLevel: "Campaign",
        diffs: [
          {
            field: "Bid",
            before: "$1.10",
            after: "$1.25",
            changeStatus: "updated",
          },
        ],
        failure: {
          category: "transient",
          code: "RATE_LIMIT",
          message: "Retailer rate limiting — try again after cooldown.",
        },
      },
    ],
  },

  // --- Automation: Ally AI failure (deterministic — retry blocked) ---
  {
    id: "auto-ally-003",
    tab: "automation",
    timestamp: hoursAgo(8),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Guardrail",
    },
    status: "failure",
    actionType: "bid-change",
    automationType: "ally-ai",
    claim: "Could not lower bid on SP Manual - Wings",
    reason: "Guardrail — bid below account minimum",
    impact: null,
    summarySource: "template",
    entityName: "SP Manual - Wings",
    entityId: "camp-sp-manual-wings",
    scopeLevel: "Campaign",
    conflictCount: 1,
    canRetry: false,
    retryBlockedReason:
      "Bid can't be less than the retailer minimum — fix the recommendation first.",
    failure: {
      category: "business-rule",
      code: "BID_BELOW_MIN",
      message: "Bid can't be less than the retailer minimum ($0.35).",
    },
    diffs: [
      {
        field: "Bid",
        before: "$0.40",
        after: "$0.28",
        changeStatus: "updated",
      },
    ],
  },

  // --- Automation: out of budget (daily job) ---
  {
    id: "auto-oob-001",
    tab: "automation",
    timestamp: daysAgo(1, 6),
    actor: {
      kind: "system",
      label: "System",
    },
    status: "success",
    actionType: "out-of-budget",
    automationType: "out-of-budget",
    claim: "Campaign exhausted daily budget at 4:12 PM local",
    reason: "Once-a-day out-of-budget scan",
    impact: "No further spend until next day / budget top-up",
    summarySource: "template",
    entityName: "SP Auto - Breakfast",
    entityId: "camp-sp-auto-bf",
    scopeLevel: "Campaign",
  },

  // --- Automation: Rule Based ---
  {
    id: "auto-rb-001",
    tab: "automation",
    timestamp: daysAgo(1, 11),
    actor: {
      kind: "rule-based",
      label: "Rule Based",
      triggerOrRule: "Pause if ACOS > 45%",
    },
    status: "success",
    actionType: "status-change",
    automationType: "rule-based",
    claim: "Paused SP Keyword - organic trail mix (ACOS 52%)",
    reason: "Rule: Pause if ACOS > 45%",
    impact: "Stopped inefficient spend on this keyword",
    summarySource: "template",
    entityName: "organic trail mix",
    entityId: "kw-organic-trail",
    scopeLevel: "Keyword",
    conflictCount: 2,
    diffs: [
      {
        field: "Status",
        before: "Enabled",
        after: "Paused",
        changeStatus: "updated",
      },
    ],
  },

  // --- Automation: Ally AI day-parting ---
  {
    id: "auto-dp-001",
    tab: "automation",
    timestamp: daysAgo(2, 9),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Day-parting re-optimize",
    },
    status: "success",
    actionType: "day-parting-change",
    automationType: "day-parting",
    claim: "Shifted day-parting window two hours later for SP Auto - Wings",
    reason: "Performance dip in early morning CPC",
    impact: "Concentrate bids on 10am–8pm high-conversion hours",
    summarySource: "ai",
    entityName: "SP Auto - Wings",
    entityId: "camp-sp-auto-wings",
    scopeLevel: "Campaign",
    dayParting: {
      before: {
        label: "Peak 8am–6pm",
        hours: hoursFromWindows([{ start: 8, end: 18, mult: 1.2 }]),
      },
      after: {
        label: "Peak 10am–8pm",
        hours: hoursFromWindows([{ start: 10, end: 20, mult: 1.2 }]),
      },
    },
  },

  // --- Setup: session group (3 changes) ---
  {
    id: "setup-sess-001",
    tab: "setup",
    timestamp: daysAgo(0, 14),
    actor: {
      kind: "human",
      label: "Priyal Jain",
      email: "priyal.j@commerceiq.ai",
    },
    status: "success",
    actionType: "setup-change",
    claim: "3 setup changes — Updated",
    reason: "Save & Launch session",
    impact: "Budgets, goal, and spend constraint applied together",
    summarySource: "human",
    entityName: "pilgrims",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    isSessionGroup: true,
    sessionSummary: "3 setup changes — Updated",
    changeStatus: "updated",
    setupStep: "Goals & Budgets",
    conflictCount: 2,
    conflictDetails: [
      {
        entityName: "JBC Fresh",
        overriddenActor: "Ally AI",
        timeSinceOverride: "3h 25m later",
        otherChange: {
          actorType: "Ally AI",
          change: "$4,200 → $5,600",
          timestamp: "Jul 6, 6:15 AM",
          summary:
            "Raised budget because the brand was underpacing 19% against its monthly target.",
        },
        inEffectNow: {
          actorType: "Manual",
          actorName: "Priyal Jain",
          change: "$4,200/day",
          timestamp: "Jul 6, 9:40 AM",
          summary:
            "Reverted Ally AI's raise — pacing correction cancelled, gap widens to ~24% by month-end.",
        },
      },
      {
        entityName: "Sponsored Brands",
        overriddenActor: "Rule Based",
        timeSinceOverride: "1h 12m later",
        otherChange: {
          actorType: "Rule Based",
          change: "Spend share cap 12%",
          timestamp: "Jul 6, 8:28 AM",
          summary:
            "Capped SB spend share at 12% of portfolio spend per automation rule.",
        },
        inEffectNow: {
          actorType: "Manual",
          actorName: "Priyal Jain",
          change: "15% spend share",
          timestamp: "Jul 6, 9:40 AM",
          summary:
            "Set 15% SB share in setup — bypasses the rule cap by ~3pp.",
        },
      },
    ],
    setupSnapshot: {
      goalLabel: "Brand iROAS",
      aggressivenessLabel: "Moderate",
      changeLedger: [
        {
          id: "setup-sess-001-a",
          step: "goals-budgets",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "monthlyBudget",
          fieldLabel: "Monthly budget",
          from: "$21.0k",
          to: "$21.81k",
          category: "budget",
          timestamp: 1,
        },
        {
          id: "setup-sess-001-b",
          step: "goals-budgets",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "goalValue",
          fieldLabel: "BRAND_IROAS",
          from: "24",
          to: "25",
          category: "goal",
          timestamp: 2,
        },
        {
          id: "setup-sess-001-c",
          step: "constraints",
          scopeId: "jbc-deli",
          scopeName: "JBC Deli",
          field: "campaignSb",
          fieldLabel: "Spend share",
          from: "",
          to: "15%",
          category: "constraint",
          timestamp: 3,
        },
      ],
    },
    children: [
      {
        id: "setup-sess-001-a",
        label: "Budget",
        changeStatus: "updated",
        entityName: "JBC Fresh",
        entityId: "brand-jbc-fresh",
        scopeLevel: "Brand",
        diffs: [
          {
            field: "Monthly budget",
            before: "$21.0k",
            after: "$24.0k",
            changeStatus: "updated",
          },
        ],
      },
      {
        id: "setup-sess-001-b",
        label: "Goal value",
        changeStatus: "updated",
        entityName: "JBC Fresh",
        entityId: "brand-jbc-fresh",
        scopeLevel: "Brand",
        diffs: [
          {
            field: "BRAND_IROAS",
            before: "24",
            after: "25",
            changeStatus: "updated",
          },
        ],
      },
      {
        id: "setup-sess-001-c",
        label: "Spend constraint",
        changeStatus: "created",
        entityName: "Sponsored Brands",
        entityId: "ctype-sb",
        scopeLevel: "Campaign type",
        diffs: [
          {
            field: "Spend share",
            before: null,
            after: "15%",
            changeStatus: "created",
          },
        ],
      },
    ],
  },

  // --- Setup: day-parting config by human ---
  {
    id: "setup-dp-001",
    tab: "setup",
    timestamp: daysAgo(2, 16),
    actor: {
      kind: "human",
      label: "Alex Rivera",
      email: "alex.r@example.com",
    },
    status: "success",
    actionType: "day-parting-change",
    claim: "Updated day-parting schedule for SP Manual - Breakfast",
    reason: "Intent: align with store traffic peaks",
    impact: "Bids concentrated on lunch and evening windows",
    summarySource: "human",
    entityName: "SP Manual - Breakfast",
    entityId: "camp-sp-manual-bf",
    scopeLevel: "Campaign",
    changeStatus: "updated",
    setupStep: "Optimizer",
    dayParting: {
      before: {
        label: "Flat all day",
        hours: Array.from({ length: 24 }, () => 1),
      },
      after: {
        label: "Lunch + evening",
        hours: hoursFromWindows([
          { start: 11, end: 14, mult: 1.3 },
          { start: 17, end: 21, mult: 1.4 },
        ]),
      },
    },
  },

  // --- Setup: failure (retryable) ---
  {
    id: "setup-fail-001",
    tab: "setup",
    timestamp: daysAgo(3, 10),
    actor: {
      kind: "human",
      label: "Priyal Jain",
      email: "priyal.j@commerceiq.ai",
    },
    status: "failure",
    actionType: "api-failure",
    claim: "Setup failed — update (retailer rejected push)",
    reason: "Retailer-side error while saving seasonality",
    impact: null,
    summarySource: "template",
    entityName: "pilgrims",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    changeStatus: "updated",
    setupStep: "Seasonality",
    canRetry: true,
    failure: {
      category: "retailer-api",
      code: "SETUP_FAILED_UPDATE",
      message:
        "Retailer rejected the setup update. Your draft is preserved — retry when the retailer is healthy.",
    },
  },

  // --- Setup: deactivated user (actor frozen at action time) ---
  {
    id: "setup-old-001",
    tab: "setup",
    timestamp: daysAgo(5, 15),
    actor: {
      kind: "human",
      label: "Sam Chen",
      email: "sam.c@example.com",
      deactivated: true,
    },
    status: "success",
    actionType: "setup-change",
    claim: "Deleted seasonality event — Black Friday surge",
    reason: "Event no longer needed after holiday",
    impact: "Seasonality uplift removed for Nov window",
    summarySource: "human",
    entityName: "Black Friday surge",
    entityId: "season-bf-2025",
    scopeLevel: "Brand",
    changeStatus: "deleted",
    setupStep: "Seasonality",
    diffs: [
      {
        field: "Seasonality event",
        before: "Black Friday surge (Nov 24–27, +20%)",
        after: null,
        changeStatus: "deleted",
      },
    ],
  },

  // --- Automation: templated Ally summary (LLM fallback look) ---
  {
    id: "auto-ally-004",
    tab: "automation",
    timestamp: daysAgo(4, 8),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Scheduled run",
    },
    status: "success",
    actionType: "budget-change",
    automationType: "ally-ai",
    claim: "Budget updated on 12 campaigns (scheduled run)",
    reason: "Scheduled run",
    impact: "Impact pending",
    summarySource: "template",
    entityName: "pilgrims portfolio",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    batch: { total: 12, succeeded: 12, failed: 0 },
  },

  // --- Setup: second session on a different day (5 changes) ---
  {
    id: "setup-sess-002",
    tab: "setup",
    timestamp: daysAgo(1, 15),
    actor: {
      kind: "human",
      label: "Alex Rivera",
      email: "alex.r@example.com",
    },
    status: "success",
    actionType: "setup-change",
    claim: "5 setup changes — Updated",
    reason: "Save & Launch session",
    impact: "Optimizer modes and constraints updated across brands",
    summarySource: "human",
    entityName: "pilgrims",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    isSessionGroup: true,
    sessionSummary: "5 setup changes — Updated",
    changeStatus: "updated",
    setupStep: "Optimizer",
    conflictCount: 1,
    setupSnapshot: {
      goalLabel: "Brand iROAS",
      aggressivenessLabel: "Aggressive",
      taxonomyBaseline: {
        budgetType: "retailer",
        level1: "portfolio",
        level2: "profiles",
      },
      taxonomyCurrent: {
        budgetType: "internal",
        level1: "brand",
        level2: "campaign-type",
      },
      changeLedger: [
        {
          id: "setup-sess-002-a",
          step: "optimizer",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "bidOptimization",
          fieldLabel: "Bid optimization",
          from: "None",
          to: "Ally AI",
          category: "optimizer",
          timestamp: 1,
        },
        {
          id: "setup-sess-002-b",
          step: "optimizer",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "budgetOptimization",
          fieldLabel: "Budget optimization",
          from: "Rule Based",
          to: "Ally AI",
          category: "optimizer",
          timestamp: 2,
        },
        {
          id: "setup-sess-002-c",
          step: "constraints",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "bidFloor",
          fieldLabel: "Floor bid",
          from: "",
          to: "$0.35",
          category: "constraint",
          timestamp: 3,
        },
        {
          id: "setup-sess-002-d",
          step: "constraints",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "bidCeiling",
          fieldLabel: "Ceiling bid",
          from: "$2.00",
          to: "$2.50",
          category: "constraint",
          timestamp: 4,
        },
        {
          id: "setup-sess-002-e",
          step: "goals-budgets",
          scopeId: "pilgrims",
          scopeName: "pilgrims",
          field: "aggressiveness",
          fieldLabel: "Aggressiveness",
          from: "Moderate",
          to: "Aggressive",
          category: "goal",
          timestamp: 5,
        },
      ],
    },
    children: [
      {
        id: "setup-sess-002-a",
        label: "Bid optimization mode",
        changeStatus: "updated",
        entityName: "JBC Fresh",
        entityId: "brand-jbc-fresh",
        scopeLevel: "Brand",
        diffs: [
          {
            field: "Bid optimization",
            before: "None",
            after: "Ally AI",
            changeStatus: "updated",
          },
        ],
      },
      {
        id: "setup-sess-002-b",
        label: "Budget optimization mode",
        changeStatus: "updated",
        entityName: "JBC Fresh",
        entityId: "brand-jbc-fresh",
        scopeLevel: "Brand",
        diffs: [
          {
            field: "Budget optimization",
            before: "Rule Based",
            after: "Ally AI",
            changeStatus: "updated",
          },
        ],
      },
      {
        id: "setup-sess-002-c",
        label: "Floor constraint",
        changeStatus: "created",
        entityName: "Sponsored Products",
        entityId: "ctype-sp",
        scopeLevel: "Campaign type",
        diffs: [
          {
            field: "Floor bid",
            before: null,
            after: "$0.35",
            changeStatus: "created",
          },
        ],
      },
      {
        id: "setup-sess-002-d",
        label: "Ceiling constraint",
        changeStatus: "updated",
        entityName: "Sponsored Products",
        entityId: "ctype-sp",
        scopeLevel: "Campaign type",
        diffs: [
          {
            field: "Ceiling bid",
            before: "$2.00",
            after: "$2.50",
            changeStatus: "updated",
          },
        ],
      },
      {
        id: "setup-sess-002-e",
        label: "Goal aggressiveness",
        changeStatus: "updated",
        entityName: "pilgrims",
        entityId: "portfolio-pilgrims",
        scopeLevel: "Portfolio",
        diffs: [
          {
            field: "Aggressiveness",
            before: "Moderate",
            after: "Aggressive",
            changeStatus: "updated",
          },
        ],
      },
    ],
  },

  // --- Automation: custom optimizer actions ---
  {
    id: "auto-custom-001",
    tab: "automation",
    timestamp: daysAgo(0, 10),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Custom portfolio rule",
    },
    status: "success",
    actionType: "bid-change",
    automationType: "custom",
    claim: "Applied custom bid strategy on 8 campaigns",
    reason: "Custom portfolio rule — mixed optimizer allocation",
    impact: "Rebalanced bids across Ally AI and rule-based rows",
    summarySource: "template",
    entityName: "pilgrims portfolio",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    conflictCount: 2,
    batch: { total: 8, succeeded: 8, failed: 0 },
  },

  // --- Automation: Ally AI on same day as other entries (today) ---
  {
    id: "auto-ally-005",
    tab: "automation",
    timestamp: daysAgo(0, 8),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Goal pacing",
    },
    status: "success",
    actionType: "status-change",
    automationType: "ally-ai",
    claim: "Re-enabled 3 paused campaigns after budget top-up",
    reason: "Goal pacing — budget restored",
    impact: "Campaigns active again; spend resumes toward plan",
    summarySource: "ai",
    entityName: "pilgrims portfolio",
    entityId: "portfolio-pilgrims",
    scopeLevel: "Portfolio",
    conflictCount: 1,
    batch: { total: 3, succeeded: 3, failed: 0 },
  },
];
