# Motion Audit — CotizaIA

## Skills applied

| Skill | What it checks | Applicable | Why |
|-------|----------------|------------|-----|
| animation-systems | Durations, easing, choreography, performance (transform/opacity only), reduced-motion support, stagger caps, exit<enter | Yes | Project uses Framer Motion throughout; DESIGN.md §Motion is the contract |
| animation-principles | Easing direction, duration tiers, purposeful motion, staging, interruptibility | Yes | Validates core principles against every framer-motion usage |
| emilkowal-animations | 58 rules: easing selection (custom cubic-bezier), timing ≤300ms, transform/opacity only, scale(0.97) press, touch-hover gating, spring config, reduced-motion opacity fallback, toast stacking, scroll-reveal thresholds | Yes | Primary implementation library is Framer Motion; references cover all patterns in code |
| masked-reveal | Word-by-word masked reveal on scroll for headlines/editorial text; reduced-motion fallback; GSAP ScrollTrigger pattern | Yes | Dashboard greeting and empty-state titles are candidate locations (max 1–2) |
| loading-states | Skeleton over spinners in content, shimmer respects reduced-motion, progressive reveal, no layout shift | Yes | Multiple views show loading; DashboardSkeleton exists but some spinners remain |

---

## Findings

| ID | Severity | file:line | Problem | Skill rule | Exact fix |
|----|----------|-----------|---------|------------|-----------|
| M1 | P0 | src/components/shell/Sidebar.jsx:74 | Desktop sidebar animates `width: collapsed ? 64 : 248` — triggers layout reflows, violates DESIGN.md “Never animate width/height/top/left; use layout / FLIP” | animation-systems (Performance rules), emilkowal-animations `props-transform-opacity` | Replace with `layout` + `width` CSS transition on parent, or animate `transform: translateX` on a fixed-width rail; keep `layoutId` pill working via `LayoutGroup` |
| M2 | P0 | src/components/AgentCity.jsx:213-221 | Three SVG `<animateMotion>` elements run infinite loops; they ignore `prefers-reduced-motion` and the `prefersReducedMotion` guard | animation-systems (Accessibility), emilkowal-animations `polish-reduced-motion` | Move agent paths to Framer Motion `motion.path` with `animate={{ pathLength: [0,1] }}` and `useReducedMotion` gate, or wrap SVG in `<motion.svg>` and control via `reduce ? {} : { animate: … }` |
| M3 | P1 | src/App.jsx:187 | Loading screen Sparkles uses `className="animate-pulse"` — continuous CSS animation not gated by reduced motion | animation-systems (Accessibility), emilkowal-animations `polish-reduced-motion` | Change to `className="motion-safe:animate-pulse"` or use `<motion.span animate={{ opacity: [1,0.4,1] }} transition={{ duration: 1.5, repeat: Infinity }} />` with `useReducedMotion` |
| M4 | P2 | src/components/AgentCity.jsx:253-259 | Neighborhood buttons have `whileHover={{ y: -2 }}` and `whileTap={{ scale: 0.98 }}` without touch gating — fires on touch devices | emilkowal-animations `interact-touch-hover` | `whileHover={prefersReducedMotion || 'touch' ? undefined : { y: -2 }}` and same for `whileTap` (or use `whileHover={prefersReducedMotion ? undefined : { y: -2 }}` plus `@media (hover: hover)` CSS fallback) |
| M5 | P2 | src/components/proposals/ProposalCard.jsx:11 | `transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}` hardcoded; matches `duration.panel` + `ease.fluid` but bypasses preset | animation-systems (Motion primitives), emilkowal-animations `ease-custom-curves` | `transition={{ duration: duration.panel, ease: ease.fluid }}` (import from presets) |
| M6 | P2 | src/components/proposals/ProposalTable.jsx:78 | Row `transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}` hardcoded; should use `duration.state` + `ease.out` | animation-systems, emilkowal-animations `ease-custom-curves` | `transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}` |
| M7 | P2 | src/views/PricingView.jsx:159 | Pricing model active indicator `transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}` hardcoded; matches panel preset | animation-systems | `transition={{ duration: duration.panel, ease: ease.fluid }}` |
| M8 | P2 | src/components/pipeline/StageStepper.jsx:79-81 | Current-step pulse ring `transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}` — custom spring not in presets | animation-systems, emilkowal-animations `ease-spring-config` | Define `pulseRing` in presets.js (duration: 1.4, ease: ease.out, repeat: Infinity) or use `duration.reveal` with spring config; gate with `reduce` |
| M9 | P2 | src/components/settings/FormPanel.jsx:12 | Form panel `transition={{ duration: 0.2 }}` hardcoded; should be `duration.state` | animation-systems | `transition={{ duration: duration.state, ease: ease.out }}` |
| M10 | P2 | src/views/ProposalsView.jsx:162-167 | Mode-indicator `motion.div` has no `transition` prop; relies on CSS `transition-transform duration-200 ease-fluid` which Framer ignores | animation-systems, emilkowal-animations `ease-custom-curves` | Add `transition={{ duration: duration.state, ease: ease.fluid }}` to the `motion.div` |
| M11 | P2 | src/views/ProposalsView.jsx:174-181 | Error toast `initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}` missing duration/ease; should use `reducedFade` or `viewTransition` | animation-systems | Wrap in `<motion.div {...(reduceMotion ? reducedFade : viewTransition)}>` or explicit `transition={{ duration: duration.state, ease: ease.out }}` |
| M12 | P2 | src/views/PricingView.jsx:116-133 | Error/success messages same as M11 — hardcoded transitions without presets | animation-systems | Same fix: use `reducedFade`/`viewTransition` with `useReducedMotion` |
| M13 | P2 | src/components/ui.jsx:74-80 | `IconButton` has no pressed-state feedback (no `whileTap` scale) — only CSS color transition | emilkowal-animations `transform-scale-097`, animation-systems (micro 120ms) | Convert to `motion.button` with `whileTap={reduce ? undefined : { scale: 0.97 }} transition={{ duration: duration.micro, ease: ease.out }}` |
| M14 | P2 | src/components/AgentCity.jsx:63-64 | Pointer tilt uses `useSpring(…, { stiffness: 180, damping: 24 })` — custom spring not in presets | emilkowal-animations `ease-spring-config`, animation-systems | Add `spring.pointer = { stiffness: 180, damping: 24 }` to presets and reference it |
| M15 | P2 | src/index.css:89-94 | `.limit-shake` keyframes use hardcoded `180ms` — not in presets (closest `duration.micro=120ms`) | animation-systems | Change to `animation: limit-shake var(--dur-micro) var(--ease-out)` and add `--dur-micro: 120ms` to tokens.css |
| M16 | P3 | src/views/DashboardView.jsx:35 | Greeting `title={greetingForHour()}` is static — candidate for masked-reveal word-by-word on first view | masked-reveal (Taste Rules: short headlines) | Wrap greeting in `<MaskedReveal>` component (GSAP ScrollTrigger) or Framer Motion stagger variant; gate with `motion-safe` |
| M17 | P3 | src/components/settings/HoldToConfirm.jsx:80 | Fill bar `transition={holding ? { duration: HOLD_MS/1000, ease: "linear" } : { duration: duration.state, ease: ease.out }}` — mixes preset and hardcoded | animation-systems | Keep linear for fill (correct), but define `duration.hold = HOLD_MS/1000` in presets for consistency |
| M18 | P3 | src/components/dashboard/DashboardCharts.jsx:56,117 | Recharts `animationDuration={480}` hardcoded; matches `duration.reveal` but not referenced | animation-systems | Import `duration.reveal` and use `animationDuration={duration.reveal * 1000}` (recharts expects ms) |
| M19 | P3 | src/views/DashboardView.jsx:86-96, src/views/ClientsView.jsx:184-195, etc. | EmptyState components render static — no entrance animation (fadeUp) to signal “content arrived” | animation-systems (Choreography), loading-states (Progressive Loading) | Wrap EmptyState content in `<FadeUp delay={0.1}>` or add `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` to the root |
| M20 | P3 | src/components/proposals/ProposalDetailPanel.jsx:144,190,230,269 | Section reveals use hardcoded `delay: 0.04/0.08/0.12/0.16` instead of `staggerDelay(index)` | animation-systems (Stagger) | Use `staggerDelay(sectionIndex)` from presets for consistent 40ms steps |

---

## Do not change (working correctly)

| Area | Why it passes |
|------|---------------|
| `src/motion/presets.js` | All tokens match DESIGN.md: ease curves, durations, stagger cap (8×40ms), exit=60% enter, reduced variants |
| `src/motion/Motion.jsx` | `FadeUp`, `StaggerItem`, `CountUp` all respect `useReducedMotion`, use presets, cap stagger |
| `src/main.jsx:9` | `MotionConfig reducedMotion="user"` — correct global setting |
| `src/index.css:111-117` | Global `@media (prefers-reduced-motion: reduce)` forces `animation-duration: .01ms`, `transition-duration: .01ms` — kills CSS loops (shimmer, limit-shake) |
| `Sidebar.jsx:26-30` | Active nav pill uses `layoutId` + `transition={{ duration: duration.state, ease: ease.fluid }}` — correct shared-element slide |
| `InboxView.jsx:351` | Brief list `StaggerItem` with `index` — capped stagger, reduced-motion aware |
| `PdfDropzone.jsx:51-53,97-100` | Drag-over scale 1.01 + file card fly-in use presets correctly |
| `CommandPalette.jsx:69-75,79-80` | Backdrop + panel use `overlay` preset; `AnimatePresence` wrapped |
| `NotificationsDrawer.jsx:123-136` | Backdrop exit faster (panel×0.6), drawer slide uses `ease.fluid` + `duration.panel` |
| `ProposalKanban.jsx:60` + `ProposalCard.jsx:7,10` | `LayoutGroup` + `layoutId` + `layout` — FLIP moves between columns work |
| `ProposalTable.jsx:70-78` | `AnimatePresence mode="popLayout"` + `layout` on rows — insert/remove animations correct |
| `StatusTimeline.jsx:13-18` | Staggered entrance with `staggerDelay`, presets used |
| `ProposalDetailPanel.jsx:49-54,82-91` | Panel slide-in `duration.panel`/`ease.fluid`, sections `duration.state`/`ease.out` — choreography correct |
| `AuthScreen.jsx:66-72` | BrandLoop `AnimatePresence` + `duration.state`/`ease.out`; reduced mode shows all cards static |
| `DashboardSkeleton.jsx` | Shimmer via CSS `.skeleton` class — killed by global reduced-motion media query |
| `Button.jsx:56-60` | `whileTap={scale:0.97}` + `duration.micro`/`ease.out` — micro feedback per DESIGN.md |