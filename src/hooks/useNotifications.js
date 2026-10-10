// STUB: replaced in the features stage. Contract fixed by App.jsx:
// useNotifications({ enabled }) -> { notifications, unreadCount, lastSeenId, markAllRead(), refresh() }
export function useNotifications() {
  return { notifications: [], unreadCount: 0, lastSeenId: null, markAllRead: () => {}, refresh: () => {} };
}
