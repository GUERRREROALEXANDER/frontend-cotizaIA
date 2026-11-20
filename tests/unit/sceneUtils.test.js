import test from "node:test";
import assert from "node:assert/strict";
import {
  HANDLERS,
  blinkScale,
  easeInCubic,
  easeOutCubic,
  handlerStates,
  normalizeHandler,
  smoothstep,
} from "../../src/components/agent3d/sceneUtils.js";

test("the 3D scene uses the same seven handlers as the stepper", () => {
  assert.equal(HANDLERS.length, 7);
  assert.equal(HANDLERS[0], "Classify");
  assert.equal(HANDLERS.at(-1), "Compose");
});

test("normalizeHandler capitalizes and drops the suffix", () => {
  assert.equal(normalizeHandler("priceHandler"), "Price");
  assert.equal(normalizeHandler("AmbiguityCheckHandler"), "AmbiguityCheck");
  assert.equal(normalizeHandler(""), "");
});

test("handlerStates maps every backend status family", () => {
  const states = handlerStates([
    { handler: "ClassifyHandler", status: "SUCCEEDED" },
    { handler: "Extract", status: "error" },
    { handlerName: "Estimate", status: "IN_PROGRESS" },
    { handler: "Price", status: "CANCELLED" },
  ]);
  assert.deepEqual(states, ["succeeded", "failed", "running", "skipped", "pending", "pending", "pending"]);
});

test("while processing, the first pending step shows as running", () => {
  const states = handlerStates([{ handler: "Classify", status: "SUCCEEDED" }], true);
  assert.equal(states[1], "running");
  assert.equal(states.filter((state) => state === "running").length, 1);
});

test("an already running step is not duplicated while processing", () => {
  const states = handlerStates([{ handler: "Extract", status: "RUNNING" }], true);
  assert.deepEqual(states.slice(0, 3), ["pending", "running", "pending"]);
});

test("handlerStates tolerates bad input", () => {
  assert.deepEqual(handlerStates(null), Array(7).fill("pending"));
  assert.deepEqual(handlerStates([null, undefined]), Array(7).fill("pending"));
});

test("easing curves stay within 0..1 and hit the ends", () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.equal(easeInCubic(2), 1);
  assert.equal(easeInCubic(-1), 0);
  assert.ok(easeOutCubic(0.5) > easeInCubic(0.5));
});

test("smoothstep clamps outside the edges", () => {
  assert.equal(smoothstep(0, 1, -5), 0);
  assert.equal(smoothstep(0, 1, 5), 1);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
});

test("blinkScale only blinks when animation is on", () => {
  assert.equal(blinkScale(10, false), 1);
  for (let time = 0; time < 8; time += 0.01) {
    const scale = blinkScale(time, true);
    assert.ok(scale > 0 && scale <= 1);
  }
});
