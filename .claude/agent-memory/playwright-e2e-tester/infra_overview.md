---
name: infra_overview
description: Test infrastructure — ports, env files, global setup, DB, seed tokens
metadata:
  type: project
---

## Ports during E2E runs

- Backend: `3002` (`.env.test` sets `PORT=3002`)
- Frontend Vite: `3000` (proxies `/api/*` → `localhost:3002` via `API_PORT=3002`)
- Test DB (PostgreSQL): `5434` (dev DB is on `5433`)

## Key files

- `playwright.config.ts` — root of project, `testDir: './e2e'`, single chromium project, `fullyParallel: false`, `workers: 1`
- `e2e/global-setup.ts` — runs `prisma migrate deploy` then `bun src/seed.test.ts` on the test DB before any test
- `backend/.env.test` — test-specific env vars (DB URL with port 5434, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, credentials)
- `backend/src/seed.test.ts` — wipes all auth tables, inserts admin + agent users with deterministic IDs and pre-seeded session tokens

## Test accounts (seeded by seed.test.ts)

| Role  | Email              | Password        | User ID          | Session token              |
|-------|--------------------|-----------------|------------------|----------------------------|
| ADMIN | admin@e2e.test     | TestAdmin123!   | e2e-admin-user   | e2e-admin-session-token    |
| AGENT | agent@e2e.test     | TestAgent123!   | e2e-agent-user   | e2e-agent-session-token    |

Names: "Test Admin" / "Test Agent"
Session expiry: 2099-12-31 (never expires during tests)

## Commands

```bash
bun run test:e2e        # headless
bun run test:e2e:ui     # interactive UI
# Requires: docker compose up db-test -d  (test DB on :5434)
# Dev servers must NOT be running (reuseExistingServer: false)
```

**Why:** `reuseExistingServer: false` ensures tests always use a clean server with the test DB, not the dev server connected to the dev DB.
