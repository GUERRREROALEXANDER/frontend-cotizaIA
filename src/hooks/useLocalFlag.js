import { useEffect, useState } from "react";

// Boolean UI preference persisted per browser (e.g. collapsed sidebar).
// Storage can be unavailable; the flag then just lives for the session.
export function useLocalFlag(key, initial = false) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored == null ? initial : stored === "1";
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value ? "1" : "0");
    } catch {
      // Ignore: preference is a convenience, not state.
    }
  }, [key, value]);

  return [value, setValue];
}
