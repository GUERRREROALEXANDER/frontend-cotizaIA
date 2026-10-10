# Skiper UI (https://skiper-ui.com/)

## What it is (2-3 lines)
Component library built on top of shadcn/ui (Radix UI + Tailwind CSS) offering 106+ animated, polished components. Designed for Next.js/React apps with Motion.dev (Framer Motion) animations. Components are single-file, copy-pasteable via `npx shadcn add @skiper-ui/skiper`. Created by Gxuri.

## Free or paid (what is free, license if stated)
Free: ~20+ components (marked "Free Component" on homepage). Premium: $129 one-time for all premium components + lifetime updates; $549 "Exclusive" tier (coming soon) adds Figma files + full website templates. No subscription. License: components can be used in unlimited personal/commercial projects.

## Steal for CotizaIA (5-10 bullets: concrete, named pieces usable in a dashboard: nav/sidebar, KPI cards, tables, empty states, CTAs, forms, toasts, command palettes, motion recipes with durations/easings if given. Each bullet with a direct URL when one exists)
- **Dynamic Island** (free) — Expandable notification/toast hub with spring physics, drag-to-dismiss, auto-collapse. URL: https://skiper-ui.com/v1/skiper2
- **Command Palette** (free) — ⌘K search with grouped results, keyboard nav, recent history, custom actions. URL: https://skiper-ui.com/v1/skiper1 (Quick Start shows it)
- **Image Reveal** (premium) — Scroll-triggered image unmask with staggered stagger, clip-path morph. URL: https://skiper-ui.com/v1/skiper71
- **Hover Members** (premium) — Avatar stack that expands on hover with spring stagger, tooltip names. URL: https://skiper-ui.com/v1/skiper6
- **Things Drag and Scroll** (premium) — Horizontal scroll with drag momentum, snap points, scroll-snap-type. URL: https://skiper-ui.com/v1/skiper5
- **Devouring Details Sign In** (premium) — Animated form with field focus transitions, label float, validation shake. URL: https://skiper-ui.com/v1/skiper56
- **Vercel Tooltip** (premium) — Rich tooltip with tail, delayed show/hide (150ms/100ms), side positioning. URL: https://skiper-ui.com/v1/skiper43
- **Aave Token Swap** (premium) — Complex form with dependent selects, live price feed skeleton, swap animation. URL: https://skiper-ui.com/v1/skiper22
- **Image Cursor Trail** (premium) — Cursor-following particle trail with canvas, reduced-motion fallback. URL: https://skiper-ui.com/v1/skiper18
- **Templates (coming soon)** — Full Next.js dashboard templates with Figma sources. URL: https://skiper-ui.com/#templates

## Code or install snippets (only if the site shows copyable code or an npm package; paste the exact snippet, max 3)
```bash
# Install via shadcn CLI (single component)
npx shadcn add @skiper-ui/skiper40
```

```bash
# Quick start component (Command Palette)
npx shadcn add @skiper-ui/skiper1
```

```bash
# Dynamic Island (free component)
npx shadcn add @skiper-ui/skiper2
```

## Skip (what does not fit a dashboard, 1-3 bullets)
- Marketing/landing components (hero sections, pricing tables, testimonial carousels) — not dashboard UI.
- Experimental/artistic components (cursor trails, image reveals) — delightful but not core dashboard patterns.
- Components requiring Motion.dev (Framer Motion) if project uses only CSS animations or a different motion lib.