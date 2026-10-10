# dqnamo Kitchen (https://www.dqnamo.com/kitchen)

## What it is
An ongoing collection of small interface experiments, animation patterns, and component demos cooked up by dqnamo. Mix of free experiments and Pro-accessible pieces (Pro plan £192/year annual).

## Free or paid
Mix: many experiments are free to view and copy, but full access and assets require the Pro annual subscription (£192/year / £230.40 total paid). Some free experiments visible on the kitchen page without login.

## Steal for CotizaIA
- Tactile Button physical study (dqnamo.com/experiments/tactile-button) — pressed-state depth and firm edge feedback
- Hold to Confirm deliberate action pattern (dqnamo.com/experiments/hold-to-confirm) — filling bar with timed undo, great for delete confirmations
- Magnetic Drop Zone file target with drag-pull behavior (dqnamo.com/experiments/magnetic-drop-zone) — sidebar drop zone for client brief uploads
- Dynamic Button smooth label-resize animation (dqnamo.com/experiments/dynamic-button) — button grows/shrinks with text length
- Scroll Fade List compact list with overflow fade (dqnamo.com/experiments/scroll-fade-list) — KPI list with soft fade on scroll
- Playing Cards composable deck with fanned hand (dqnamo.com/experiments/playing-cards) — selectable client cards in proposal flow
- Cassette Audio Player tactile controls (dqnamo.com/experiments/cassette-player) — audio-style metaphors for sound feedback

## Code or install snippets
- Individual experiment pages embed copyable React source; no single npm package
- Key pattern: `hold-to-confirm` uses `onHold` + `setTimeout` for undo window
- `magnetic-drop-zone` uses drag velocity to pull toward target before drop

## Skip
- Receipt Printer (too specific to e-commerce checkout)
- Hold to Delete (negative action, not fitting positive dashboard workflow)
- Some experiments behind paywall with no free code export