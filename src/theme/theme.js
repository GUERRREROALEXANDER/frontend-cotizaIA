import { useCallback, useEffect, useState } from "react";

export const themeStorageKey = "cotizaia.theme";

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private mode or blocked storage: fall back to the default theme.
  }
  return "dark";
}

// index.html sets data-theme before React mounts, so this hook only keeps the
// attribute and storage in sync after the first paint (no flash).
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || readStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1c1a17" : "#f8f6f2");
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Storage unavailable: the theme still applies for this session.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === "dark" ? "light" : "dark")), []);
  return { theme, setTheme, toggleTheme };
}
