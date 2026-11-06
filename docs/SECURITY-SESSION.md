# Frontend spec - the browser holds no credentials and no business data

Backend contract (already live in backend-cotizaIA, spec 02 and 09):
- Login/register answer **without a token**; the backend sets `cz_access` (HttpOnly, 15 min) and `cz_refresh`
  (HttpOnly, `Path=/api/auth`) cookies. JavaScript can never read them, and must not try.
- Every state-changing request authenticated by cookie must send the header `X-XSRF-TOKEN` with the value of the
  readable `XSRF-TOKEN` cookie. `GET /api/auth/csrf` (204) issues that cookie when it is missing.
- `POST /api/auth/refresh` (needs CSRF) rotates both cookies; `POST /api/auth/logout` (needs CSRF) clears them.
- `GET /api/auth/me` -> current identity (401 when not logged in). `GET /api/briefs?limit=35` lists briefs newest
  first. `GET /api/executions?limit=1` returns the latest agent run.
- Proposal detail items now carry `requirementType`, `estimateSource` (`MEMORY` | `CATALOG` | `DEFAULT`) and
  `citations: [{chunkId, documentName, page, similarity, hours}]`; the detail carries
  `draft: {origin: AI|TEMPLATE, summary, sections, sources: [{number, documentName, page}]}` (nullable),
  `revisionNumber`, `revisionOf`.
- Cookies are `SameSite=Strict`, so the API must be **same-origin**: dev uses the Vite proxy (already in
  `vite.config.js`), production uses a Render rewrite `/api/*` -> backend. `apiBase` stays empty in both.

## Required changes
1. `src/api.js`: remove `tokenStorageKey` and every `Authorization` header built from storage. All requests use
   `credentials: "same-origin"`. Non-GET/HEAD requests (fetch and the XHR upload) send `X-XSRF-TOKEN` read from
   `document.cookie` (`XSRF-TOKEN`); if absent, call `GET /api/auth/csrf` first. On a 401 from any call except
   `/api/auth/*`, call `POST /api/auth/refresh` once and retry the original request once; if it still fails,
   dispatch a `window` event `cotizaia:session-expired`. Export `getSession()` (GET /api/auth/me, null on 401) and
   `logout()` (POST /api/auth/logout). Downloads use the same cookie session.
2. `src/App.jsx`: the session comes from `getSession()` on load (show the existing loading state meanwhile, then
   `AuthScreen` or the app). `signOut` calls `logout()`. Listen to `cotizaia:session-expired` and return to
   `AuthScreen`. Delete `cotizaia.briefs` / `cotizaia.recentExecution` storage: load briefs from
   `GET /api/briefs?limit=35` and the recent run from `GET /api/executions?limit=1` inside `loadWorkspace`;
   `handleBriefCreated` / `handleExecution` only update React state.
3. `src/components/AuthScreen.jsx`: never touch storage; after a successful login/register call
   `onAuthenticated()` (no argument).
4. Proposal review UI (`src/components/proposals/ProposalItemsTable.jsx` and `ProposalDetailPanel.jsx`): per item a
   small source badge (`Memoria` / `Catálogo` / `Por defecto`) and, for `MEMORY`, its citations
   (`P21-propuesta.pdf · p. 1 · 89 h · sim 0.83`); in the detail panel, when `draft` exists, its origin
   (`Redactado por IA` / `Plantilla segura`) and the numbered source list. Use the existing design components;
   no new dependencies.
5. `index.html`: move the inline `<script>` to `public/theme-init.js` loaded with `<script src="/theme-init.js">`
   (a strict CSP forbids inline scripts).
6. `vite.config.js`: `build.sourcemap: false` (explicit).

`localStorage` may keep **UI preferences only** (theme, sidebar collapsed, proposals view mode, last seen
notification id). Nothing else.

## Judge
- `npm run build` succeeds.
- `npx playwright test` passes (`tests/e2e/session-security.spec.js`; needs the backend on :8080).
- `grep -rn "localStorage" src` matches only `src/theme/theme.js`, `src/hooks/useLocalFlag.js`,
  `src/hooks/useNotifications.js`, `src/views/ProposalsView.jsx`.
