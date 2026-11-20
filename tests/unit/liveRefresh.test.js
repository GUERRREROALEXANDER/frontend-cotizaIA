import assert from "node:assert/strict";
import { test } from "node:test";
import { REFRESH_INTERVAL_MS, REFRESH_VIEWS, createRefreshGate } from "../../src/liveRefresh.js";

// A fake clock so the gate can be driven without waiting.
function clock(start = 1_000_000) {
  let now = start;
  return { now: () => now, advance: (ms) => { now += ms; } };
}

test("a refresh runs, and another one too soon is skipped", async () => {
  const time = clock();
  let calls = 0;
  const gate = createRefreshGate(async () => { calls += 1; }, { minGapMs: 5000, now: time.now });

  assert.equal(await gate.request(), true);
  time.advance(4999);
  assert.equal(await gate.request(), false);
  time.advance(1);
  assert.equal(await gate.request(), true);
  assert.equal(calls, 2);
});

test("while a refresh is running a second request does not start another", async () => {
  const time = clock();
  let release;
  let calls = 0;
  const gate = createRefreshGate(() => { calls += 1; return new Promise((done) => { release = done; }); }, {
    minGapMs: 0,
    now: time.now,
  });

  const first = gate.request();
  assert.equal(await gate.request(), false);
  release();
  assert.equal(await first, true);
  assert.equal(calls, 1);
});

test("a failed refresh does not block the next one", async () => {
  const time = clock();
  let fail = true;
  const gate = createRefreshGate(async () => { if (fail) throw new Error("cold backend"); }, {
    minGapMs: 0,
    now: time.now,
  });

  await assert.rejects(gate.request(), /cold backend/);
  fail = false;
  assert.equal(await gate.request(), true);
});

test("the views that show proposals refresh on entry, every 30 s at most", () => {
  assert.deepEqual([...REFRESH_VIEWS].sort(), ["dashboard", "proposals"]);
  assert.equal(REFRESH_INTERVAL_MS, 30_000);
});
