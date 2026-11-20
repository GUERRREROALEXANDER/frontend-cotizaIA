import test from "node:test";
import assert from "node:assert/strict";
import {
  duration,
  fadeUp,
  overlay,
  reducedFade,
  STAGGER_MAX_ITEMS,
  STAGGER_STEP,
  staggerDelay,
  viewTransition,
} from "../../src/motion/presets.js";

test("stagger grows per item and stops after the cap", () => {
  assert.equal(staggerDelay(0), 0);
  assert.equal(staggerDelay(2), 2 * STAGGER_STEP);
  assert.equal(staggerDelay(STAGGER_MAX_ITEMS), staggerDelay(STAGGER_MAX_ITEMS + 40));
});

test("the longest stagger stays under half a second", () => {
  assert.ok(staggerDelay(1000) < 0.5);
});

test("durations go from micro to reveal", () => {
  assert.ok(duration.micro < duration.state);
  assert.ok(duration.state < duration.panel);
  assert.ok(duration.panel < duration.reveal);
});

test("leaving a view or overlay is faster than entering it", () => {
  assert.ok(viewTransition.exit.transition.duration < viewTransition.animate.transition.duration);
  assert.ok(overlay.exit.transition.duration < overlay.animate.transition.duration);
});

test("reduced motion only fades, nothing moves or scales", () => {
  for (const step of [reducedFade.initial, reducedFade.animate, reducedFade.exit]) {
    assert.equal("y" in step, false);
    assert.equal("scale" in step, false);
  }
  assert.equal(fadeUp.show.opacity, 1);
});
