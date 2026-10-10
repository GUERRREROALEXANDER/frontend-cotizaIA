# CotizaIA design system (v2)

Single source of truth for the redesign. Research behind it: `docs/design-research/*.md`.

## Scene and register
An agency owner reads a client's WhatsApp brief at 10 pm on a laptop, wants a priced proposal before going to bed; the same app is demoed the next day on a classroom projector. Night use makes **dark the default**; projectors wash dark UIs out, so **light is a first-class theme**, not an afterthought.

Register: **product**. The tool disappears into the task (Linear, Raycast, Stripe level of trust). Motion conveys state; the one place it performs is the **agent pipeline monitor**, the demo's star.

## Color (OKLCH, restrained + one committed surface)
Strategy: warm graphite neutrals, one **ember** accent (primary action, selection, focus). Not the AI-violet reflex, not the old blue. Data viz uses its own categorical palette. Tokens are CSS variables in `src/theme/tokens.css`, switched by `html[data-theme="dark"|"light"]`.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `oklch(0.165 0.008 70)` | `oklch(0.975 0.006 80)` | app canvas |
| `--surface` | `oklch(0.205 0.009 70)` | `oklch(0.995 0.003 80)` | panels, cards |
| `--surface-2` | `oklch(0.245 0.010 70)` | `oklch(0.955 0.007 80)` | sidebar, inputs, hover rows |
| `--border` | `oklch(0.30 0.010 70)` | `oklch(0.90 0.008 80)` | hairlines |
| `--text` | `oklch(0.95 0.010 80)` | `oklch(0.22 0.012 70)` | body |
| `--text-muted` | `oklch(0.72 0.012 75)` | `oklch(0.45 0.012 70)` | labels, meta |
| `--text-faint` | `oklch(0.56 0.010 75)` | `oklch(0.58 0.010 70)` | placeholders, counters |
| `--accent` | `oklch(0.72 0.150 48)` | `oklch(0.60 0.165 42)` | primary buttons, focus, selection |
| `--accent-fg` | `oklch(0.18 0.02 50)` | `oklch(0.99 0.005 80)` | text on accent |
| `--accent-soft` | accent at 14% | accent at 10% | selected nav item, chips |
| `--success` | `oklch(0.74 0.14 155)` | `oklch(0.55 0.13 155)` | accepted, done |
| `--warning` | `oklch(0.80 0.14 85)` | `oklch(0.62 0.14 75)` | ambiguity, 90% char limit |
| `--danger` | `oklch(0.68 0.18 25)` | `oklch(0.56 0.19 25)` | errors, rejected, 100% limit |
| `--info` | `oklch(0.74 0.10 230)` | `oklch(0.52 0.12 240)` | analyzing, info |

Rules: never `#000`/`#fff`; no gradient text; no side-stripe borders; glass/blur only on the sticky topbar and overlays (palette, drawer). Every color in components comes from a token (no raw hex in JSX).

Status colors: RECEIVED/QUOTED neutral, ANALYZING info, IN_REVIEW warning, SENT/NEGOTIATING accent, ACCEPTED/CONTRACT_ISSUED success, REJECTED/EXPIRED danger-muted.

Chart palette (categorical, both themes legible): ember `--accent`, teal `oklch(0.70 0.11 190)`, sand `oklch(0.80 0.09 85)`, slate-blue `oklch(0.66 0.09 255)`, sage `oklch(0.72 0.09 145)`.

## Typography
One family: **Geist Variable** for everything, **Geist Mono Variable** for IDs, money and durations (`font-variant-numeric: tabular-nums`). Self-hosted via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`.
Fixed rem scale, ratio 1.2: 12 / 13 (UI default) / 14 / 16 / 20 / 24 / 30. Weights 400/500/600. Page titles 24/600, section titles 16/600, labels 12/500 muted. Prose capped at 68ch. No uppercase tracking-wide eyebrows on every block (one per page max).

## Space, radius, elevation
4px grid: 4, 8, 12, 16, 20, 24, 32, 48. Vary rhythm: dense lists 8/12, panels 20/24, page sections 32/48.
Radius: 6 (inputs, chips), 10 (buttons, cards), 14 (panels, drawer), 999 (pills, badges).
Elevation: dark theme uses borders + `--surface` steps, no shadows except overlays (`0 24px 60px -12px oklch(0 0 0 / .55)`); light theme `0 1px 2px oklch(0.2 0.01 70 / .06), 0 8px 24px -12px oklch(0.2 0.01 70 / .12)`.

## Motion
One curve family, exponential ease-out, no bounce:
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` (quint) for enters and state changes
- `--ease-fluid: cubic-bezier(0.32, 0.72, 0, 1)` for sheets, drawer, palette, sliding indicators
- `--ease-in: cubic-bezier(0.64, 0, 0.78, 0)` for exits only

| Kind | Duration | Example |
|---|---|---|
| micro | 120 ms | button press `scale(.97)`, checkbox, hover tint |
| state | 200 ms | tabs indicator, toggles, row expand, counter color |
| panel | 320 ms | drawer, palette, view transition (opacity + 8px y) |
| reveal | 480 ms | pipeline step reveal, chart line draw |
Stagger lists at 40 ms per item, max 8 items staggered (rest appear together). Numbers count up in 600 ms on first view only. Exit = 60% of enter duration.
Allowed properties: `transform`, `opacity`, `filter: blur` (≤ 6px, overlays only), `clip-path`. Never animate width/height/top/left; use `layout` / FLIP from framer-motion.
Reduced motion (`useReducedMotion` + `@media (prefers-reduced-motion)`): opacity-only, 120 ms, no count-up, no stagger, no AgentCity pointer tracking.

Where motion lives (and nowhere else):
1. View change: cross-fade + 8px rise (panel).
2. Sidebar active pill: shared `layoutId` slide (state).
3. Lists/tables: first-render stagger; inserted rows slide in, removed rows collapse via `AnimatePresence`.
4. KPI numbers count up; chart lines draw on mount.
5. Pipeline monitor: steps light up in order, connector line fills, durations tick; AgentCity agents walk routes.
6. Palette, drawer, toasts: scale .98→1 + fade, toasts stack and slide.
7. PDF dropzone: border breathes on drag-over, file card flies into the list, extraction progress bar.
8. Character counter: color shifts at 90% and 100%, a 1-step shake when input is blocked at the cap.

## Layout
App shell: left **sidebar** 248px (collapsible to 64px icon rail, state persisted), sticky **topbar** 56px (breadcrumb title, ⌘K search trigger, notifications bell with unread badge, theme toggle, user menu). Content max-width 1320px, 24px gutters, 16px on mobile. Under 1024px the sidebar becomes an off-canvas sheet.
Navigation (Spanish labels): Resumen, Bandeja, Agente, Propuestas, Precios, Clientes, Catálogo, Tarifas.
URL hash keeps the current view (`#/propuestas`) so refresh and back button work.

## Components (inventory)
`Button` (primary/secondary/ghost/danger, sm/md, loading state with spinner replacing icon, never width jump), `IconButton`, `Input`/`Textarea`/`Select` via `LimitedInput`/`LimitedTextarea` (counter), `Field` (label, hint, error), `Badge`/`StatusBadge`, `Panel` (no nested panels), `Table` (sticky header, row hover, empty row), `Tabs` (sliding indicator), `Drawer` (right, 420px), `CommandPalette` (`cmdk`), `Toaster` (`sonner`, themed), `Skeleton` (shimmer, used instead of spinners in content), `EmptyState` (teaches the next action, one CTA), `KpiTile` (no hero-metric template: label, value, delta, sparkline), `Dropzone`, `ConfirmButton` (hold-to-confirm for destructive deletes).
Every interactive component ships default, hover, focus-visible (2px `--accent` ring, 2px offset), active, disabled, loading, error.

## Copy
UI in Spanish (Colombia), code in English. Short labels, verbs on buttons ("Procesar brief", "Aprobar", "Enviar al cliente"). No em dashes in UI copy. Errors say what happened and what to do.

## Character limits (`src/limits.js`, mirror backend)
| Field | Max |
|---|---|
| Brief text (typed) | 5000 |
| Email subject, project type | 150 |
| PDF note | 1000 |
| Question answer | 2000 |
| Client name, company, agency name, owner name | 120 |
| Email | 255 |
| Catalog / requirement / role name | 120 |
| Descriptions | 1000 |
| Password | 8..100 |
| Search (palette) | 80 |
Counter visible from 70% of the limit (always visible on the brief textarea), warning at 90%, danger at 100%; `maxLength` enforces the cap; pasted overflow is cut and a toast says how many characters were dropped.
