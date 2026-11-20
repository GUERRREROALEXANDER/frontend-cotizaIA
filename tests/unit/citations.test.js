import test from "node:test";
import assert from "node:assert/strict";
import { citationLabel, formatHours } from "../../src/components/proposals/citations.js";

test("hours use the Colombian format with at most one decimal", () => {
  assert.equal(formatHours(12.5), "12,5");
  assert.equal(formatHours("8"), "8");
  assert.equal(formatHours(1234), "1.234");
  assert.equal(formatHours(2.26), "2,3");
});

test("non-numeric hours show a dash", () => {
  assert.equal(formatHours("abc"), "—");
  assert.equal(formatHours(undefined), "—");
  assert.equal(formatHours(Infinity), "—");
});

test("a full citation lists document, page, hours and similarity", () => {
  assert.equal(
    citationLabel({ documentName: "Propuesta Café Galeras.pdf", page: 3, hours: 6.5, similarity: 0.8712 }),
    "Propuesta Café Galeras.pdf · p. 3 · 6,5 h · sim 0.87",
  );
});

test("missing parts are left out instead of printing empty pieces", () => {
  assert.equal(citationLabel({ documentName: "Catálogo" }), "Catálogo");
  assert.equal(citationLabel({ documentName: "", page: 0 }), "p. 0");
  assert.equal(citationLabel({ documentName: "P.pdf", page: null, similarity: 0 }), "P.pdf · sim 0.00");
});
