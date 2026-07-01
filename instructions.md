# Design Instructions

## Icons
- Use Lucide React only. Import: `import { Bell, Home } from "lucide-react"`

## Colors
- Use Tailwind palette classes only (e.g. `violet-600`, `slate-100`).
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

## Typography
- Inter (sans), JetBrains Mono (code).
- Headings: `font-semibold` or `font-bold`.
- Muted text: `text-muted-foreground`.

## Code quality
- Interactive pages: `"use client"`.
- No inline styles — Tailwind only.
- Keep components under 150 lines; split if needed.
