# Design Specifications

> Source: Figma — [Design Variables ft. Tailwind CSS](https://www.figma.com/design/240a6sSBFv3mxEL7FC2L4y/Design-Variables?node-id=25030-6001)
> Applied to: `src/app/globals.css` via Tailwind v4 `@theme` tokens
> Status: In Progress (tokens will expand as the Figma file evolves)

---

## Confirmed Figma Variables

These values were extracted directly from the Figma variable library:

| Figma Variable Name   | Hex Value   | Role                        |
| --------------------- | ----------- | --------------------------- |
| `Purple/500`          | `#875BF7`   | Brand primary               |
| `Purple/200`          | `#DDD6FE`   | Brand light / accent        |
| `Warning/600`         | `#DC6803`   | Warning text / icon         |
| `Warning/100`         | `#FEF0C7`   | Warning background          |
| `Base/White`          | `#FFFFFF`   | Base white / background     |

---

## Typography

### Typeface
| Role      | Font Family      | Usage                              |
| --------- | ---------------- | ---------------------------------- |
| Sans      | **Inter**        | All body text, UI labels, headings |
| Mono      | **JetBrains Mono** | Code blocks, data values, logs   |

> Inter is loaded via `next/font/google` as `--font-inter`.
> JetBrains Mono is loaded via `next/font/google` as `--font-mono`.

### Font Sizes
| Token         | Size     | Pixels | Usage                         |
| ------------- | -------- | ------ | ----------------------------- |
| `text-2xs`    | 0.625rem | 10px   | Micro labels, timestamps      |
| `text-xs`     | 0.75rem  | 12px   | Captions, helper text         |
| `text-sm`     | 0.875rem | 14px   | Secondary labels, table cells |
| `text-base`   | 1rem     | 16px   | Body copy, default            |
| `text-lg`     | 1.125rem | 18px   | Lead text                     |
| `text-xl`     | 1.25rem  | 20px   | Subheadings                   |
| `text-2xl`    | 1.5rem   | 24px   | Heading small                 |
| `text-3xl`    | 1.875rem | 30px   | Heading medium                |
| `text-4xl`    | 2.25rem  | 36px   | Heading large                 |
| `text-5xl`    | 3rem     | 48px   | Display small                 |
| `text-6xl`    | 3.75rem  | 60px   | Display medium                |
| `text-7xl`    | 4.5rem   | 72px   | Display large                 |

### Font Weights
| Token                   | Value | Usage                         |
| ----------------------- | ----- | ----------------------------- |
| `font-weight-regular`   | 400   | Body copy                     |
| `font-weight-medium`    | 500   | Labels, nav items             |
| `font-weight-semibold`  | 600   | Headings, button text         |
| `font-weight-bold`      | 700   | Display headings, emphasis    |

### Line Heights
| Token             | Value | Usage                  |
| ----------------- | ----- | ---------------------- |
| `leading-tight`   | 1.25  | Headings               |
| `leading-snug`    | 1.375 | Subheadings            |
| `leading-normal`  | 1.5   | Body text (default)    |
| `leading-relaxed` | 1.625 | Long-form content      |

### Letter Spacing
| Token              | Value    | Usage              |
| ------------------ | -------- | ------------------ |
| `tracking-tight`   | -0.025em | Large headings     |
| `tracking-normal`  | 0        | Default            |
| `tracking-wide`    | 0.025em  | Buttons, labels    |
| `tracking-wider`   | 0.05em   | Uppercase labels   |
| `tracking-widest`  | 0.1em    | ALL CAPS badges    |

---

## Color System

### Brand — Purple
> Seed: `Purple/500 = #875BF7` and `Purple/200 = #DDD6FE` from Figma.
> Full palette derived from those anchor values.

| Token              | Tailwind Class      | Hex       | Usage                              |
| ------------------ | ------------------- | --------- | ---------------------------------- |
| `--color-brand-50` | `bg-brand-50`       | `#faf5ff` | Hover backgrounds                  |
| `--color-brand-100`| `bg-brand-100`      | `#f3e8ff` | Light tints                        |
| `--color-brand-200`| `bg-brand-200`      | `#ddd6fe` | **Figma Purple/200** — Accent bg   |
| `--color-brand-300`| `bg-brand-300`      | `#c4b5fd` | Subtle UI elements                 |
| `--color-brand-400`| `bg-brand-400`      | `#a78bfa` | Light mode interactive states      |
| `--color-brand-500`| `bg-brand-500`      | `#875bf7` | **Figma Purple/500** — PRIMARY     |
| `--color-brand-600`| `bg-brand-600`      | `#7c3aed` | Hover on primary                   |
| `--color-brand-700`| `bg-brand-700`      | `#6d28d9` | Active/pressed on primary          |
| `--color-brand-800`| `bg-brand-800`      | `#5b21b6` | Dark text on light backgrounds     |
| `--color-brand-900`| `bg-brand-900`      | `#4c1d95` | Very dark brand                    |
| `--color-brand-950`| `bg-brand-950`      | `#2e1065` | Darkest brand (dark mode text)     |

### Warning — Amber
> Seeds: `Warning/100 = #FEF0C7` and `Warning/600 = #DC6803` from Figma.

| Token                 | Tailwind Class        | Hex       | Usage                            |
| --------------------- | --------------------- | --------- | -------------------------------- |
| `--color-warning-50`  | `bg-warning-50`       | `#fffbeb` | Warning page background          |
| `--color-warning-100` | `bg-warning-100`      | `#fef0c7` | **Figma Warning/100** — Badge bg |
| `--color-warning-200` | `bg-warning-200`      | `#fed27a` | —                                |
| `--color-warning-300` | `bg-warning-300`      | `#fdc63c` | —                                |
| `--color-warning-400` | `bg-warning-400`      | `#fcb519` | Warning icon (light)             |
| `--color-warning-500` | `bg-warning-500`      | `#f89b04` | —                                |
| `--color-warning-600` | `bg-warning-600`      | `#dc6803` | **Figma Warning/600** — Text     |
| `--color-warning-700` | `bg-warning-700`      | `#b54107` | —                                |
| `--color-warning-800` | `bg-warning-800`      | `#923009` | —                                |
| `--color-warning-900` | `bg-warning-900`      | `#78270a` | —                                |

### Success — Green
| Token                 | Tailwind Class        | Hex       |
| --------------------- | --------------------- | --------- |
| `--color-success-50`  | `bg-success-50`       | `#f0fdf4` |
| `--color-success-100` | `bg-success-100`      | `#dcfce7` |
| `--color-success-500` | `bg-success-500`      | `#22c55e` |
| `--color-success-600` | `bg-success-600`      | `#16a34a` |
| `--color-success-700` | `bg-success-700`      | `#15803d` |

### Error — Red
| Token               | Tailwind Class      | Hex       |
| ------------------- | ------------------- | --------- |
| `--color-error-50`  | `bg-error-50`       | `#fef2f2` |
| `--color-error-100` | `bg-error-100`      | `#fee2e2` |
| `--color-error-500` | `bg-error-500`      | `#ef4444` |
| `--color-error-600` | `bg-error-600`      | `#dc2626` |
| `--color-error-700` | `bg-error-700`      | `#b91c1c` |

### Info — Blue
| Token              | Tailwind Class     | Hex       |
| ------------------ | ------------------ | --------- |
| `--color-info-50`  | `bg-info-50`       | `#eff6ff` |
| `--color-info-100` | `bg-info-100`      | `#dbeafe` |
| `--color-info-500` | `bg-info-500`      | `#3b82f6` |
| `--color-info-600` | `bg-info-600`      | `#2563eb` |
| `--color-info-700` | `bg-info-700`      | `#1d4ed8` |

### Neutral — Gray
| Token                  | Tailwind Class         | Hex       | Usage                         |
| ---------------------- | ---------------------- | --------- | ----------------------------- |
| `--color-neutral-50`   | `bg-neutral-50`        | `#f9fafb` | Page background, table rows   |
| `--color-neutral-100`  | `bg-neutral-100`       | `#f3f4f6` | Secondary surface             |
| `--color-neutral-200`  | `bg-neutral-200`       | `#e5e7eb` | Borders, dividers             |
| `--color-neutral-300`  | `bg-neutral-300`       | `#d1d5db` | Disabled borders              |
| `--color-neutral-400`  | `bg-neutral-400`       | `#9ca3af` | Placeholder text, icons       |
| `--color-neutral-500`  | `bg-neutral-500`       | `#6b7280` | Secondary text                |
| `--color-neutral-600`  | `bg-neutral-600`       | `#4b5563` | Body text (medium contrast)   |
| `--color-neutral-700`  | `bg-neutral-700`       | `#374151` | Body text (high contrast)     |
| `--color-neutral-800`  | `bg-neutral-800`       | `#1f2937` | Headings                      |
| `--color-neutral-900`  | `bg-neutral-900`       | `#111827` | Primary text                  |
| `--color-neutral-950`  | `bg-neutral-950`       | `#030712` | Max contrast text             |

### Semantic Color Roles (CSS Variables)
These are the shadcn tokens wired to the Tailwind utility system.
Use `bg-primary`, `text-foreground`, etc. in components.

| CSS Variable             | Light Mode Value  | Dark Mode Value   | Tailwind Class              |
| ------------------------ | ----------------- | ----------------- | --------------------------- |
| `--primary`              | `#875bf7`         | `#a78bfa`         | `bg-primary`                |
| `--primary-foreground`   | `#ffffff`         | `#2e1065`         | `text-primary-foreground`   |
| `--secondary`            | neutral-100       | neutral-700       | `bg-secondary`              |
| `--accent`               | `#ddd6fe`         | brand-900         | `bg-accent`                 |
| `--accent-foreground`    | `#4c1d95`         | brand-200         | `text-accent-foreground`    |
| `--background`           | `#ffffff`         | neutral-900       | `bg-background`             |
| `--foreground`           | neutral-900       | neutral-50        | `text-foreground`           |
| `--muted`                | neutral-100       | neutral-700       | `bg-muted`                  |
| `--muted-foreground`     | neutral-500       | neutral-400       | `text-muted-foreground`     |
| `--border`               | neutral-200       | white/10%         | `border-border`             |
| `--ring`                 | `#875bf7`         | `#a78bfa`         | `outline-ring`              |
| `--destructive`          | error-500         | error-400         | `bg-destructive`            |

---

## Spacing

> Tailwind v4 uses a **4px base grid** (1 unit = 4px). No custom overrides needed.
> Below is a reference of key values used in layouts.

| Scale | Value    | Pixels | Common Use                           |
| ----- | -------- | ------ | ------------------------------------ |
| 0.5   | 0.125rem | 2px    | Icon gaps, micro nudges              |
| 1     | 0.25rem  | 4px    | Icon padding, tight gaps             |
| 1.5   | 0.375rem | 6px    | Small padding                        |
| 2     | 0.5rem   | 8px    | Inner padding (dense)                |
| 3     | 0.75rem  | 12px   | Badge padding, small cards           |
| 4     | 1rem     | 16px   | Default padding, button padding      |
| 5     | 1.25rem  | 20px   | Form field padding                   |
| 6     | 1.5rem   | 24px   | Card padding, section spacing        |
| 8     | 2rem     | 32px   | Large card padding                   |
| 10    | 2.5rem   | 40px   | Section padding                      |
| 12    | 3rem     | 48px   | Large section gaps                   |
| 16    | 4rem     | 64px   | Page-level vertical spacing          |
| 20    | 5rem     | 80px   | Hero padding                         |
| 24    | 6rem     | 96px   | Section dividers                     |

---

## Border Radius

| Token              | CSS Variable          | Value    | Pixels | Usage                             |
| ------------------ | --------------------- | -------- | ------ | --------------------------------- |
| `rounded-none`     | `--radius-none`       | 0        | 0px    | Sharp tables, data grids          |
| `rounded-xs`       | `--radius-xs`         | 0.125rem | 2px    | Tiny chips                        |
| `rounded-sm`       | `--radius-sm`         | 0.25rem  | 4px    | Tags, small badges                |
| `rounded-md`       | `--radius-md`         | 0.375rem | 6px    | Buttons, inputs                   |
| `rounded-lg`       | `--radius-lg`         | 0.5rem   | 8px    | **Default** — cards, dropdowns    |
| `rounded-xl`       | `--radius-xl`         | 0.75rem  | 12px   | Modals, drawers                   |
| `rounded-2xl`      | `--radius-2xl`        | 1rem     | 16px   | Panels, large cards               |
| `rounded-3xl`      | `--radius-3xl`        | 1.5rem   | 24px   | Feature sections                  |
| `rounded-4xl`      | `--radius-4xl`        | 2rem     | 32px   | Hero sections                     |
| `rounded-full`     | `--radius-full`       | 9999px   | —      | Pills, avatars, circular buttons  |

> **Shadcn uses a dynamic base**: `--radius: 0.5rem (8px)`.
> Shadcn-generated classes (`rounded-lg`, `rounded-md`, etc.) scale from this value.

---

## Shadows / Elevation

| Token          | CSS Variable        | Usage                                    |
| -------------- | ------------------- | ---------------------------------------- |
| `shadow-xs`    | `--shadow-xs`       | Subtle lift — floating tooltips          |
| `shadow-sm`    | `--shadow-sm`       | Dropdown menus, small cards              |
| `shadow-md`    | `--shadow-md`       | Cards, panels (default elevation)        |
| `shadow-lg`    | `--shadow-lg`       | Modals, large cards                      |
| `shadow-xl`    | `--shadow-xl`       | Drawers, side panels                     |
| `shadow-2xl`   | `--shadow-2xl`      | Full-screen overlays                     |
| `shadow-brand` | `--shadow-brand`    | Focused/active brand buttons             |
| `shadow-brand-lg` | `--shadow-brand-lg` | Brand hero elements, CTAs             |
| `shadow-inner` | `--shadow-inner`    | Input fields (focused), pressed buttons  |

### Shadow Values
```
shadow-xs:   0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-sm:   0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.06)
shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.06)
shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.06)
shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.04)
shadow-2xl:  0 25px 50px -12px rgb(0 0 0 / 0.25)
shadow-brand: 0 4px 14px 0 rgb(135 91 247 / 0.35)
shadow-brand-lg: 0 8px 28px 0 rgb(135 91 247 / 0.40)
shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.06)
```

---

## Chart Colors

Used in data visualisations (charts, graphs, dashboards).

| Variable      | Light Mode  | Dark Mode   |
| ------------- | ----------- | ----------- |
| `--chart-1`   | `#875bf7`   | `#a78bfa`   |
| `--chart-2`   | `#3b82f6`   | `#60a5fa`   |
| `--chart-3`   | `#22c55e`   | `#4ade80`   |
| `--chart-4`   | `#dc6803`   | `#fcb519`   |
| `--chart-5`   | `#ef4444`   | `#f87171`   |

---

## Usage Guide

### How to use design tokens in components

**Semantic tokens** (light/dark aware — preferred for components):
```tsx
// Uses --primary which switches between #875bf7 (light) and #a78bfa (dark)
<button className="bg-primary text-primary-foreground">Click me</button>

// Muted text
<p className="text-muted-foreground">Helper text</p>
```

**Brand palette** (always the same value regardless of dark mode):
```tsx
// Always #875bf7 — use when you need a fixed brand color
<span className="text-brand-500">Brand highlight</span>

// Brand button with glow shadow
<button className="bg-brand-500 hover:bg-brand-600 shadow-brand text-white">
  Primary CTA
</button>
```

**Semantic status colors:**
```tsx
// Warning badge (matches Figma "In Progress" pattern)
<span className="bg-warning-100 text-warning-600 rounded-full px-3 py-1">
  Warning
</span>

// Success state
<span className="bg-success-100 text-success-700">Active</span>

// Error state
<span className="bg-error-100 text-error-700">Failed</span>
```

**Typography:**
```tsx
// Inter is applied globally via font-sans
<h1 className="font-heading text-4xl font-bold tracking-tight">Heading</h1>
<p className="font-sans text-base leading-normal">Body copy</p>
<code className="font-mono text-sm">code block</code>
```

---

## File Structure

```
app/
├── src/
│   └── app/
│       ├── globals.css        ← All design tokens live here (@theme blocks)
│       └── layout.tsx         ← Inter + JetBrains Mono loaded here
└── design-specs.md            ← This file
```

---

## Notes & Next Steps

- The Figma file is marked **"In Progress"** — new tokens will be added as the design evolves.
- When new Figma variables are published, update `globals.css` `@theme` block and this file.
- Components (buttons, inputs, cards, etc.) will be documented in a separate `component-specs.md` once the component library is ready.
- Dark mode is fully wired — toggle the `.dark` class on `<html>` to activate.
