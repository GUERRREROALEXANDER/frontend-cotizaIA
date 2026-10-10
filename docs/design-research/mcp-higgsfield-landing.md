# mcp-higgsfield-landing (https://github.com/midudev/mcp-higgsfield-landing)

## What it is (stack, 2-3 lines)

A single-page marketing landing for Arko, a nikkei restaurant in Barcelona: a scroll-scrubbed video "walk" through the venue plus the usual sections (menu, prices, press, FAQ, gift card). Stack is **Astro 7 + Tailwind CSS 4 + GSAP ScrollTrigger + Lenis + Cloudflare Workers** (`package.json`: `astro ^7.3.5`, `tailwindcss ^4.3.3`, `gsap ^3.15.0`, `lenis ^1.3.26`). Live demo: https://arko-sushi.midudev.workers.dev (fetched; content matches the repo).

Note: Tailwind 4 is configured the same way CotizaIA does it — via `@theme` in `src/styles/global.css`, no `tailwind.config.js`. There is **no light theme**: the site is dark-only (`color-scheme: dark`, one warm palette), so its tokens are a starting palette, not a ready dark/light system.

## Free or paid (license)

No `LICENSE` file exists in the repo tree (checked via the GitHub git/trees API), so the code is **all-rights-reserved by default** — do not copy files verbatim into CotizaIA; borrow ideas/patterns. Fonts are free: Hina Mincho and Zen Kaku Gothic New under **SIL OFL** (license text in `src/assets/fonts/*-OFL.txt`). Video assets are © Arko Restaurant.

## Steal for CotizaIA

- **Three-token warm palette**: `--color-bg: #131209` (near-black with a green-warm cast, not pure black), `--color-crema: #f3eadb` (off-white text), `--color-teja: #d0703a` (terracotta accent for links, labels, primary CTA, focus rings, selection). Map these to CotizaIA's CSS vars and flip them per theme (`src/styles/global.css`).
- **One easing curve for everything**: `--ease-fluid: cubic-bezier(0.32, 0.72, 0, 1)` used by buttons, reveals, nav, accordion, menu — a single confident curve beats a zoo of easings. Durations cluster at **700ms** (UI state changes) and **1000ms** (content reveals) (`src/styles/global.css`).
- **Scroll reveal recipe**: initial `opacity: 0; translateY(4rem); filter: blur(12px)` → `.is-in` resets all three, `transition: opacity/transform/filter 1000ms var(--ease-fluid)`, staggered per item with inline `style="--d:${i * 80}ms"` and `transition-delay: var(--d, 0ms)`. Trigger is an IntersectionObserver with `rootMargin: '0px 0px -10% 0px'`, unobserving after fire — no scroll listeners (`src/styles/global.css` + `src/scripts/motion.ts`, usage in `src/components/Dishes.astro`, `src/components/Experiences.astro`).
- **Pill button system**: `min-height: 40px; border-radius: 9999px; gap: 8px; font-weight: 500`, `transition: background-color/color/transform 700ms var(--ease-fluid)`, hover `transform: scale(1.02)`, active `scale(0.98)`. Primary = accent bg + `--color-bg` text; ghost = `inset 0 0 0 1px color-mix(in oklab, var(--color-crema) 30%, transparent)` hairline that fills on hover (`src/styles/global.css`).
- **Card style for pricing/stat cards**: `rounded-3xl p-6 lg:p-8 ring-1 ring-crema/15` (featured card swaps to `ring-teja/60`), plus smaller glass cards `rounded-2xl bg-bg/40 p-4 ring-1 ring-crema/15 backdrop-blur-md`. Badges float above the card edge: `absolute -top-3 left-6 rounded-full bg-teja px-3 py-1 text-xs font-medium text-bg` (`src/components/Experiences.astro`, `src/components/ScrollWorld.astro`).
- **Floating glass header**: pill container `rounded-full bg-bg/60 p-2 pl-6 ring-1 ring-crema/10 backdrop-blur-xl` inside a `pointer-events-none` fixed bar, with a **sliding indicator pill** driven by CSS vars `--x`/`--w` transitioning `translate` + `width` + `opacity` at `700ms var(--ease-fluid)`; the indicator appears "in place" (`data-instant` fades only) when it was hidden, so it never slides from x=0 (`src/components/Header.astro`).
- **Word-by-word lit headline**: words start at `color: color-mix(in oklab, var(--color-crema) 30%, transparent)` and switch to full crema with `transition: color 700ms var(--ease-fluid)`; GSAP ScrollTrigger `onUpdate` toggles `is-lit` on the first `Math.round(progress * words.length)` words (`src/components/Tagline.astro` + `src/scripts/motion.ts`). Works fine with framer-motion `useScroll` instead of GSAP.
- **Micro keyframe**: scroll-hint line — a 1px column with `::after` running `@keyframes hint { from { transform: translateY(-100%) } to { transform: translateY(100%) } }`, `animation: hint 2400ms var(--ease-fluid) infinite`, killed under `prefers-reduced-motion` (`src/components/ScrollWorld.astro`).
- **Zero-JS accordion**: `interpolate-size: allow-keywords` on `:root` plus `.faq::details-content { block-size: 0; overflow-y: clip; transition: block-size 700ms var(--ease-fluid), content-visibility 700ms allow-discrete }` → `[open] { block-size: auto }`, with the +/× icon as `transform: rotate(45deg)` at 700ms (`src/styles/global.css`).
- **Text-legibility veils over media/backgrounds**: stacked gradient overlays `bg-linear-to-b from-bg/60 to-transparent` (top), `from-bg from-15% via-bg/50 via-50% to-transparent to-80%` (bottom) and a desktop side variant `lg:bg-linear-to-r lg:from-bg/90 lg:via-bg/40 lg:via-35%` — a reusable recipe for keeping copy readable over imagery or gradients (`src/components/ScrollWorld.astro`).
- **Polish utilities**: `::selection { background: var(--color-teja); color: var(--color-bg) }`, `:focus-visible { outline: 2px solid var(--color-teja); outline-offset: 4px }`, `text-trim` (`text-box: trim-both cap alphabetic`) for optically centered button labels, `text-wrap: balance` on headings / `pretty` on body, `font-synthesis: none` + antialiasing (`src/styles/global.css`).
- **Reduced-motion contract**: one `matchMedia('(prefers-reduced-motion: reduce)')` flag gates Lenis, GSAP tweens, video scrub and spiral drawing; CSS falls back to `transition: opacity 400ms var(--ease-fluid)` only (`src/scripts/motion.ts`, `src/scripts/world.ts`, `src/styles/global.css`). Copy this gate verbatim for framer-motion (`useReducedMotion`).

## Code snippets

Exact snippets copied from the repo (4 max).

1. Design tokens + easing — `src/styles/global.css`:

```css
@theme {
  --color-bg: #131209;
  --color-crema: #f3eadb;
  --color-teja: #d0703a;
  --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);
}
```

2. Reveal transition (the signature entrance) — `src/styles/global.css`:

```css
/* Entrada al hacer scroll: sube, enfoca y aparece. */
.js [data-reveal] {
  opacity: 0;
  transform: translateY(4rem);
  filter: blur(12px);
  transition:
    opacity 1000ms var(--ease-fluid),
    transform 1000ms var(--ease-fluid),
    filter 1000ms var(--ease-fluid);
  transition-delay: var(--d, 0ms);
}

.js [data-reveal].is-in {
  opacity: 1;
  transform: none;
  filter: none;
}
```

3. Reveal trigger (IntersectionObserver, stagger via `--d`) — `src/scripts/motion.ts`:

```ts
// Entradas al hacer scroll: IntersectionObserver, nunca un listener de scroll.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      reveal.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));
```

4. Animated component pattern: sliding nav pill + staggered mobile menu — `src/components/Header.astro`:

```css
/* Píldora que se desliza hasta la sección activa. */
.nav-indicator {
  width: var(--w, 0);
  translate: var(--x, 0) 0;
  opacity: 0;
  transition:
    translate 700ms var(--ease-fluid),
    width 700ms var(--ease-fluid),
    opacity 700ms var(--ease-fluid);
}

.nav-indicator[data-visible] {
  opacity: 1;
}

.menu-item {
  opacity: 0;
  transform: translateY(3rem);
  transition:
    opacity 700ms var(--ease-fluid),
    transform 700ms var(--ease-fluid);
}

.menu[data-open] .menu-item {
  opacity: 1;
  transform: none;
  transition-delay: calc(100ms + var(--i, 0) * 50ms);
}
```

## Skip

- **The scroll-scrubbed fullscreen video world** (`src/scripts/world.ts`, `src/components/ScrollWorld.astro`, `public/video/*.mp4`, ffmpeg GOP-6 encoding pipeline): a landing showpiece, useless and heavy for a dashboard where users need to read and click.
- **Marketing/SEO scaffolding**: JSON-LD schema graph, sitemap/robots/llms.txt, Open Graph + Twitter cards, press quotes, gift-card and reservation CTAs (`src/data/schema.ts`, `src/pages/*`, `src/data/arko.ts`) — not part of an app shell.
- **Restaurant-only type pairing**: Hina Mincho (display serif) + Zen Kaku Gothic New (body) is brand-specific to a Japanese restaurant; for CotizaIA pick a SaaS-appropriate pair but keep the same mechanism (one `--font-display` for headings/numerals, one `--font-sans` for UI) declared in `@theme` (`src/styles/global.css`).
