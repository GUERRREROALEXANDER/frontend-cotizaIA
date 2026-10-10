# Motion (https://motion.dev/)

## What it is
Production-grade animation library for React (formerly Framer Motion), 14.0.0 released Oct 2026. MIT-licensed, tiny footprint (APIs up to 90% smaller than GSAP). Provides layout animations, AnimatePresence, spring physics, stagger variants, scroll-linked motion via ScrollTimeline, and motion values via useMotionValue.

## Free or paid
Completely free under the MIT license. Open source, trusted by Framer and Figma across hundreds of thousands of sites. Motion+ offers premium AI Kit and 490+ examples, but the core library is free.

## Steal for CotizaIA
- Layout animation between dashboards states (motion.dev/docs/react-layout-animations) — animate `layout` prop when KPI cards reflow
- AnimatePresence with exit animations for removed table rows (motion.dev/docs/react-animate-presence) — `exit="fade"` or `exit="slide"`
- Spring physics on hover interactions (motion.dev/docs/react-transitions) — `type="spring"` with `bounce` for KPI card lift
- Stagger variants for table row entries (motion.dev/docs/react-animation) — `stagger(0.04)` with `transition` timing
- useInView for scroll-triggered KPI reveals (motion.dev/docs/react-gestures) — `whileInView` with offset
- Reduced motion media query support via `reducedMotion` prop
- Timeline sequences for multi-step onboarding wizards

## Code or install snippets
- `npm install motion` — then import `{ motion, AnimatePresence, useMotionValue }` from `motion`
- `<motion.div layout={true} animate={{ x: 0, opacity: 1 }} variants={fade} />`
- `useMotionValue("x")` — drives real-time derived state without re-renders

## Skip
- Motion Studio (paid visual editor, not a UI component library)
- AI Kit (agent-facing, not direct dashboard UI)
- Three.js particle morph examples (overkill for dashboard)