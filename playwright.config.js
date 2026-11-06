import { defineConfig } from "@playwright/test";

// The judge for docs/SECURITY-SESSION.md: a real browser against the Vite dev server, whose proxy forwards /api
// to the backend on :8080 (start it first).
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:5173", headless: true },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
