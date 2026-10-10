# Skillry (https://skillry.dev/ai-videos/opus-5-5)

## What it is (2-3 lines)
Gallery of 513 AI-generated videos created with Claude Opus 5.5 + code-based video tools (Remotion, HyperFrames, three.js, GSAP). Each entry shows the original video, the exact prompt used, and a side-by-side remake. Focus: motion graphics, explainers, 3D scenes, interactive demos — not dashboard UI components.

## Free or paid (what is free, license if stated)
Free: All 513 prompts are free to read and copy (no account needed). Premium: Skillry subscription ($9.99/mo, $79/yr, $169 lifetime) unlocks "Skills" — pre-packaged agent prompts for video, slides, web, images. Skills install into Claude Code, Cursor, Codex, etc.

## Steal for CotizaIA (5-10 bullets: concrete, named pieces usable in a dashboard: nav/sidebar, KPI cards, tables, empty states, CTAs, forms, toasts, command palettes, motion recipes with durations/easings if given. Each bullet with a direct URL when one exists)
- **Velocity-Matched UI Sting** (free Skill) — 624 installs. Entry/exit animation that matches scroll velocity, 200-300ms spring. Install: `skillry add bs-hyperframes-velocity-sting`. URL: https://skillry.dev/skills/bs-hyperframes-velocity-sting
- **CreatorMotion · Title Scene Takeover** (free Skill) — 512 installs. Kinetic typography entrance with staggered word reveal, 0.8s duration. Install: `skillry add bs-creatormotion-type-title-takeover`. URL: https://skillry.dev/skills/bs-creatormotion-type-title-takeover
- **CreatorMotion · Synchronized Action Checklist** (free Skill) — 320 installs. Checklist items animate in sequence with checkmark draw (SVG stroke-dashoffset), 150ms stagger. Install: `skillry add bs-creatormotion-cards-action-checklist`. URL: https://skillry.dev/skills/bs-creatormotion-cards-action-checklist
- **Manus 2.0 Style Launch Video** (paid Skill) — 161 installs. Multi-scene layout with glassmorphism cards, orbital camera, particle bursts. Not directly usable but shows premium motion language. URL: https://skillry.dev/skills/bs-manus2-0-style-launch-video
- **Living-Halftone Canvas Film** (free Skill) — Halftone shader transition between scenes, canvas-based, performant. URL: https://skillry.dev/skills/bs-hyperframes-halftone-canvas-launch
- **Remotion + GSAP patterns** — Many videos use `SVG` + `GSAP` + `Canvas` stack: staggered path drawing (DrawSVG), FLIP transitions, scroll-linked timelines. Search category "Motion graphics" for 317 examples.
- **HyperFrames Studio workflow** — Several creators mention "HyperFrames Studio" for drag-and-drop timeline editing → code export. Relevant if adopting HyperFrames for dashboard motion prototyping.

## Code or install snippets (only if the site shows copyable code or an npm package; paste the exact snippet, max 3)
```bash
# Install Skillry CLI and add a free motion skill
npx skillry add bs-hyperframes-velocity-sting
```

```bash
# Add CreatorMotion title takeover skill
npx skillry add bs-creatormotion-type-title-takeover
```

```bash
# Add synchronized action checklist skill
npx skillry add bs-creatormotion-cards-action-checklist
```

## Skip (what does not fit a dashboard, 1-3 bullets)
- Video generation / export workflows (Remotion, ffmpeg, MP4 output) — CotizaIA is a web dashboard, not a video renderer.
- 3D/WebGL heavy scenes (three.js, GLSL shaders, particle systems) — overkill for dashboard motion; performance cost.
- Full launch video templates (Manus 2.0 style) — marketing assets, not product UI patterns.
- Music/sound synthesis via Python — not applicable to silent dashboard interactions.