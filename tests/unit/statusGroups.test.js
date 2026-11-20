import test from "node:test";
import assert from "node:assert/strict";
import { STATUS_GROUPS, summarizeProposals } from "../../src/components/proposals/statusGroups.js";
import { statusLabels } from "../../src/statusLabels.js";

const backendStatuses = ["RECEIVED", "ANALYZING", "QUOTED", "IN_REVIEW", "SENT", "NEGOTIATING", "ACCEPTED",
  "CONTRACT_ISSUED", "REJECTED", "EXPIRED"];

test("every backend status sits in exactly one column", () => {
  for (const status of backendStatuses) {
    const columns = STATUS_GROUPS.filter((group) => group.statuses.includes(status));
    assert.equal(columns.length, 1, status);
  }
});

test("every grouped status has a Spanish label", () => {
  for (const status of STATUS_GROUPS.flatMap((group) => group.statuses)) {
    assert.ok(statusLabels[status], status);
  }
});

test("the board has five columns in workflow order", () => {
  assert.deepEqual(STATUS_GROUPS.map((group) => group.id), ["nuevas", "por-revisar", "enviadas", "ganadas", "cerradas"]);
});

test("the summary counts each column and leaves closed deals out of the money in play", () => {
  const summary = summarizeProposals([
    { status: "IN_REVIEW", total: 1000 },
    { status: "SENT", total: "2000" },
    { status: "NEGOTIATING", total: 500 },
    { status: "ACCEPTED", total: 4000 },
    { status: "REJECTED", total: 9000 },
  ]);

  assert.deepEqual(summary, { inPlay: 7500, review: 1, sent: 2, won: 1, closed: 1 });
});

test("no proposals give an all-zero summary", () => {
  assert.deepEqual(summarizeProposals(), { inPlay: 0, review: 0, sent: 0, won: 0, closed: 0 });
});

test("proposals without total count as zero money", () => {
  assert.equal(summarizeProposals([{ status: "QUOTED" }, { status: "SENT", total: null }]).inPlay, 0);
});
