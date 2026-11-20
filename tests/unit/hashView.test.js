import test from "node:test";
import assert from "node:assert/strict";
import { viewIdFromHash, views } from "../../src/navigation.js";

test("every view slug in the hash opens that view", () => {
  for (const view of views) {
    assert.equal(viewIdFromHash(`#/${view.slug}`), view.id);
  }
});

test("the slash after the hash sign is optional", () => {
  assert.equal(viewIdFromHash("#propuestas"), "proposals");
});

test("query strings after the slug are ignored", () => {
  assert.equal(viewIdFromHash("#/bandeja?brief=12"), "inbox");
});

test("unknown, empty or missing hashes land on the dashboard", () => {
  assert.equal(viewIdFromHash("#/no-existe"), "dashboard");
  assert.equal(viewIdFromHash(""), "dashboard");
  assert.equal(viewIdFromHash(undefined), "dashboard");
});

test("view ids are not accepted in place of slugs", () => {
  assert.equal(viewIdFromHash("#/proposals"), "dashboard");
});
