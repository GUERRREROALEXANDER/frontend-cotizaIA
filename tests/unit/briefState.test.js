import test from "node:test";
import assert from "node:assert/strict";
import { canRetryProcessing } from "../../src/views/briefState.js";

test("brief with no proposal can be retried", () => {
  assert.equal(canRetryProcessing({ id: 1, proposalId: null, proposalStatus: null }), true);
});

test("brief stuck RECEIVED or ANALYZING can be retried", () => {
  assert.equal(canRetryProcessing({ id: 1, proposalId: 3, proposalStatus: "ANALYZING" }), true);
  assert.equal(canRetryProcessing({ id: 1, proposalId: 3, proposalStatus: "RECEIVED" }), true);
});

test("brief with a quoted or later proposal cannot be retried", () => {
  for (const proposalStatus of ["QUOTED", "IN_REVIEW", "SENT", "ACCEPTED", "REJECTED"]) {
    assert.equal(canRetryProcessing({ id: 1, proposalId: 3, proposalStatus }), false);
  }
});

test("missing brief cannot be retried", () => {
  assert.equal(canRetryProcessing(null), false);
});
