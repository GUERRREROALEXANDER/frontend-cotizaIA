import test from "node:test";
import assert from "node:assert/strict";
import { initialsOfLabel, normalizeOptionText } from "../../src/components/optionText.js";

test("search text ignores accents and case", () => {
  assert.equal(normalizeOptionText("Diseño Ágil"), "diseno agil");
  assert.equal(normalizeOptionText("PANADERÍA"), "panaderia");
  assert.ok(normalizeOptionText("Catálogo de servicios").includes(normalizeOptionText("CATALOGO")));
});

test("empty values normalize to an empty string", () => {
  assert.equal(normalizeOptionText(null), "");
  assert.equal(normalizeOptionText(undefined), "");
  assert.equal(normalizeOptionText(42), "42");
});

test("initials take the first letter of the first two words", () => {
  assert.equal(initialsOfLabel("Estudio Nariño Digital"), "EN");
  assert.equal(initialsOfLabel("  café   galeras "), "CG");
  assert.equal(initialsOfLabel("Ñandú"), "Ñ");
});

test("symbols are skipped and digits count as initials", () => {
  assert.equal(initialsOfLabel("(Senior) Developer"), "SD");
  assert.equal(initialsOfLabel("3D Studio"), "3S");
});

test("a label without letters falls back to a question mark", () => {
  assert.equal(initialsOfLabel(""), "?");
  assert.equal(initialsOfLabel("— · —"), "?");
  assert.equal(initialsOfLabel(null), "?");
});
