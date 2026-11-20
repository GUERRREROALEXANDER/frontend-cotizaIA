import test from "node:test";
import assert from "node:assert/strict";
import { dashboardNotifications, parseLastSeen, parseNotificationRow } from "../../src/notificationRows.js";

test("the JSON payload becomes a data object", () => {
  const row = parseNotificationRow({ id: 1, payload: JSON.stringify({ clientName: "Café Galeras", to: "SENT" }) });

  assert.deepEqual(row.data, { clientName: "Café Galeras", to: "SENT" });
  assert.equal(row.id, 1);
});

test("broken or non-object payloads give an empty data object", () => {
  assert.deepEqual(parseNotificationRow({ payload: "{broken" }).data, {});
  assert.deepEqual(parseNotificationRow({ payload: "null" }).data, {});
  assert.deepEqual(parseNotificationRow({ payload: "42" }).data, {});
  assert.deepEqual(parseNotificationRow({}).data, {});
});

test("only dashboard rows are kept, newest first", () => {
  const items = dashboardNotifications([
    { id: 1, channel: "DASHBOARD", payload: "{}" },
    { id: 3, channel: "EMAIL", payload: "{}" },
    { id: 2, channel: "DASHBOARD", payload: "{}" },
    null,
  ]);

  assert.deepEqual(items.map((item) => item.id), [2, 1]);
});

test("a response that is not a list gives no notifications", () => {
  assert.deepEqual(dashboardNotifications(undefined), []);
  assert.deepEqual(dashboardNotifications({ error: "x" }), []);
});

test("the stored last-seen id is a number or nothing", () => {
  assert.equal(parseLastSeen("42"), 42);
  assert.equal(parseLastSeen(null), null);
  assert.equal(parseLastSeen("abc"), null);
});
