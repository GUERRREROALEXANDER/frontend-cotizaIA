import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, formatDate, formatDateTime, formatRelative } from "../../src/format.js";

const plain = (text) => text.replace(/\s/g, " ");

test("money is shown in Colombian pesos without decimals", () => {
  assert.equal(plain(formatCurrency(1234567)), "$ 1.234.567");
  assert.equal(plain(formatCurrency("950000.60")), "$ 950.001");
});

test("missing or invalid amounts are shown as zero pesos", () => {
  assert.equal(plain(formatCurrency(null)), "$ 0");
  assert.equal(plain(formatCurrency(undefined)), "$ 0");
  assert.equal(plain(formatCurrency("")), "$ 0");
});

test("dates without a value say so instead of showing an invalid date", () => {
  assert.equal(formatDate(null), "Sin fecha");
  assert.equal(formatDate(""), "Sin fecha");
  assert.equal(formatDateTime(undefined), "Sin fecha");
});

test("dates keep the year and the date-time also shows the time", () => {
  const value = "2026-11-20T12:00:00Z";

  assert.match(formatDate(value), /2026/);
  assert.ok(formatDateTime(value).length > formatDate(value).length);
});

test("relative times read naturally in Spanish", () => {
  const now = Date.now();

  assert.equal(formatRelative(new Date(now - 5 * 60 * 1000).toISOString()), "hace 5 minutos");
  assert.equal(formatRelative(new Date(now - 26 * 3600 * 1000).toISOString()), "ayer");
  assert.equal(formatRelative(new Date(now - 3 * 3600 * 1000).toISOString()), "hace 3 horas");
});

test("no time gives an empty relative label", () => {
  assert.equal(formatRelative(null), "");
  assert.equal(formatRelative(""), "");
});
