# Backend API used by the frontend

All calls go through `src/api.js` (`get`, `post`, `put`, `del`, `upload`). JWT in `localStorage["cotizaia.accessToken"]`. Errors come back as `{ "error": "..." }` (400/404/409/413/422/503) or `{ "error": "Validation failed", "fields": {...} }`.

## Auth
- `POST /api/auth/register` `{agencyName≤255, ownerFullName, email, password 8..100}` → `AuthResponse {token, tokenType, expiresAt, agencyId, userId, role}`
- `POST /api/auth/login` `{email, password}` → `AuthResponse`
- `GET /api/auth/me`

## Workspace
- `GET /api/analytics` → `{averageResponseTimeMinutes, acceptanceRate, proposalsByStatus: {STATUS: count}, sentCount, acceptedCount, totalProposals}`
- `GET /api/notifications?limit=50` (1..200) → `[{id, proposalId, channel, eventType, payload, sentAt}]`
- `GET /api/agency/pricing-model` / `PUT` `{pricingModel: FIXED|HOURLY|PHASED}`

## Clients
- `GET /api/clients`, `GET/PUT/DELETE /api/clients/{id}`, `POST /api/clients` `{name≤255, email≤255, company≤255}` → `{id, name, email, company, createdAt}`

## Catalog (services)
- `GET /api/catalog` → `[{id, name, description, categoryId, requirementTypes: [{id, name, description, estimatedHours}]}]`
- `POST /api/catalog`, `PUT/DELETE /api/catalog/{id}` `{name≤255, description≤1000, categoryId?}`
- `POST /api/catalog/{catalogId}/requirement-types`, `PUT/DELETE .../{typeId}` `{name≤255, description≤1000 (required), estimatedHours≥0}`

## Roles and rates (COP per hour)
- `GET/POST /api/roles` `{name≤255}`, `DELETE /api/roles/{roleId}`
- `GET/POST /api/roles/{roleId}/rates` `{copPerHour>0 integer, effectiveFrom?, effectiveTo?}` → `{id, roleId, copPerHour, effectiveFrom, effectiveTo}`
- `PUT /api/rates/{rateId}` `{copPerHour}`, `DELETE /api/rates/{rateId}`

## Briefs
- `POST /api/briefs` `{source: EMAIL|WHATSAPP|WEB_FORM, clientId, payload}`; payload text field: EMAIL `body` (+ `subject`), WHATSAPP `message`, WEB_FORM `description` (+ `projectType`). Text ≤ 5000 chars.
- `POST /api/briefs/upload` multipart `file` (PDF ≤ 10 MB, ≤ 30 pages), `clientId`, `note?` (≤ 1000) → `{brief: BriefResponse, fileName, pages, truncated, unreadablePages: [int]}`; 413 when the file is too big.
- `GET /api/briefs/{id}` → `{id, clientId, source (also PDF), rawText, rawPayload, receivedAt, questions: [...], proposalId, proposalStatus, executionIds}`
- `GET /api/briefs/{id}/attachment` → the original PDF (only PDF briefs)
- `POST /api/briefs/{id}/process` → `QuotationResponse {briefId, proposalId, proposalStatus, executionId, executionStatus, halted, subtotal, total, pricingModel, documents, questions}`
- `POST /api/briefs/{id}/questions/{questionId}/answer` `{answer ≤ 2000}`
- No endpoint lists all briefs: the inbox keeps recently created ones in localStorage (existing behavior).

## Executions
- `GET /api/executions?briefId=` , `GET /api/executions/{id}` → `{id, briefId, status, startedAt, finishedAt, errorMessage, steps: [{id, stepOrder, handler, inputSummary, outputSummary, durationMs, ...}]}`

## Proposals
- `GET /api/proposals`, `GET /api/proposals/queue` → `[{id, briefId, status, subtotal, total, pricingModel, createdAt, approvedAt}]`
- `GET /api/proposals/{id}` → detail with `allowedTransitions`, `items`, `extras`, `schedule`, `statusHistory`, `documents`, `deposit`
- `PUT /api/proposals/{id}/items/{itemId}` `{hours}`
- `POST /api/proposals/{id}/approve | send | negotiate | reject | expire | accept`
- `GET /api/proposals/{id}/documents`, `GET /api/proposals/{id}/documents/{PROPOSAL|CONTRACT|SCHEDULE}` (PDF)

Statuses: `RECEIVED, ANALYZING, QUOTED, IN_REVIEW, SENT, NEGOTIATING, ACCEPTED, CONTRACT_ISSUED, REJECTED, EXPIRED`.
