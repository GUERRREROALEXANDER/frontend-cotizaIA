import test from "node:test";
import assert from "node:assert/strict";
import { COUNTER_VISIBLE_FROM, COUNTER_WARNING_FROM, LIMITS, PDF_LIMITS } from "../../src/limits.js";

test("limits cannot be changed at runtime", () => {
  assert.ok(Object.isFrozen(LIMITS));
  assert.ok(Object.isFrozen(PDF_LIMITS));
  assert.throws(() => {
    "use strict";
    LIMITS.briefText = 1;
  }, TypeError);
});

test("every text cap is a positive whole number", () => {
  for (const [field, cap] of Object.entries(LIMITS)) {
    assert.ok(Number.isInteger(cap) && cap > 0, `${field} must be a positive integer, got ${cap}`);
  }
});

test("the password range is valid", () => {
  assert.ok(LIMITS.passwordMin >= 8, "the backend asks for at least 8 characters");
  assert.ok(LIMITS.passwordMin < LIMITS.password);
});

test("caps mirror the backend validation", () => {
  assert.equal(LIMITS.briefText, 5000);
  assert.equal(LIMITS.email, 255);
  assert.equal(LIMITS.description, 1000);
});

test("PDF caps match PdfBriefReader: 10 MiB and 30 pages", () => {
  assert.equal(PDF_LIMITS.maxBytes, 10 * 1024 * 1024);
  assert.equal(PDF_LIMITS.maxPages, 30);
});

test("the counter shows up before it turns into a warning", () => {
  assert.ok(COUNTER_VISIBLE_FROM > 0 && COUNTER_VISIBLE_FROM < 1);
  assert.ok(COUNTER_WARNING_FROM > COUNTER_VISIBLE_FROM && COUNTER_WARNING_FROM < 1);
});
