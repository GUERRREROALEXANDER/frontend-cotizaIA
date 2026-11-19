import test from "node:test";
import assert from "node:assert/strict";
import { friendlyMessage } from "../../src/friendlyError.js";

test("browser timeout becomes a Spanish message that mentions waking up", () => {
  const message = friendlyMessage({ error: Object.assign(new Error("signal timed out"), { name: "TimeoutError" }) });
  assert.match(message, /tarda más de lo normal/);
  assert.doesNotMatch(message, /signal/);
});

test("AbortError is treated like a timeout", () => {
  assert.match(friendlyMessage({ error: Object.assign(new Error("x"), { name: "AbortError" }) }), /tarda más de lo normal/);
});

test("HTML proxy error page is never shown raw", () => {
  const message = friendlyMessage({ status: 502, body: "<html><body>Bad Gateway</body></html>" });
  assert.match(message, /no está disponible/);
  assert.doesNotMatch(message, /<html>/);
});

test("502 and 504 with any body give the unavailable message", () => {
  assert.match(friendlyMessage({ status: 504, body: "" }), /no está disponible/);
  assert.match(friendlyMessage({ status: 502, body: { error: "x" } }), /no está disponible/);
});

test("503 from a failed pipeline run tells the user to retry and names the execution", () => {
  const message = friendlyMessage({ status: 503, body: { error: "Pipeline run failed; see execution 7", executionId: 7 } });
  assert.match(message, /Reintentar/);
  assert.match(message, /7/);
  assert.doesNotMatch(message, /see execution/);
});

test("anything else returns null so the caller keeps the server message", () => {
  assert.equal(friendlyMessage({ status: 409, body: { error: "Proposal can only be approved in IN_REVIEW" } }), null);
  assert.equal(friendlyMessage({ status: 400, body: "bad" }), null);
  assert.equal(friendlyMessage({}), null);
});
