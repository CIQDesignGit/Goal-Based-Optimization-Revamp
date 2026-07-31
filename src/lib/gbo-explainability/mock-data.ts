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
        field: "Daily budget",
        overriddenActor: "Ally AI",
        timeSinceOverride: "2h 10m later",
        otherChange: {
          actorType: "Ally AI",
          before: "$500",
          after: "$700",
          change: "$500 → $700",
          timestamp: "Today, 6:15 AM",
          summary:
            "Scheduled run raised budget to close a pacing gap vs monthly plan.",
        },
        inEffectNow: {
          actorType: "Manual",
          actorName: "Priyal Jain",
          before: "$700",
          after: "$500",
          change: "$700 → $500",
          timestamp: "Today, 8:25 AM",
          summary:
            "Reverted Ally AI's raise — manually restored the prior $500/day budget.",
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
    conflictCount: 2,
    conflictDetails: [
      {
        entityName: "SP Auto - Protein Bars",
        field: "Bid",
        overriddenActor: "Rule Based",
        timeSinceOverride: "45m later",
        otherChange: {
          actorType: "Rule Based",
          before: "$0.45",
          after: "$0.38",
          change: "$0.45 → $0.38",
          timestamp: "Today, 10:42 AM",
          summary: "Rule lowered bid after ACOS spike on the keyword set.",
        },
        inEffectNow: {
          actorType: "Ally AI",
          before: "$0.38",
          after: "$0.30",
          change: "$0.38 → $0.30",
          timestamp: "Today, 11:27 AM",
          summary: "Ally AI batch run superseded the rule-based bid change.",
        },
      },
      {
        entityName: "SB Video - Fresh Pack",
        field: "Bid",
        overriddenActor: "Ally AI",
        timeSinceOverride: "1h 15m later",
        otherChange: {
          actorType: "Ally AI",
          before: "$1.10",
          after: "$1.25",
          change: "$1.10 → $1.25",
          timestamp: "Today, 10:12 AM",
          summary: "Raised bid to recover impression share on video placements.",
        },
        inEffectNow: {
          actorType: "Manual",
          actorName: "Marcus Webb",
          before: "$1.25",
          after: "$1.15",
          change: "$1.25 → $1.15",
          timestamp: "Today, 11:27 AM",
          summary: "Marcus trimmed the bid during portfolio review.",
        },
      },
    ],
    canRetry: true,
    children: [
      {
        id: "auto-ally-002-f1",
        label: "Bid update failed — campaign min bid",
        entityName: "SP Auto - Protein Bars",
        entityId: "camp-sp-auto-pb",
        scopeLevel: "Campaign",
        campaignName: "SP Auto - Protein Bars",
        campaignType: "Sponsored Products",
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
        campaignName: "SB Video - Fresh Pack",
        campaignType: "Sponsored Brands",
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
    campaignName: "SP Manual - Wings",
    campaignType: "Sponsored Products",
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

  // --- Automation: out of budget (daily job — attributed to Ally AI, not a System actor) ---
  {
    id: "auto-oob-001",
    tab: "automation",
    timestamp: daysAgo(1, 6),
    actor: {
      kind: "ally-ai",
      label: "Ally AI",
      triggerOrRule: "Out-of-budget scan",
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
    campaignName: "SP Auto - Breakfast",
    campaignType: "Sponsored Products",
  },

  // --- Day Parting: today (most recent day — all four actor types represented) ---
  {
    id: "auto-dp-today",
    tab: "automation",
    timestamp: hoursAgo(3),
    actor: {
      kind: "day-parting",
      label: "Day Parting",
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
    campaignName: "SP Auto - Wings",
    campaignType: "Sponsored Products",
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

  // --- Rule Based: today (most recent day — all four actor types represented) ---
  {
    id: "auto-rb-today",
    tab: "automation",
    timestamp: hoursAgo(4),
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
    entityId: "kw-organic-trail-today",
    scopeLevel: "Keyword",
    diffs: [
      {
        field: "Status",
        before: "Enabled",
        after: "Paused",
        changeStatus: "updated",
      },
    ],
  },

  // --- Automation: Rule Based (previous day) ---
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

  // --- Day Parting: previous day (Ally-triggered re-optimize) ---
  {
    id: "auto-dp-001",
    tab: "automation",
    timestamp: daysAgo(2, 9),
    actor: {
      kind: "day-parting",
      label: "Day Parting",
      triggerOrRule: "Day-parting re-optimize",
    },
    status: "success",
    actionType: "day-parting-change",
    automationType: "day-parting",
    claim: "Extended evening bid window for SP Manual - Deli",
    reason: "Ally AI re-optimize — late-day conversion lift",
    impact: "More spend in 6pm–10pm window",
    summarySource: "template",
    entityName: "SP Manual - Deli",
    entityId: "camp-sp-manual-deli",
    scopeLevel: "Campaign",
    campaignName: "SP Manual - Deli",
    campaignType: "Sponsored Products",
    dayParting: {
      before: {
        label: "Peak 8am–6pm",
        hours: hoursFromWindows([{ start: 8, end: 18, mult: 1.2 }]),
      },
      after: {
        label: "Peak 8am–10pm",
        hours: hoursFromWindows([{ start: 8, end: 22, mult: 1.2 }]),
      },
    },
  },

  // --- Setup: Emily's Save & Launch today (3 changes in one session) ---
  {
    id: "setup-sess-001",
    tab: "setup",
    timestamp: daysAgo(0, 14),
    actor: {
      kind: "human",
      label: "Emily Carter",
      email: "emily.c@commerceiq.ai",
    },
    status: "success",
    actionType: "setup-change",
    claim: "3 setup changes — Updated",
    reason: "Save & Launch session",
    impact: "Budget, goal, and optimizer settings updated for JBC Fresh",
    summarySource: "human",
    entityName: "JBC Fresh",
    entityId: "brand-jbc-fresh",
    scopeLevel: "Brand",
    isSessionGroup: true,
    sessionSummary: "3 setup changes — Updated",
    changeStatus: "updated",
    setupStep: "Goals & Budgets",
    conflictCount: 1,
    conflictDetails: [
      {
        entityName: "JBC Fresh",
        field: "Monthly budget",
        overriddenActor: "Ally AI",
        timeSinceOverride: "3h 25m later",
        otherChange: {
          actorType: "Ally AI",
          before: "$21.0k",
          after: "$22.5k",
          change: "$21.0k → $22.5k",
          timestamp: "Jul 6, 6:15 AM",
          summary:
            "Raised budget because the brand was underpacing 19% against its monthly target.",
        },
        inEffectNow: {
          actorType: "Manual",
          actorName: "Emily Carter",
          before: "$22.5k",
          after: "$24.0k",
          change: "$22.5k → $24.0k",
          timestamp: "Jul 6, 9:40 AM",
          summary:
            "Set a higher monthly budget in setup — overrides Ally AI's pacing raise.",
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
          to: "$24.0k",
          category: "budget",
          timestamp: 1,
        },
        {
          id: "setup-sess-001-b",
          step: "goals-budgets",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "aggressiveness",
          fieldLabel: "Aggressiveness",
          from: "Moderate",
          to: "Aggressive",
          category: "goal",
          timestamp: 2,
        },
        {
          id: "setup-sess-001-c",
          step: "optimizer",
          scopeId: "jbc-fresh",
          scopeName: "JBC Fresh",
          field: "bidOptimization",
          fieldLabel: "Bid optimization",
          from: "None",
          to: "Ally AI",
          category: "optimizer",
          timestamp: 3,
        },
      ],
    },
    children: [
      {
        id: "setup-sess-001-a",
        label: "Monthly budget",
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
        label: "Aggressiveness",
        changeStatus: "updated",
        entityName: "JBC Fresh",
        entityId: "brand-jbc-fresh",
        scopeLevel: "Brand",
        diffs: [
          {
            field: "Aggressiveness",
            before: "Moderate",
            after: "Aggressive",
            changeStatus: "updated",
          },
        ],
      },
      {
        id: "setup-sess-001-c",
        label: "Bid optimization",
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
    ],
  },

  // --- Setup: Marcus's manual change today ---
  {
    id: "setup-manual-002",
    tab: "setup",
    timestamp: daysAgo(0, 11),
    actor: {
      kind: "human",
      label: "Marcus Webb",
      email: "marcus.w@commerceiq.ai",
    },
    status: "success",
    actionType: "setup-change",
    claim: "Updated seasonality window for JBC Deli",
    reason: "Save & Launch session",
    impact: "Holiday uplift extended through Cyber Monday",
    summarySource: "human",
    entityName: "JBC Deli",
    entityId: "brand-jbc-deli",
    scopeLevel: "Brand",
    changeStatus: "updated",
    setupStep: "Seasonality",
    diffs: [
      {
        field: "Seasonality event",
        before: "Thanksgiving surge (Nov 20–24, +15%)",
        after: "Thanksgiving surge (Nov 20–28, +15%)",
        changeStatus: "updated",
      },
    ],
  },

  // --- Setup: Priyal's manual change today ---
  {
    id: "setup-manual-003",
    tab: "setup",
    timestamp: daysAgo(0, 9),
    actor: {
      kind: "human",
      label: "Priyal Jain",
      email: "priyal.j@commerceiq.ai",
    },
    status: "success",
    actionType: "setup-change",
    claim: "Raised bid floor for SP Manual - Breakfast",
    reason: "Save & Launch session",
    impact: "Minimum bid increased to protect margin on breakfast campaigns",
    summarySource: "human",
    entityName: "SP Manual - Breakfast",
    entityId: "camp-sp-manual-bf",
    scopeLevel: "Campaign",
    changeStatus: "updated",
    setupStep: "Constraints",
    diffs: [
      {
        field: "Bid floor",
        before: "$0.45",
        after: "$0.55",
        changeStatus: "updated",
      },
    ],
  },

  // --- Day Parting: manual schedule edit (previous day) ---
  {
    id: "setup-dp-001",
    tab: "setup",
    timestamp: daysAgo(2, 16),
    actor: {
      kind: "day-parting",
      label: "Day Parting",
      triggerOrRule: "Manual schedule edit",
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
    campaignName: "SP Manual - Breakfast",
    campaignType: "Sponsored Products",
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
      label: "Marcus Webb",
      email: "marcus.w@commerceiq.ai",
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
      label: "Jordan Lee",
      email: "jordan.l@commerceiq.ai",
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
    batch: { total: 3, succeeded: 3, failed: 0 },
  },
];
