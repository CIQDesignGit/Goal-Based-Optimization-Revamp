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
