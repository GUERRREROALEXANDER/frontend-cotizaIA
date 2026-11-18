import test from "node:test";
import assert from "node:assert/strict";
import { progressToStage } from "../../src/views/progressToStage.js";

const stages = ["uno", "dos", "tres", "cuatro", "cinco"];
const steps = (...statuses) => statuses.map((status, index) => ({ name: `paso-${index + 1}`, status }));

test("no steps yet starts at the first rung", () => {
  assert.equal(progressToStage([], stages), 0);
  assert.equal(progressToStage(null, stages), 0);
  assert.equal(progressToStage(undefined, stages), 0);
});

test("each succeeded step advances one rung", () => {
  assert.equal(progressToStage(steps("SUCCEEDED"), stages), 1);
  assert.equal(progressToStage(steps("SUCCEEDED", "SUCCEEDED"), stages), 2);
  assert.equal(progressToStage(steps("SUCCEEDED", "SUCCEEDED", "SUCCEEDED"), stages), 3);
});

test("a running step after the finished ones does not add a rung", () => {
  assert.equal(progressToStage([...steps("SUCCEEDED"), { name: "paso-2", status: "RUNNING" }], stages), 1);
});

test("a failed step pins the ladder to the rung that failed", () => {
  assert.equal(progressToStage([...steps("SUCCEEDED", "SUCCEEDED"), { name: "paso-3", status: "FAILED" }], stages), 2);
  assert.equal(progressToStage([{ name: "paso-1", status: "FAILED" }], stages), 0);
});

test("a finished run stops at the last rung", () => {
  const done = steps("SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED");
  assert.equal(progressToStage(done, stages), stages.length - 1);
});

test("status casing and missing stages are tolerated", () => {
  assert.equal(progressToStage([{ name: "a", status: "succeeded" }, { name: "b", status: "succeeded" }], stages), 2);
  assert.equal(progressToStage(steps("SUCCEEDED"), []), 0);
  assert.equal(progressToStage(steps("SUCCEEDED"), undefined), 0);
});
