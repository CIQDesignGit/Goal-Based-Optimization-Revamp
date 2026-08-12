# Goal Based Optimization (GBO) — Usability improvements

| Field | Value |
| ----- | ----- |
| **Product** | CommerceIQ Retail Media Management (RMM) |
| **Feature** | Goal Based Optimization (GBO) setup and optimization usability |
| **Version** | v1 |
| **Status** | Draft |

---

## Problem statement

Many users find GBO intimidating, so they avoid it. The ones who do use it find it complicated. The product doesn't warn them when a setting won't take effect — for example, that constraints don't apply to rule-based optimization. Users also don't realize that when they pick Ally AI they don't need to set up rules at all. The UI/UX and overall usability make the flow hard to learn.

This PRD covers the changes that make GBO easier to understand and use: clearer messaging and errors, a flow that adapts to the chosen optimizer, and a summary screen that shows every change and its impacted areas before anything commits. It does **not** re-architect the underlying optimization engine.

---

## Goals

- Make GBO user-friendly and easy to use, so more users adopt it.
- Show the optimizer choice (Ally AI vs rule-based) up front on the General page and adapt the rest of the flow to it.
- Make every setting show what it affects, so users understand the impact of each change before it commits.
- Prevent silent failures — e.g. campaigns stopping for a missing budget, settings that don't apply to the chosen optimizer, or drafts lost to a reset button.
- Move more campaigns onto Ally AI.
- Reduce engineering-assisted reverts by ending the flow with a summary-and-approve step.

---

## Users

| Role | Description |
| ---- | ----------- |
| **Primary consumer** | CommerceIQ managed-services teams, who run GBO for customers on roughly 70% of accounts, plus customer admins who self-serve on the remaining 30%. |
| **End beneficiary** | Brand managers who use GBO to hit retail-media goals and spend their budget across their brand and campaign portfolio. |

---

## Key concepts

| Term | Definition |
| ---- | ---------- |
| **Goal Based Optimization (GBO)** | The flow where a user sets an optimization goal, an optional target value, and an aggressiveness level, then configures budget, constraints, and seasonality per brand. |
| **General page** | The renamed first step of the flow (previously Goals setup), where the user sets the goal, aggressiveness, and the optimizer. |
| **Ally AI** | The optimizer that allocates spend and manages constraints on its own. It's the recommended mode and the one that earns commission revenue. |
| **Rule-based optimization** | The manual mode where the user defines explicit strategies and rules. For a rule-based **item** (brand / scope row), budget entry and seasonality do not apply; constraints are limited to floor/ceiling when that toggle is on. |
| **Optimizer** | The step where users configure strategies, and can set Ally AI vs rule-based per item (and at portfolio level on General). |
| **Item-level optimizer mode** | Ally / rule-based (or None) on a single brand or scope row — e.g. Budget Optimization or Bid Optimization chips on the Optimizer step. Changing one item does **not** rebuild the portfolio wizard. |
| **ROAS** | Return on ad spend — the goal metric. Available as brand ROAS, incremental ROAS, or total ROAS. |
| **SOV** | Share of voice — a goal type that applies only to rule-based optimization and **not** to Ally AI. |
| **Constraints** | Spend limits and rules applied to optimization. They apply only when Ally AI is selected (except floor/ceiling in rule-based). |
| **Seasonality** | Time-bound events (e.g. Black Friday, holidays) that adjust optimization. They apply only when Ally AI is selected. |
| **Budget pacing / utilization** | How much of the planned budget is actually spent. The team aims for close to 100% because commission is earned on spend. |

---

## Flow sequences (optimizer-driven)

### Portfolio wizard (shell)

The stepper is the portfolio shell. Optional steps (Seasonality, Constraints) still follow portfolio toggles. The **Optimizer** step is always present (no toggle) and sits after Constraints when included, always immediately before Summary.

### Ally AI (item applies full path)

For items on Ally AI, the relevant path includes budgets and (when enabled) seasonality / full constraints:

`General` → `Goals & Budgets` → `Seasonality` (optional) → `Constraints` (optional) → `Optimizer` → `Summary`

### Rule-based (item skips incompatible steps)

When an **item** is switched to rule-based, the portfolio wizard / stepper does **not** rebuild. Only that item skips steps that do not apply:

- **Skipped for that item:** budget entry, seasonality
- **Effective path for that item:** `Goals` → `Optimizer` → `Summary`
- **Constraints for that item:** only when the floor/ceiling toggle is on; otherwise Constraints is skipped for that item too

> **Clarify in UI when mode flips Ally → rule-based on an item:** rule-based excludes budget entry and seasonality; flow for that item is Goals → Optimizer → Summary, with Constraints only when the floor/ceiling toggle is on.
>
> People can select Ally AI / rule-based at the **item (brand) level** as well as portfolio level.

---

## Functional requirements

### General

| ID | Requirement |
| -- | ----------- |
| **FR-001** | The General page **MUST** present goal selection (goal type and an aggressiveness level of aggressive, moderate, or conservative) as the first step before budget, constraints, and seasonality. |
| **FR-002** | The General page **MUST** present the optimizer choice (Ally AI vs rule-based) as a selection that applies uniformly across all brands in the portfolio. People should also be able to select Ally / rule-based at the brand level. |
| **FR-003** | At the overall (portfolio) level, the flow **MUST** recommend Ally AI (noting it also handles spend and constraints) and, when a user selects rule-based, **MUST** prompt whether they want to switch to Ally AI for everything. |
| **FR-004** | SOV is not supported by Ally AI. If a user switches to Ally AI while portfolio- or item-level SOV goals exist, the system **MUST** allow the switch, clear every incompatible SOV goal, visually mark the affected goals as changed, and explain that compatible goals must be selected before budget editing can continue. |
| **FR-005** | The flow sequence **MUST** follow the selected optimizer per item (see [Flow sequences](#flow-sequences-optimizer-driven) above). Changing an item to rule-based **MUST NOT** rebuild the portfolio stepper; it **MUST** skip budget and seasonality for that item only, and include Constraints for that item only when the floor/ceiling toggle is on. |
| **FR-006** | When a user changes the goal, the system **MUST** display an impact message stating that the change will recalibrate existing strategies (rule-based) and indicate where it applies. |

### Goals & Budgets

| ID | Requirement |
| -- | ----------- |
| **FR-007** | The Goals & Budgets page **MUST** require a goal to be selected before budget can be entered, and **MUST** show a message at the top of the page stating that a goal must be selected before entering budget. |
| **FR-008** | The Goals & Budgets page **MUST** allow the goal target value to be optional; a user can proceed without specifying a target value. **Only in the case of Ally AI.** |
| **FR-009** | The budget table **MUST** default to showing approximately three months and hide the remaining months, with an expand/collapse control to reveal additional months for comparison. |
| **FR-010** | When the next month's budget is not yet entered, the system **MUST** prevent a silent stoppage by nudging the user before month-end (e.g. around the 20th–25th) in-product and outside the product. |
| **FR-011** | The system **MUST** be able to present an agent-suggested next-month budget predicted from the previous month's spend, which the user can apply with a single Accept action. |
| **FR-012** | The system **MUST** provide a calendar-style visualization of daily budget across the month so users can see how budget is spent day by day. Reference: [Loom — budget pacing visualization](https://www.loom.com/share/56b8d557a6a44646aef0e81042b445b5) |
| **FR-013** | When a budget or goal cell value is changed, the Goals & Budgets page **MUST** highlight the changed cell and, on hover, show the prior and new values (“changed from X to Y”). |

#### FR-009 edge cases

- If beginning of the year, show only available months.
- If tenure selected is quarterly, half-yearly, or yearly — adjust visible months accordingly.

### Constraints

| ID | Requirement |
| -- | ----------- |
| **FR-014** | The flow **MUST** present constraints as a switch on the Goals & Budgets screen with expand/collapse, consistent with seasonality, rather than as a separate page. |
| **FR-015** | Constraints and seasonality settings **MUST NOT** be applied when rule-based optimization is selected; they apply only under Ally AI. **Exception:** floor and ceiling. |
| **FR-016** | When a user adds a constraint or seasonality event mid-month, the system **MUST** warn that the remaining budget will be redistributed across fewer days and recommend adding such settings at the start of the month. |

### Seasonality

| ID | Requirement |
| -- | ----------- |
| **FR-017** | The seasonality screen **MUST** present the add-event section as the primary action above the analytics chart, which **MUST** be moved below it. |
| **FR-018** | The flow **MUST** add a micro-interaction or visual cue so users can find the seasonality section, which is currently hard to locate. |
| **FR-019** | The seasonality screen **MUST** offer a list or calendar of known, customer-relevant events (e.g. Black Friday, holidays) for the upcoming month that the user can add directly. |

### Optimizer screen

| ID | Requirement |
| -- | ----------- |
| **FR-019a** | The flow **MUST** always include an Optimizer step after Constraints (when Constraints is in the flow) and immediately before Summary. The Optimizer step **MUST NOT** be gated behind a toggle for Ally AI or rule-based. |
| **FR-019b** | When a user changes an item from Ally AI to rule-based on the Optimizer screen, the system **MUST** make clear that **for that item only** budget entry and seasonality are excluded; the item path is Goals → Optimizer → Summary, with Constraints only when the floor/ceiling toggle is on. The portfolio wizard steps **MUST NOT** rebuild solely because of this item-level change. |
| **FR-020** | The optimizer screen **MUST** relabel the current refresh/reset control and show an explicit warning that all draft strategies will be lost before the reset proceeds. |
| **FR-022** | The optimizer screen **MUST** show a loading indicator while draft strategies are loading. |

### Summary

| ID | Requirement |
| -- | ----------- |
| **FR-023** | The flow **MUST** end with a summary screen listing all changes made in the session, and **MUST** require explicit user approval before any change commits. |
| **FR-024** | The summary screen **MUST** show the areas impacted by the pending changes (e.g. which strategies, budgets, or brands are affected), so the user can see downstream effects before approving. |
| **FR-025** | After the user saves and launches from the summary screen, the system **MUST** show a loading indicator while the changes are being applied. |

### All screens

| ID | Requirement |
| -- | ----------- |
| **FR-021** | When a cell value is changed, the screen **MUST** highlight the changed cell and, on hover, show the prior and new values (“changed from X to Y”). |

---

## Behaviour rules (quick reference)

- **Ally AI** is recommended at portfolio level; prompt to switch when user picks rule-based.
- **SOV + Ally AI** → allow the switch to Ally AI, clear every portfolio- and item-level SOV goal, highlight the affected goals, and require compatible replacements before budget editing.
- **Item-level Ally → rule-based** → do **not** rebuild the wizard; for **that item only**, skip budget entry and seasonality; path is Goals → Optimizer → Summary; Constraints only if floor/ceiling toggle is on. Make this clear in the UI at the point of change.
- **Constraints + seasonality** → Ally AI items only (floor/ceiling excepted for rule-based); portfolio toggles on Goals & Budgets still control optional steps in the shell.
- **Optimizer** → always in the flow (no toggle); after Constraints when present, always immediately before Summary.
- **Rule-based item** → no budget for that item; no seasonality for that item; constraints limited to floor/ceiling when enabled.
- **Goal target value** is optional only for Ally AI.
- **Never silently fail** — warn on incompatible settings, missing budgets, mid-month timing, and destructive resets.
- **Always end with Summary** — list changes, show impacted areas, require explicit approval before commit.

---

## Optimizer transition policy

The optimizer selected on General controls which settings and row-level
optimization modes are valid throughout the wizard:

- **Ally AI:** budgets, seasonality, and spend constraints can apply. Manual
  campaign constraints are hidden. Bid and Budget Optimization allow only
  Ally AI or None.
- **Rule-based:** budget entry, seasonality, and Ally spend constraints are
  inactive. Budget granularity is None. Floor and ceiling constraints remain
  available. Bid and Budget Optimization allow only Rule Based or None.
- **Custom:** mixed Ally AI, Rule Based, and None choices remain available per
  row. Existing compatible values remain unchanged.

### Transition behaviour

#### Custom → Ally AI

- Clear every portfolio- and item-level SOV goal.
- Change existing rule-based Bid and Budget Optimization values to None.
- Deactivate rule-based strategies.
- Hide manual campaign constraints.
- Keep compatible budgets, seasonality, and spend constraints.

#### Rule Based → Ally AI

- Clear every SOV goal.
- Change rule-based Bid and Budget Optimization values to None.
- Deactivate rule-based strategies.
- Restore previously preserved Ally AI budgets, seasonality, spend
  constraints, and budget granularity when available.
- Leave settings blank when no previous Ally AI draft exists.

#### Ally AI → Rule Based

- Make budgets temporarily inactive and set Budget Granularity to None.
- Remove Seasonality from the active wizard.
- Make Ally spend constraints temporarily inactive.
- Change Ally Bid and Budget Optimization values to None.

#### Custom → Rule Based

- Make budgets, seasonality, and spend constraints temporarily inactive.
- Change Ally row-level optimization modes to None.
- Keep compatible rule-based row modes and strategies.

#### Ally AI → Custom

- Keep current values unchanged.
- Add Rule Based back to the Bid and Budget Optimization menus.
- Restore a previously preserved Custom draft when available.

#### Rule Based → Custom

- Keep current rule-based values unchanged.
- Add Ally AI back to the Bid and Budget Optimization menus.
- Restore preserved Custom budgets, seasonality, spend constraints, and Ally
  row modes when available.

### Draft preservation and user communication

- Before changing optimizer, show a confirmation that lists the affected
  goals, budgets, seasonality events, constraints, row modes, and strategies.
- Incompatible values **MUST NOT** be silently deleted while the user explores
  optimizer modes. Preserve one draft per optimizer mode for the setup session.
- Describe hidden values as **temporarily inactive**, not lost or deleted.
- An incompatible row-level optimizer value becomes **None**. The system
  **MUST NOT** silently select a different optimizer for the user.
- Affected pages must explain what changed and that switching back before
  launch restores the preserved draft.
- Automatic clears, deactivations, and restorations must appear in Summary
  alongside manual changes.
- Permanently discard inactive drafts only after Save & Launch.

---

# GBO Explainability (Action Logs)

| Field | Value |
| ----- | ----- |
| **Product** | CommerceIQ Retail Media Management (RMM) |
| **Feature** | GBO Explainability — Action Logs (reimagine) & Dashboard |
| **Version** | v1 |
| **Status** | Draft |
| **Entry point (prototype)** | GBO home → "Explainability Dashboard" card → `/explainability-dashboard` |
| **Entry points (product)** | Update History panel; Action Logs nav item — both land on the same Action Logs page |

---

## Four actor types (canonical)

Every GBO Explainability event is attributed to **exactly one** of these four actors. There is no fifth “System” actor — batch or observational jobs roll up into the relevant type below.

| Actor | When it applies | Alerts tab | Action Log badge |
| ----- | ---------------- | ---------- | ---------------- |
| **Ally AI** | Optimizer runs, budget/bid automation, custom portfolio rules, out-of-budget scans | Shown when account has Ally AI | Purple “Ally AI” |
| **Manual** | A person saved setup (Save & Launch) or made a direct human edit | Always shown when GBO is live | Gray “Manual” (+ person name in detail) |
| **Day Parting** | Any day-parting schedule change — whether triggered manually, by Ally AI, or by a rule | Always shown | Amber “Day Parting” |
| **Rule Based** | Rule-triggered automation (pause, bid/budget rules, etc.) | Shown when account has Rule Based | Blue “Rule Based” |

**Grouping rules:**
- Alerts roll up to one card per `(calendar day, actor type)`.
- Day-parting rows always use the **Day Parting** actor, even when a person initiated the change in setup.
- Custom optimizer actions roll into **Ally AI** (`automationType === custom`).
- Out-of-budget detections attribute to **Ally AI** or **Rule Based** (whichever automation detected it), never a separate system actor.

---

## Problem statement

Customers and customer-facing teams can't tell why a change happened in Goal Based Optimization. There is no cumulative view of who did what across Ally AI, rule-based automations, and humans — and when a manual change overrides an Ally AI change, no one can see the impact. The result is confusion, mistaken changes, and lost trust in the automation.

---

## P0 scope — Release 1 framing

Per the PRD release plan, **P0 = FR-001, 002, 003, 004, 005, 006, 008, 010, 018**.

| Deferred | FRs | Theme |
| -------- | --- | ----- |
| **P1** | 12–17 | Budget Pacing Dashboard (Executive Summary + Pacing) — see [Budget Pacing Dashboard (P1)](#budget-pacing-dashboard-p1) |
| **P2** | 7, 11, 9 | High Deviation / anomaly, entity timeline, email alerts |
| **P3** | 19 | Conflict detection |

**Release 1 ships the Explainability page with two surfaces on one event stream:** a daily **Alerts** summary and a granular **Action Log**. No anomaly flags or conflict detection yet — but Alerts provide the daily digest that email alerts (P2) will eventually automate. The Action Log remains correctly attributed, explained, filterable, exportable, and retry-able.

That framing matters for design: Alerts orient users quickly; Action Log supports investigation without a separate recovery console.

### Non-goals (v1 / P0)

- Bulk editing from the log (audit-and-recovery only, not a campaign editor)
- Transactional undo of a chain of dependent changes (v1 reverts one entry at a time if/when revert lands)
- Retailer-side changes, taxonomy changes, campaign-management changes (V2/V3)
- Push/email delivery of alerts (P2) — P0 shows alerts in-product only

---

## Users (P0)

| Role | Description |
| ---- | ----------- |
| **Primary — Advertising manager / analyst** | Operates the AI optimizer. Today they either can't tell why a change happened, or they ask support / Slack / tribal knowledge. Post-P0: *"Action Logs is the one place I look when something looks off — I don't need to ask anyone."* |
| **Secondary — Brand / account lead** | Relies on automation to hit goals. Their JTBD ("be copied on anomaly/conflict alerts") is **FR-009 (P2)** — **not in P0**. Design P0 purely for the advertising manager / analyst. |

### Primary-user modes

- **Reactive / investigative:** "This number moved — who touched it, why, what changed?" → drill into the log.
- **Routine / audit:** "Let me scan what happened this week." → periodic sweep, filter, export.

---

## Core mental model

Today, "Update History" is a narrow, setup-only audit trail. Explainability P0 establishes a new model:

1. **One page, two lenses — Alerts vs Action Log.** Not two datasets — one underlying event stream. **Alerts** rolls up actions into one daily summary per **actor type** — exactly four types that can change goal-based optimization: **Ally AI**, **Manual**, **Day Parting**, and **Rule Based**. **Action Log** shows every independent action record in a single unified list. There is no separate Setup vs Automation tab; manual setup and automated changes live in the same list, distinguished by filters and actor badges.

2. **A row is a claim, not just a fact.** Every Action Log entry answers three questions **inline, without a click:** *Who did this? Why? What's the expected impact?* This is the shift from "system log" (technical, for engineers) to "answer key" (explainability layer).

3. **Grouping matches how people work.** A session (multiple setup changes saved together in one Save & Launch) is **one expandable Action Log entry** — matching "I made a bunch of changes and hit save," not individual field diffs as separate rows. Each separate Save & Launch is a separate top-level entry.

4. **Drill-down from Alerts to Action Log.** Clicking a daily alert switches to Action Log with date + actor-type filters pre-applied. Retry and export live in Action Log — filter by actor/status to find failures.

---

## Jobs to be done (P0 only)

- *When I land on Explainability from anywhere,* I want to see daily activity summaries by actor type without picking filters — oriented in under ~3 seconds (Alerts tab).
- *When I want the full picture,* I switch to Action Log or click an alert to drill into that day and actor type.
- *When I see an entry,* I want to know who/what did it and why, **without clicking**.
- *When something looks unusual,* I want to expand one entry and get full before/after, scope, and timestamp (local time).
- *When I'm hunting for something specific,* I want unified filters + search so thousands of rows become the few I care about.
- *When an action failed,* I want a visible, safe way to retry without leaving the log.
- *When I want to share evidence,* I want to export exactly what I'm looking at (not the whole log) as CSV.
- *When there's nothing to show,* I want to know **why** — no activity yet vs. no results for filters vs. not supported — so I don't mistake a limitation for a bug. **Empty states are a first-class JTBD.**

---

## Primary flow (end to end)

**Entry → Orientation (Alerts) → Drill-down / Action Log → Investigation → Action / Export**

1. **Entry.** From Update History panel or Action Logs nav (in this prototype: GBO home → Explainability Dashboard card). Two product entry points, one destination — identical landing state either way. Only on accounts with GBO live; otherwise keep current flow / unsupported states.
2. **Orientation.** Lands on **Alerts** tab (default), **last 7 days**. Alert actor types (Ally AI, Manual, Day Parting, Rule Based) adapt to account optimizer config — no dead cards for optimizer types the account doesn't have.
3. **Scan alerts.** Newest-first daily summaries — one card per `(day, actor type)` with action count, failure count, and topic summary. Click a card to drill into Action Log for that day and actor type.
4. **Action Log (optional).** Switch tab or drill from alert. Newest-first list of all actions — manual setup sessions, Ally AI runs, day-parting changes, rule-based automations — in one list. Each row: actor badge, action, why + expected impact inline, status.
5. **Narrow (optional).** Unified filters (actor type, person, action type, change status, setup step, failure reason, status) + entity search (AND with filters) → chips + clear-all.
6. **Investigate (optional).** Expand a grouped entry → individual actions with before/after. Entity timeline drill-in is FR-011 (P2) — nice-to-have, not blocking P0.
7. **Resolve (optional).** Failure → Retry (full batch or failed subset only) → **new** entry logged; original untouched (immutability).
8. **Export (optional).** Export current filtered/searched Action Log view to CSV; **"Download today's Ally AI changes"** remains available on Action Log as a self-serve digest stopgap before email (FR-009, P2).

Defaults must work with **zero personalization** by the user (last 7 days, Alerts tab, no filters).

---

## Key concepts

| Term | Definition |
| ---- | ---------- |
| **Explainability** | The unified audit experience for GBO changes — Alerts (daily summaries) + Action Log (full detail) on one event stream. |
| **Alerts tab** | Default view. One summary card per `(calendar day, actor type)` where actor type ∈ {Ally AI, Manual, Day Parting, Rule Based}. Click to drill into Action Log. |
| **Action Log tab** | Full list of every independent action — setup sessions, automation runs, day-parting changes — with unified filters. |
| **Alert actor type** | Who took action that day — one of four GBO change actors: **Ally AI**, **Manual** (a person saved setup or made a direct change), **Day Parting** (day-parting schedule changes from any source), or **Rule Based** (rule-triggered automation). There is no separate System actor. |
| **Actor badge** | Ally AI / Manual / Day Parting / Rule Based — captured **at action time**, immutable even if the user is later deactivated or account config changes. |
| **Session** | All setup changes committed in a single Save & Launch. Rendered as one grouped Action Log entry that expands to individual actions. |
| **Why + impact** | Inline reason (e.g. optimizer trigger) and expected impact (or "Impact pending") — the explainability layer on each row. |
| **Day-parting deep diff** | Full before/after schedule for day-parting changes (not metadata-only Created/Updated/Deleted). |
| **Retry** | Re-attempt failed actions from Action Log; partial retries only re-apply failures; always creates a **new** log entry. |

---

## Functional building blocks (P0)

### 1. Unified data model + Alerts / Action Log tabs (FR-001, FR-002)

- Single event stream; top tabs are **Alerts** (aggregated) vs **Action Log** (detail), not separate storage.
- **Four actor types** can change goal-based optimization. Alerts group by `(calendar day, actor type)`:
  - **Manual** — always shown when GBO is live (setup Save & Launch, direct human edits)
  - **Ally AI** — when account has Ally AI (includes custom optimizer actions rolled into Ally AI)
  - **Day Parting** — day-parting schedule changes (manual or automated)
  - **Rule Based** — when account has Rule Based automation
- There is **no System actor** — observational or batch jobs are attributed to the relevant actor type above.
- Actor badge always visible on Action Log rows; deactivated users retain name/email captured at action time with "(deactivated)" on Manual entries.

### 2. Four action families + grouping (FR-003)

| Family | Frequency | Action Log |
| ------ | --------- | ---------- |
| Ally AI action status (Success / Failure) | Real-time ≤15 min | One row per run/batch |
| Campaigns out of budget / % time in budget | Once a day | One row per campaign (attributed to the detecting automation — Ally AI or Rule Based, not a separate System actor) |
| Setup Created / Updated / Deleted (budget, goals, seasonality, constraints, strategies, day-parting, etc.) | On Save & Launch | One grouped row per session (Manual actor) |
| Day-parting schedule changes | On change or re-optimize | One row per change (Day Parting actor) |
| API / business-rule failures | Real-time ≤15 min | One row per failed action/batch |

- **Alerts** aggregate all Action Log entries of a given actor type on a given calendar day into one summary card.
- Session-grouping: multiple setup changes in one save → one expandable entry. Design must not show every field-level diff as a separate top-level row.

### 3. Why + Impact annotation (FR-004)

- Ally AI batches get a plain-language summary grounded in the batch's own numbers; deterministic template fallback if LLM is unavailable — never block the log.
- Summary numbers must match detail rows (trust/QA requirement).
- If no impact estimate: show **"Impact pending"**, not blank/zero.

### 4. Filtering + search (FR-005, FR-006)

- Filters combine with **AND**; active filters as removable chips; clear-all available.
- **Alerts tab:** date range only (default last 7 days).
- **Action Log tab (unified):** date/time, action status, **actor type** (Ally AI / Manual / Day Parting / Rule Based), person (specific user email for Manual entries), action type, change status (Created / Updated / Deleted), setup step, failure reason type, out-of-budget checkbox.
- Drill-down from alert pre-applies date + actor-type filters as a chip (e.g. `Ally AI · Jul 29`).
- Date range persists when switching Alerts ↔ Action Log; Action Log-specific filters remain when switching back from alert drill-down until cleared.
- **Search is entity-only** (name case-insensitive, ID exact) — Action Log only; not full-text over reasons.

### 5. Day-parting deep diff (FR-008)

- Log full before/after schedule, actor type, and reason for Manual, Ally AI, and Rule Based day-parting changes — all surfaced under the **Day Parting** actor type in Alerts.
- All day-parting entries appear in Action Log; filter by action type `day-parting-change`.
- Treat as its own content type in entry detail (schedule before/after), not a simple scalar value diff.

### 6. Export (FR-010)

- Export reflects **exactly** the current filtered/searched Action Log view; timestamps in local time.
- **"Download today's Ally AI changes"** on Action Log — stopgap before daily digest email (P2). Disabled when zero Ally AI actions today. Today's Ally AI **alert card** is the in-product digest entry point.

### 7. Retry (FR-018)

- Available on Action Log for setup failures and Ally AI / automation failures (partial and complete).
- Partial failure: retry **only** failed actions; never re-apply successes.
- Pre-validate deterministic business-rule failures; respect cooldown for rate limits; cap auto-retries (e.g. 5); edit-permission gating.
- Retry always produces a **new** logged entry — visually obvious (not a mutated original).

### 8. Empty / edge states (first-class system)

Five distinct states — each with its own message and, where relevant, a CTA:

1. **Unsupported retailer** — not an error
2. **GBO strategy not live yet** — "No GBO activity yet" + link to set up
3. **Zero results for these filters** — distinct from no activity
4. **No activity yet** — empty log, not broken
5. **Purged / past retention** (deep-link) — "This entry is no longer available (older than the retention window)."

---

## Behaviour rules (quick reference)

- Default land: **Alerts** tab, **last 7 days**, newest-first, local-time timestamps.
- Four alert actor types: **Ally AI**, **Manual**, **Day Parting**, **Rule Based** — adapt to account optimizer config where applicable (no dead cards).
- Click alert → Action Log with that day + actor type filtered; chip shows drill-down context.
- Badge = actor **at action time**, not current account config.
- Setup Save & Launch session → one grouped expandable entry (even for a single change); actor type **Manual**.
- Day-parting changes → **Day Parting** actor type regardless of whether the underlying trigger was manual or automated.
- Empty session (nothing committed) → no grouped entry.
- Logs are **immutable**; retry creates a new entry.
- Summary / why numbers must reconcile with detail rows; LLM down → templated fallback.
- Export / download = Action Log filtered view only; today's Ally AI download disabled when empty.
- Custom optimizer actions → roll into **Ally AI** alert actor type (`automationType === custom`).
- GBO not live / not supported → keep current product flow; do not invent a broken Explainability experience.

---

## Prototype notes

- Current entry: `src/components/settings/settings-home-content.tsx` → `/explainability-dashboard`.
- Implementation: `src/components/gbo-explainability/` — `AlertsView`, `AlertRow`, `ActionLogsPage`, unified filters in `filters-popover.tsx`, aggregation in `aggregate-alerts.ts`.
- Related setup audit trail during the wizard lives in `setup-session-store` (change ledger for Summary). Explainability is the **post-save, durable** history of those (and Ally AI) actions.

---

# Budget Pacing Dashboard (P1)

| Field | Value |
| ----- | ----- |
| **Product** | CommerceIQ Retail Media Management (RMM) |
| **Feature** | Budget Pacing Dashboard — Executive Summary + Pacing |
| **Version** | v1 |
| **Status** | Draft |
| **Entry point (prototype)** | AI Goal Optimizer home (`/`) |
| **Numbering note** | These FRs (012–017) are the **Explainability / P1** set. Setup-wizard FRs also use 012–017 in an earlier section — they are separate scopes. FR-015 and FR-017 for this dashboard were not specified yet. |

---

## Problem statement

Advertising managers get a weekly Budget Pacing Report email, but the in-product home page only shows a chart widget. They cannot see projected month-end utilisation, constraint gaps, or actionable recommendations next to the same numbers. P1 brings the emailer’s intelligence into the landing page with an Executive Summary lens and a Pacing tab that mirrors the report.

---

## Key concepts

| Term | Definition |
| ---- | ---------- |
| **Budget Pacing Dashboard** | The AI Goal Optimizer landing page with two tabs: Executive Summary and Pacing. |
| **Executive Summary tab** | Default tab. Performance Overview (AI summary) + the existing Budget Pacing chart/widget (unchanged below). Forward-looking projected metrics are surfaced in the Performance Overview narrative and/or the widget Metrics row as needed — not as a separate four-card strip. |
| **Pacing tab** | In-product mirror of the weekly Budget Pacing Report emailer — Sections A–E. |
| **97–102% color band** | On Plan (green) when pacing/utilisation is within 97–102%; otherwise Behind/Ahead (red). |
| **Pacing MTD** | Actual MTD spend ÷ planned MTD spend. |
| **Projected utilisation** | Projected month-end spend ÷ planned monthly budget (uses the filter window, default 14 days). |
| **Performance Overview** | Collapsible AI-generated summary at the top of the Executive Summary tab. |

---

## Functional requirements

### FR-012 — Dashboard shell with Executive Summary and Pacing tabs

**Statement.** The Budget Pacing Dashboard opens with two tabs. Executive Summary = the existing dashboard page with an Executive Summary section added on top. Pacing tab = the emailer-style report view.

**Happy flow.** The user opens the Budget Pacing Dashboard on a live account. It loads on the Executive Summary tab; the Executive Summary section sits above the existing (unchanged) dashboard charts/tables. The user switches to the Pacing tab and back; the selected tab persists within the session.

**Acceptance criteria**

- Two tabs render (Executive Summary default); the selected tab persists on in-session navigation.
- On the Executive Summary tab, the summary section sits above the existing dashboard, which is otherwise unchanged.
- Widgets load independently with skeleton loaders; the slowest widget does not block the page.
- Filters applied on one tab persist on the other as well.

**Edge cases & defaults**

- GBO not supported for the retailer: same as current product behaviour.
- GBO strategy not live yet: same as current product behaviour.
- Slow pacing-screen load: the dashboard should load within 10 seconds in the default view.

### FR-013 — Executive Summary section (Performance Overview)

**Statement.** A collapsible Executive Summary at the top of the Executive Summary tab (labeled **Performance Overview**). It summarizes pacing, performance, and under/over-pacing reasons with actionable insights. Prototype uses a deterministic template from instance data (no live LLM); product target is GPT-class generation with the same constraints.

**Behavioural requirements**

- Dynamic based on filters — recomputes for the current selection (retailer, brand/level, date range, attribution window).
- No hallucination — every figure/claim traces to instance data; if a metric is unavailable it is omitted, not guessed. Shows an “AI-generated summary — verify in your instance” disclaimer.
- Accurate numbers — figures match the underlying widgets and the pacing table exactly.
- Actionable insights — names what to do with supporting numbers.

**Happy flow.** The user lands on the Executive Summary tab with default filters (14-day window). The summary generates from instance data. It presents at least one actionable recommendation tied to specific numbers. A brand filter change re-generates the summary against the filtered data within 30 seconds. Cross-checks against widgets below match.

**Acceptance criteria**

- A filter change re-generates the summary against the filtered data within 30 seconds.
- A missing metric is omitted; no placeholder or estimated number is shown.
- Every number in the summary matches the corresponding widget / pacing table to the displayed precision.
- The summary includes at least one actionable recommendation tied to specific numbers where the data supports one.
- The AI-generated disclaimer is visible.

**Edge cases & defaults**

- LLM service down: show the last-generated summary with a timestamp, or a deterministic fallback — never blank or fabricated.
- Conflicting signals (on-plan spend but efficiency dropping): reflect both, consistent with the Pacing tab.

### FR-014 — Projected spend & utilisation metrics

**Statement.** Add forward-looking pacing metrics to the Executive Summary tab as **four cards**:

1. Projected Sales for the complete month
2. Projected utilisation / pacing % complete month (projected month-end spend ÷ planned monthly budget), with projected $ over/under-spend alongside the %
3. Projected Goal
4. Pacing MTD (actual MTD ÷ planned MTD) — Spend MTD (actual vs planned) is the planned/actual reference on this card, not a fifth card

Show the 97–102% color band (outside the band → red).

**Acceptance criteria**

- All four metrics render with value, planned reference, and color band.
- Projected utilisation uses the filter window (default 14-day) and current planned monthly budget; projected $ over/under-spend shows next to the %.
- Spend MTD and Pacing MTD match the pacing table (FR-016 Section A) exactly.
- Values outside 97–102% render red per the band.
- Zero planned budget: show “no plan set” instead of dividing by zero.
- Early month / insufficient history: show projection, not false precision.
- Mid-month plan/budget change: projection uses the current plan.
- Manual-override inflation: projection reflects actuals; the summary flags override contribution.

### FR-016 — Pacing tab (from the Budget Pacing Report)

**Statement.** The Pacing tab renders the intelligence currently sent in the weekly Budget Pacing Report emailer, in-product with minimal new design, mirroring the emailer’s sections. All figures are from instance data.

- **Section A — Weekly state of the account (pacing table).** Columns: Level 1, Level 2, Planned MTD, Actual MTD, Pacing % (with On Plan / Behind / Ahead status), Goal, Goal Value, goal metric, Budget/Bid Opt, % Time in Budget. Include the account rollup line and GBO execution-quality stats: budget-change success %, bid-change success %, recommendation-coverage %.
- **Section B — Constraint analysis.** Table: Alert, Level 1, Level 2, Group, Constraint Type, Constraint %, Spend Share %, Deviation (points + relative %), with plain-language explanation of each flagged gap.
- **Section C — What changed and why.** Ranked narrative of under/over-pacing drivers tied to numbers.
- **Section D — What to do this week.** Recommendations, each with: Action, Lever used, Exact setting change, Why now (with numbers), Expected impact, Risk, How to monitor this week.
- **Section E — Watchouts.** Forward-looking risks.

**Acceptance criteria**

- Sections A–E populate from the account’s current instance data for the selected scope and date range.
- Pacing % status and color band (97–102% green) render correctly per level.
- Each Section D recommendation includes lever, exact setting change, numbers, expected impact, risk, and monitoring guidance.
- Any figure in Sections A–E reconciles with the Executive Summary and dashboard widgets.
- Parent–child rollup: parent-level spend must not misrepresent child spend; show budget context so a rolled-up utilisation % isn’t read as the parent’s own.
- No constraints configured: Section B shows “no constraints set,” not an empty error.
- No recommendations for a day: reflected in recommendation-coverage %, not hidden.
- AI narrative unavailable: tabular Sections A/B still render; C/D/E degrade to “summary pending” without blocking the table.
- Manual overrides present: Section C attributes over-pacing to overrides explicitly.

---

## Behaviour rules (quick reference)

- Default land: **Executive Summary** tab; default date filter = **14-day window**.
- Tab selection and filters persist for the browser session (in-app navigation).
- Shared filters apply to both tabs.
- Widgets load independently (skeletons); slowest widget does not block the page; target ≤10s default view.
- 97–102% = On Plan (green); outside = Behind/Ahead (red).
- Four metric cards only (FR-014); Spend MTD is the reference on the Pacing MTD card.
- Performance Overview is AI-labeled with disclaimer; omit missing metrics; never invent numbers.
- Pacing A/B always render; C/D/E may show “summary pending.”
- FR-015 and FR-017 for this dashboard are not specified yet — do not invent them.

---

## Prototype notes

- Entry: `src/components/home/ai-goal-optimizer-home.tsx` (`/`).
- Shared instance + filters: `src/lib/home/` (`pacing-instance.ts`, `pacing-dashboard-store.ts`, etc.).
- UI: `src/components/home/` — dashboard shell, Performance Overview, metric cards, Pacing sections A–E.
- Existing Budget Pacing chart widget remains below the new Executive Summary content and reads from the same instance.
