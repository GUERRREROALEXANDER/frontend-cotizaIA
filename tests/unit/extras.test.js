import test from "node:test";
import assert from "node:assert/strict";
import { EXTRA_LABELS, EXTRA_TYPES, canEditExtras, extraLabel } from "../../src/components/proposals/extras.js";

test("every extra type has a Spanish label", () => {
  for (const type of EXTRA_TYPES) assert.ok(EXTRA_LABELS[type], `${type} has no label`);
});

test("extraLabel ignores case and keeps unknown types readable", () => {
  assert.equal(extraLabel("urgency"), "Urgencia");
  assert.equal(extraLabel("DISCOUNT"), "Descuento");
  assert.equal(extraLabel("NEW_EXTRA"), "NEW_EXTRA");
  assert.equal(extraLabel(null), "");
});

test("extras are editable only while the proposal is in review and not approved", () => {
  assert.equal(canEditExtras({ status: "IN_REVIEW" }), true);
  assert.equal(canEditExtras({ status: "IN_REVIEW", approvedAt: "2026-11-20T10:00:00Z" }), false);
  assert.equal(canEditExtras({ status: "SENT" }), false);
  assert.equal(canEditExtras(null), false);
});
