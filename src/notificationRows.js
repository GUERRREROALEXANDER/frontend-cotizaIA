// Pure helpers behind useNotifications: rows arrive with a JSON string payload
// and only DASHBOARD rows are shown, newest first.
export function parseNotificationRow(row) {
  let data = {};
  try {
    const parsed = JSON.parse(row.payload);
    if (parsed !== null && typeof parsed === "object") data = parsed;
  } catch {
    data = {};
  }
  return { ...row, data };
}

export function dashboardNotifications(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.channel === "DASHBOARD")
    .map(parseNotificationRow)
    .sort((a, b) => b.id - a.id);
}

export function parseLastSeen(raw) {
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}
