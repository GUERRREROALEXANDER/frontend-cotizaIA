import test from "node:test";
import assert from "node:assert/strict";
import {
  agentStages,
  executionDurationMs,
  formatDuration,
  isFlagged,
  normalizeHandler,
  stepsByHandler,
} from "../../src/components/pipeline/stages.js";

test("the seven stages follow the backend order", () => {
  assert.deepEqual(
    agentStages.map((stage) => stage.handler),
    ["Classify", "Extract", "Estimate", "Price", "AmbiguityCheck", "Generate", "Compose"],
  );
});

test("normalizeHandler drops the Handler suffix and blanks", () => {
  assert.equal(normalizeHandler("ClassifyHandler"), "Classify");
  assert.equal(normalizeHandler("  Price "), "Price");
  assert.equal(normalizeHandler(null), "");
  assert.equal(normalizeHandler(undefined), "");
});

test("stepsByHandler indexes case-insensitively and keeps the first match", () => {
  const first = { handler: "EstimateHandler", status: "SUCCEEDED" };
  const map = stepsByHandler([first, { handler: "estimate", status: "FAILED" }, { handler: "" }, null]);
  assert.equal(map.get("estimate"), first);
  assert.equal(map.size, 1);
});

test("stepsByHandler accepts a missing list", () => {
  assert.equal(stepsByHandler(undefined).size, 0);
});

test("isFlagged looks for the [FLAG] marker in the summary", () => {
  assert.equal(isFlagged({ outputSummary: "2 preguntas [FLAG]" }), true);
  assert.equal(isFlagged({ outputSummary: "sin dudas" }), false);
  assert.equal(isFlagged(null), false);
});

test("formatDuration picks ms, seconds or minutes", () => {
  assert.equal(formatDuration(250), "250 ms");
  assert.equal(formatDuration(1500), "1.5 s");
  assert.equal(formatDuration(125_000), "2 min 5 s");
});

test("formatDuration rejects negative or non-numeric input", () => {
  assert.equal(formatDuration(-1), null);
  assert.equal(formatDuration("abc"), null);
  assert.equal(formatDuration(Infinity), null);
});

test("executionDurationMs prefers the wall clock", () => {
  const execution = {
    startedAt: "2026-11-20T10:00:00Z",
    finishedAt: "2026-11-20T10:00:04Z",
    steps: [{ durationMs: 999_999 }],
  };
  assert.equal(executionDurationMs(execution), 4000);
});

test("executionDurationMs falls back to the sum of the steps", () => {
  assert.equal(executionDurationMs({ steps: [{ durationMs: 100 }, { durationMs: "50" }, {}] }), 150);
  assert.equal(executionDurationMs({ startedAt: "2026-11-20T10:00:05Z", finishedAt: "2026-11-20T10:00:00Z", steps: [] }), null);
  assert.equal(executionDurationMs(null), null);
});
