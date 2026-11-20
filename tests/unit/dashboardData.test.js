import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptancePercent,
  buildCountSeries,
  buildStatusSeries,
  buildValueSeries,
  channelFor,
  executionDurationMs,
  formatDuration,
  formatMinutes,
  greetingForHour,
  previewText,
  stepCount,
} from "../../src/components/dashboard/dashboardData.js";

test("the greeting follows the hour of the day", () => {
  assert.equal(greetingForHour(8), "Buenos días");
  assert.equal(greetingForHour(12), "Buenas tardes");
  assert.equal(greetingForHour(19), "Buenas noches");
});

test("acceptance accepts a ratio or a percentage", () => {
  assert.equal(acceptancePercent(0.25), 25);
  assert.equal(acceptancePercent(40), 40);
  assert.equal(acceptancePercent(-3), 0);
  assert.equal(acceptancePercent("abc"), 0);
});

test("status series drops empty states and sorts by count", () => {
  const series = buildStatusSeries({ SENT: 2, IN_REVIEW: 5, REJECTED: 0 });
  assert.deepEqual(
    series.map(({ status, count }) => [status, count]),
    [["IN_REVIEW", 5], ["SENT", 2]],
  );
  assert.equal(series[0].label, "Por revisar");
  assert.deepEqual(buildStatusSeries(null), []);
});

test("value series sums today's proposals and ignores bad dates", () => {
  const now = new Date().toISOString();
  const series = buildValueSeries(
    [
      { createdAt: now, total: 1000.4 },
      { createdAt: now, total: "500" },
      { createdAt: "not a date", total: 99 },
      { createdAt: "2001-01-01T00:00:00Z", total: 99 },
    ],
    7,
  );
  assert.equal(series.length, 7);
  assert.equal(series.at(-1).value, 1500);
  assert.equal(series.reduce((sum, day) => sum + day.value, 0), 1500);
});

test("count series counts proposals per day", () => {
  const now = new Date().toISOString();
  const series = buildCountSeries([{ createdAt: now }, { createdAt: now }], 14);
  assert.equal(series.length, 14);
  assert.equal(series.at(-1).count, 2);
  assert.deepEqual(buildCountSeries(undefined, 3).map((day) => day.count), [0, 0, 0]);
});

test("minutes and durations are rounded for the KPI tiles", () => {
  assert.equal(formatMinutes(12.6), "13 min");
  assert.equal(formatMinutes(null), "0 min");
  assert.equal(formatDuration(45_000), "45 s");
  assert.equal(formatDuration(120_000), "2 min");
  assert.equal(formatDuration(125_000), "2 min 5 s");
  assert.equal(formatDuration(-10), "0 s");
});

test("execution duration uses the clock, then the steps", () => {
  assert.equal(executionDurationMs({ startedAt: "2026-11-20T10:00:00Z", finishedAt: "2026-11-20T10:00:03Z" }), 3000);
  assert.equal(executionDurationMs({ steps: [{ durationMs: 10 }, { durationMs: 5 }] }), 15);
  assert.equal(executionDurationMs(null), 0);
  assert.equal(stepCount({ steps: [{}, {}] }), 2);
  assert.equal(stepCount({}), 0);
});

test("channels map to Spanish labels with a safe default", () => {
  assert.equal(channelFor("whatsapp").label, "WhatsApp");
  assert.equal(channelFor("WEB_FORM").label, "Formulario");
  assert.equal(channelFor("FAX").label, "Brief");
});

test("previews collapse whitespace and cut long text", () => {
  assert.equal(previewText("  hola \n\n mundo "), "hola mundo");
  assert.equal(previewText(""), "Sin texto guardado");
  const long = previewText("a".repeat(200), 10);
  assert.equal(long, `${"a".repeat(10)}…`);
});
