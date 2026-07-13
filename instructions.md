# Design Instructions

## Icons
- Use Lucide React only. Import: `import { Bell, Home } from "lucide-react"`

## Colors
- Use Tailwind palette classes only (e.g. `brand-600`, `blue-600`, `slate-100`).
- Brand color is Tailwind blue — prefer `brand-*` tokens (e.g. `bg-brand-600`, `text-brand-700`).
- No raw hex in components — use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`).
- Slate is the neutral color — use `slate-*` for grays. Do NOT use `zinc-*`.

## Images
- Placeholder images: `https://placehold.co/{width}x{height}`

## Component library
- **shadcn/ui is the baseline.** Use shadcn components (Button, Card, Select, Avatar, etc.) from `src/components/ui/` as the starting point for all UI.
- **Customize on top of shadcn.** When designs call for different styling or behavior, extend or wrap shadcn primitives — do not rebuild from scratch. Apply project tokens, Tailwind classes, and composition in feature components under `src/components/`.
- Add new shadcn components via the CLI when needed; then tailor them to match our design system.

## Styling
- Tailwind CSS 4 utility classes only.
- **Buttons:** 4px corner radius everywhere. Set in `src/components/ui/button.tsx` — do not override with larger radii on `Button` components.
- prompt-kit pattern for chat/AI UI (PromptInput, Message, Loader, etc.).

## Layout
- All pages share AppShell: left icon sidebar + main content area.
- Keep pages under 300 lines. Extract into `src/components/`.

## GBO setup flow
- Portfolio wizard shell (Ally-style): General → Goals & Budgets → Seasonality (optional) → Constraints (optional) → **Optimizer (always)** → Summary.
- Do not gate Optimizer behind a switch — it is always present before Summary.
- **Item-level Ally → rule-based (important):** Changing one brand/scope row to rule-based does **not** rebuild the portfolio stepper. For **that item only**, skip budget entry and seasonality. Effective path for that item: **Goals → Optimizer → Summary**, with **Constraints only when the floor/ceiling toggle is on**. Clarify this at the point of change (inline/popover/banner on that row — not a full-flow rebuild).
- **Day Parting** in Optimizer is a clickable tile (not a free-text field). Click opens a right side panel to configure the hourly bid strategy.

## Typography
- Inter (sans), JetBrains Mono (code).
- Headings: `font-semibold` or `font-bold`.
- Muted text: `text-muted-foreground`.

## Code quality
- Interactive pages: `"use client"`.
- No inline styles — Tailwind only.
- Keep components under 150 lines; split if needed.

## Constraints step — percent split (product rules)
When a user edits spend/campaign percent cells on a brand row:
1. **Manual edits are locked** — every value the user changed stays as entered.
2. **Prefilled columns auto-adjust first** — all remaining (unlocked) columns rebalance proportionally using last-30-day historic weights until the row totals **100%**.
3. **Error state only when auto-adjust is impossible** — show red `SUM% / 100%` on Total and disable Next when:
   - locked manual values alone exceed **100%**, or
   - every column in the group is manually set and the sum is not exactly **100%**.
4. Never zero out columns to “fix” an over-100 row; leave values as entered and let the user adjust.
5. Cell styling: **prefilled** (gray italic + `~`) = still at historic value; **edited within ±15%** (blue) = user changed but close to historical; **edited beyond ±15%** (red) = soft warning only — does **not** disable Next; **adjusted** (blue/gray) = auto-rebalanced after another edit.
