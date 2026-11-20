// Keeps the workspace fresh when proposals are created outside this tab (WhatsApp, Gmail intake, another device).
// Pure logic, no React or DOM, so the unit tests can drive it with a fake clock.

// How often a visible tab re-reads the workspace.
export const REFRESH_INTERVAL_MS = 30_000;

// Entering these views re-reads the workspace: they are where a new proposal shows up.
export const REFRESH_VIEWS = new Set(["dashboard", "proposals"]);

// Focus, tab switches and view changes can fire together; one refresh covers them all.
const MIN_GAP_MS = 5_000;

// Wraps `refresh` so that at most one runs at a time and two never start closer than `minGapMs`.
// `request()` resolves true when it ran the refresh, false when it skipped it; a failed refresh rejects
// and does not block the next request.
export function createRefreshGate(refresh, { minGapMs = MIN_GAP_MS, now = Date.now } = {}) {
  let running = false;
  let lastStart = -Infinity;
  return {
    async request() {
      if (running || now() - lastStart < minGapMs) return false;
      running = true;
      lastStart = now();
      try {
        await refresh();
        return true;
      } finally {
        running = false;
      }
    },
  };
}
