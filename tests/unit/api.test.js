import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal browser globals: api.js reads document.cookie and fires window events.
const events = [];
globalThis.document = { cookie: "" };
globalThis.window = { dispatchEvent: (event) => events.push(event.type) };

const calls = [];
let responses = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url, options, method: options.method || "GET", headers: new Headers(options.headers || {}), body: options.body });
  const next = responses.shift();
  if (!next) throw new Error(`unexpected fetch to ${url}`);
  if (next instanceof Error) throw next;
  return next;
};

const json = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const { del, get, getSession, patch, post, request } = await import("../../src/api.js");

beforeEach(() => {
  calls.length = 0;
  events.length = 0;
  responses = [];
  document.cookie = "XSRF-TOKEN=token%2B1";
});

test("GET sends no CSRF header and parses JSON", async () => {
  responses = [json(200, { id: 7 })];
  assert.deepEqual(await get("/api/clients/7"), { id: 7 });
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.has("X-XSRF-TOKEN"), false);
});

test("writes echo the decoded XSRF cookie and send JSON", async () => {
  responses = [json(200, { ok: true })];
  await post("/api/clients", { name: "Panadería" });
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.get("X-XSRF-TOKEN"), "token+1");
  assert.equal(calls[0].headers.get("Content-Type"), "application/json");
  assert.equal(calls[0].body, JSON.stringify({ name: "Panadería" }));
});

test("POST without a body sends no body", async () => {
  responses = [json(200, {})];
  await post("/api/proposals/1/approve");
  assert.equal(calls[0].body, undefined);
});

test("a missing CSRF cookie is fetched before the first write", async () => {
  document.cookie = "";
  responses = [
    new Response(null, { status: 204 }),
    json(200, { id: 1 }),
  ];
  // The CSRF endpoint "sets" the cookie, as the real backend does.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const response = await realFetch(url, options);
    if (String(url).endsWith("/api/auth/csrf")) document.cookie = "XSRF-TOKEN=fresh";
    return response;
  };
  try {
    await patch("/api/clients/1", { name: "x" });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.deepEqual(calls.map((call) => call.url), ["/api/auth/csrf", "/api/clients/1"]);
  assert.equal(calls[1].headers.get("X-XSRF-TOKEN"), "fresh");
});

test("204 answers resolve to null", async () => {
  responses = [new Response(null, { status: 204 })];
  assert.equal(await del("/api/clients/1"), null);
});

test("an expired session is refreshed once and the call retried", async () => {
  responses = [json(401, { error: "expired" }), json(200, {}), json(200, { id: 3 })];
  assert.deepEqual(await get("/api/proposals/3"), { id: 3 });
  assert.deepEqual(calls.map((call) => call.url), ["/api/proposals/3", "/api/auth/refresh", "/api/proposals/3"]);
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(events, []);
});

test("if the refresh does not help, the app hears session-expired", async () => {
  responses = [json(401, {}), json(401, {}), json(401, { error: "Unauthorized" })];
  await assert.rejects(get("/api/proposals"), (error) => error.status === 401);
  assert.deepEqual(events, ["cotizaia:session-expired"]);
});

test("login and other auth calls never trigger a refresh", async () => {
  responses = [json(401, { error: "Bad credentials" })];
  await assert.rejects(post("/api/auth/login", {}), /Bad credentials/);
  assert.equal(calls.length, 1);
});

test("account calls under /api/auth/me/ do refresh", async () => {
  responses = [json(401, {}), json(200, {}), json(200, { phone: "+57" })];
  assert.deepEqual(await get("/api/auth/me/whatsapp"), { phone: "+57" });
  assert.equal(calls[1].url, "/api/auth/refresh");
});

test("API errors keep the server message and the status", async () => {
  responses = [json(409, { error: "Client 1 has 3 brief(s) and cannot be deleted" })];
  await assert.rejects(del("/api/clients/1"), (error) => {
    assert.equal(error.status, 409);
    assert.match(error.message, /cannot be deleted/);
    return true;
  });
});

test("gateway errors become a friendly Spanish sentence", async () => {
  responses = [new Response("<html>Bad gateway</html>", { status: 502 })];
  await assert.rejects(get("/api/clients"), /no está disponible/);
});

test("getSession answers null without a session", async () => {
  responses = [json(401, {})];
  assert.equal(await getSession(), null);
  assert.equal(calls.length, 1);
});

test("timeoutMs becomes an abort signal instead of a fetch option", async () => {
  responses = [json(200, {})];
  await request("/api/agent/run", { method: "POST", timeoutMs: 1000 });
  assert.equal("timeoutMs" in calls[0].options, false);
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.equal(calls[0].options.credentials, "same-origin");
});
