import test from "node:test";
import assert from "node:assert/strict";
import {
  KNOWLEDGE_FILE,
  formatKnowledgeKind,
  formatKnowledgeSize,
  isPdfFile,
  knowledgeChunkText,
  knowledgeCountText,
  validateKnowledgeFile,
} from "../../src/knowledge.js";

const pdf = (overrides = {}) => ({ name: "propuesta.pdf", type: "application/pdf", size: 1024, ...overrides });

test("accepts a valid PDF", () => {
  assert.equal(validateKnowledgeFile(pdf()), "");
});

test("requires a file", () => {
  assert.match(validateKnowledgeFile(null), /Selecciona/);
  assert.match(validateKnowledgeFile(undefined), /Selecciona/);
});

test("rejects non-PDF by type and extension", () => {
  assert.match(validateKnowledgeFile(pdf({ name: "foto.png", type: "image/png" })), /Solo se aceptan/);
  assert.match(validateKnowledgeFile(pdf({ name: "notas.txt", type: "" })), /Solo se aceptan/);
});

test("accepts .pdf extension even with empty mime type", () => {
  assert.equal(validateKnowledgeFile(pdf({ type: "" })), "");
});

test("rejects files over the limit and empty files", () => {
  assert.match(validateKnowledgeFile(pdf({ size: KNOWLEDGE_FILE.maxBytes + 1 })), /supera/);
  assert.match(validateKnowledgeFile(pdf({ size: 0 })), /vacío/);
});

test("limit mirrors the 10 MB backend cap", () => {
  assert.equal(KNOWLEDGE_FILE.maxBytes, 10 * 1024 * 1024);
});

test("isPdfFile is case-insensitive on extension", () => {
  assert.equal(isPdfFile({ name: "DOC.PDF", type: "" }), true);
  assert.equal(isPdfFile(null), false);
});

test("formatKnowledgeSize uses MB over 1 MB and KB below", () => {
  assert.equal(formatKnowledgeSize(10 * 1024 * 1024), "10 MB");
  assert.equal(formatKnowledgeSize(512 * 1024), "512 KB");
  assert.equal(formatKnowledgeSize(0), "0 KB");
});

test("formatKnowledgeKind labels both backend kinds in Spanish", () => {
  assert.equal(formatKnowledgeKind("PROPOSAL_PDF"), "PDF de propuesta");
  assert.equal(formatKnowledgeKind("APPROVED_PROPOSAL"), "Propuesta aprobada");
  assert.equal(formatKnowledgeKind("whatever"), "PDF de propuesta");
});

test("count and chunk texts handle singular, plural and empty", () => {
  assert.equal(knowledgeCountText(1), "1 documento");
  assert.equal(knowledgeCountText(3), "3 documentos");
  assert.equal(knowledgeChunkText({ items: 1, passages: 2 }), "1 ítem · 2 pasajes");
  assert.equal(knowledgeChunkText({ items: 0, passages: 0 }), "Sin fragmentos");
  assert.equal(knowledgeChunkText(null), "Sin fragmentos");
});
