import test from "node:test";
import assert from "node:assert/strict";
import { statusLabel, statusLabels } from "../../src/statusLabels.js";

const PROPOSAL_STATES = [
  "RECEIVED",
  "ANALYZING",
  "QUOTED",
  "IN_REVIEW",
  "SENT",
  "NEGOTIATING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONTRACT_ISSUED",
];

test("the ten proposal states of the backend State pattern have a label", () => {
  for (const state of PROPOSAL_STATES) assert.ok(statusLabels[state], `${state} has no label`);
});

test("statusLabel ignores case and surrounding blanks", () => {
  assert.equal(statusLabel("sent"), "Enviada");
  assert.equal(statusLabel("  in_review "), "Por revisar");
});

test("unknown statuses stay readable", () => {
  assert.equal(statusLabel("WAITING_FOR_CLIENT"), "waiting for client");
});

test("empty input gives an empty label instead of crashing", () => {
  assert.equal(statusLabel(undefined), "");
  assert.equal(statusLabel(null), "");
  assert.equal(statusLabel(""), "");
});

test("the label table cannot be changed at runtime", () => {
  assert.ok(Object.isFrozen(statusLabels));
});
