import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { get } from "../api.js";
import { notificationText } from "../components/NotificationsDrawer.jsx";
import { dashboardNotifications, parseLastSeen } from "../notificationRows.js";

const storageKey = "cotizaia.notifications.lastSeen";

function readLastSeen() {
  try {
    return parseLastSeen(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

// Polls dashboard notifications, keeps the previous list on errors.
export function useNotifications({ enabled } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [lastSeenId, setLastSeenId] = useState(readLastSeen);
  const firstLoad = useRef(true);
  const knownIds = useRef(new Set());

  const load = useCallback(async () => {
    let rows;
    try {
      rows = await get("/api/notifications?limit=50");
    } catch {
      return;
    }
    const items = dashboardNotifications(rows);
    if (!firstLoad.current) {
      const fresh = items.filter((item) => !knownIds.current.has(item.id)).reverse();
      for (const item of fresh) {
        const { title, description } = notificationText(item);
        toast(title, { description });
      }
    }
    firstLoad.current = false;
    knownIds.current = new Set(items.map((item) => item.id));
    setNotifications(items);
  }, []);

  const refresh = useCallback(() => load(), [load]);

  useEffect(() => {
    if (!enabled) return undefined;
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => clearInterval(timer);
  }, [enabled, load]);

  const markAllRead = useCallback(() => {
    if (notifications.length === 0) return;
    const maxId = notifications.reduce((max, item) => Math.max(max, item.id), 0);
    try {
      window.localStorage.setItem(storageKey, String(maxId));
    } catch {
      // Storage is best effort; the badge still updates in memory.
    }
    setLastSeenId(maxId);
  }, [notifications]);

  const unreadCount = notifications.filter((item) => item.id > (lastSeenId ?? 0)).length;

  return { notifications, unreadCount, lastSeenId, markAllRead, refresh };
}
