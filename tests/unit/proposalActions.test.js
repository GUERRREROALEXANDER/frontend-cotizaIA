import test from "node:test";
import assert from "node:assert/strict";
import { availableActions } from "../../src/components/proposals/proposalActions.js";

const ids = (detail) => availableActions(detail).map((action) => action.action);

test("IN_REVIEW and not yet approved offers approve only", () => {
  assert.deepEqual(ids({ status: "IN_REVIEW", approvedAt: null, allowedTransitions: ["SENT"] }), ["approve"]);
});

test("IN_REVIEW and approved offers send only (backend never sets an APPROVED status)", () => {
  assert.deepEqual(ids({ status: "IN_REVIEW", approvedAt: "2026-11-18T10:00:00Z", allowedTransitions: ["SENT"] }), ["send"]);
});

test("approved but SENT not allowed offers nothing", () => {
  assert.deepEqual(ids({ status: "IN_REVIEW", approvedAt: "2026-11-18T10:00:00Z", allowedTransitions: [] }), []);
});

for (const status of ["QUOTED", "ANALYZING", "RECEIVED", "CONTRACT_ISSUED", "REJECTED", "EXPIRED"]) {
  test(`${status} with no allowed transitions offers nothing`, () => {
    assert.deepEqual(ids({ status, approvedAt: "2026-11-18T10:00:00Z", allowedTransitions: [] }), []);
  });
}

test("SENT offers accept first, then negotiate, reject, expire (never approve/send)", () => {
  assert.deepEqual(
    ids({ status: "SENT", approvedAt: "x", allowedTransitions: ["EXPIRED", "REJECTED", "NEGOTIATING", "ACCEPTED"] }),
    ["accept", "negotiate", "reject", "expire", "viewed"],
  );
});

test("NEGOTIATING only offers what the backend allows", () => {
  assert.deepEqual(
    ids({ status: "NEGOTIATING", approvedAt: "x", allowedTransitions: ["ACCEPTED", "REJECTED"] }),
    ["accept", "reject", "viewed"],
  );
});

test("viewed is offered last and only while the client has not seen the proposal", () => {
  const transitions = availableActions({
    status: "SENT",
    approvedAt: "x",
    viewedAt: null,
    allowedTransitions: ["ACCEPTED"],
  });
  assert.deepEqual(transitions.at(-1), { action: "viewed", label: "Marcar como vista" });
  assert.deepEqual(
    ids({ status: "SENT", approvedAt: "x", viewedAt: "2026-11-18T10:00:00Z", allowedTransitions: ["ACCEPTED"] }),
    ["accept"],
  );
  assert.deepEqual(
    ids({ status: "NEGOTIATING", approvedAt: "x", viewedAt: "2026-11-18T10:00:00Z", allowedTransitions: [] }),
    [],
  );
});

test("viewed is never offered before send or after acceptance", () => {
  for (const status of ["IN_REVIEW", "QUOTED", "ACCEPTED", "CONTRACT_ISSUED"]) {
    assert.ok(!ids({ status, approvedAt: null, viewedAt: null, allowedTransitions: ["ACCEPTED"] }).includes("viewed"));
  }
});

test("unknown target statuses are ignored", () => {
  assert.deepEqual(
    ids({ status: "SENT", approvedAt: "x", viewedAt: "2026-11-18T10:00:00Z", allowedTransitions: ["WHATEVER"] }),
    [],
  );
});

test("every action has a label and an action key", () => {
  for (const action of availableActions({ status: "IN_REVIEW", approvedAt: null, allowedTransitions: [] })) {
    assert.ok(action.label && action.action);
  }
});

test("missing detail offers nothing", () => {
  assert.deepEqual(availableActions(null), []);
  assert.deepEqual(availableActions(undefined), []);
});
