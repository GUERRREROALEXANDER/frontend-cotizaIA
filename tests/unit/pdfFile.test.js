import test from "node:test";
import assert from "node:assert/strict";
import { formatMb, isPdfFile } from "../../src/components/inbox/pdfFile.js";

test("a reported MIME type decides, whatever the file name says", () => {
  assert.equal(isPdfFile({ name: "brief.pdf", type: "application/pdf" }), true);
  assert.equal(isPdfFile({ name: "brief.pdf", type: "image/png" }), false);
  assert.equal(isPdfFile({ name: "brief.png", type: "application/pdf" }), true);
});

test("typeless files fall back to a case-insensitive .pdf extension", () => {
  assert.equal(isPdfFile({ name: "BRIEF.PDF", type: "" }), true);
  assert.equal(isPdfFile({ name: "brief.docx" }), false);
  assert.equal(isPdfFile({}), false);
});

test("no file is not a PDF", () => {
  assert.equal(isPdfFile(null), false);
  assert.equal(isPdfFile(undefined), false);
});

test("sizes are shown in megabytes with two decimals", () => {
  assert.equal(formatMb(10 * 1024 * 1024), "10.00 MB");
  assert.equal(formatMb(1536 * 1024), "1.50 MB");
  assert.equal(formatMb(undefined), "0.00 MB");
});
