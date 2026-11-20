import test from "node:test";
import assert from "node:assert/strict";
import { viewById, viewBySlug, viewGroups, views } from "../../src/navigation.js";

test("view ids and URL slugs are unique", () => {
  assert.equal(new Set(views.map((view) => view.id)).size, views.length);
  assert.equal(new Set(views.map((view) => view.slug)).size, views.length);
});

test("slugs are safe to use in the URL hash", () => {
  for (const view of views) {
    assert.match(view.slug, /^[a-z0-9-]+$/, `${view.id} has slug "${view.slug}"`);
  }
});

test("keyboard shortcuts are single digits 1-9 without repeats", () => {
  const shortcuts = views.filter((view) => view.shortcut).map((view) => view.shortcut);
  assert.equal(new Set(shortcuts).size, shortcuts.length);
  for (const key of shortcuts) assert.match(key, /^[1-9]$/);
});

test("every view has a label, a title, an icon and a group", () => {
  for (const view of views) {
    assert.ok(view.label, `${view.id} needs a label`);
    assert.ok(view.title, `${view.id} needs a title`);
    assert.ok(view.icon, `${view.id} needs an icon`);
    assert.ok(viewGroups.includes(view.group), `${view.id} has an unknown group`);
  }
});

test("lookup tables point back to the same view objects", () => {
  for (const view of views) {
    assert.equal(viewById[view.id], view);
    assert.equal(viewBySlug[view.slug], view);
  }
});

test("dashboard is the first view, the fallback of useHashView", () => {
  assert.equal(views[0].id, "dashboard");
  assert.ok(viewById.dashboard);
});

test("groups keep the order of the sidebar", () => {
  assert.deepEqual(viewGroups, [...new Set(views.map((view) => view.group))]);
});
