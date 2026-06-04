---
name: test_patterns
description: Established test patterns — API-level tests, role-based access, webhook auth, serial execution
metadata:
  type: project
---

## API-level tests (no browser)

For endpoint tests that do not require a browser, use Playwright's `request` fixture directly:

```typescript
import { test, expect } from '@playwright/test';

test('example api test', async ({ request }) => {
  const response = await request.post('http://localhost:3002/api/webhooks/inbound-email', {
    headers: { 'x-webhook-secret': 'test-webhook-secret-e2e' },
    data: { fromEmail: 'user@example.com', ... },
  });
  expect(response.status()).toBe(201);
});
```

- Always use absolute URLs pointing to `http://localhost:3002` for direct backend calls (bypasses Vite proxy)
- `baseURL` in playwright.config.ts is `http://localhost:3001` (the frontend) — relative paths go through Vite

## Webhook secret authentication pattern

The `requireWebhookSecret` middleware reads from:
- Header: `x-webhook-secret`
- Query param: `?secret=`

Test both delivery channels explicitly. Secret value in test env: `test-webhook-secret-e2e`.

## Role-based access patterns

- Unauthenticated requests to protected routes → 401 (API) or redirect to `/login` (browser)
- Agent role cannot access admin routes (`/users`, `PATCH /api/users/:id`, etc.) → 403 or redirect to `/`
- Admin role can access all routes

## Test isolation with serial execution

`workers: 1` and `fullyParallel: false` — tests run serially. Each test must still be independent:
- Use unique `fromEmail` values per thread-detection test to avoid ticket collisions
- Do not rely on ticket IDs from a previous test (order could change)
- The test DB is wiped and re-seeded once before the entire run (`global-setup.ts`), NOT between each test

## Setting up preconditions via API

For tests that need a ticket in a specific state (e.g., CLOSED), use the PATCH endpoint with an authenticated agent session:

1. Create the ticket via the webhook
2. Sign in as agent via `POST /api/auth/sign-in/email` to get a session cookie
3. `PATCH /api/tickets/:id` with `{ status: 'CLOSED' }` and `Cookie:` header
4. Run the assertion

See `e2e/webhooks/inbound-email.spec.ts` for the `getAgentSessionCookie` helper pattern.

## Empty-state tests that depend on a clean ticket table

The DB is seeded once before the whole run (not between tests). If a spec tests the empty state
("No tickets yet."), that test must appear before any test that creates a ticket in the same run.
Because `workers: 1` and specs within a file run top-to-bottom, placing the empty-state describe
block before ticket-creating blocks is sufficient. Avoid splitting empty-state and creation tests
across different spec files unless you can guarantee file ordering.

## Mutative CRUD tests — unique email pattern

For tests that create/edit/delete users (or any entity) when the DB is not reset between tests:
- Generate a unique email per test using `Date.now()`: `const email = \`action-${Date.now()}@example.com\``
- This prevents any cross-test row collision regardless of execution order
- The seed wipes all created rows on the next full run, so no permanent clutter
- The two seed accounts (`admin@e2e.test`, `agent@e2e.test`) are only touched by read-only tests

## Subject normalisation (thread detection)

The webhook strips `Re:`, `Fwd:`, `FW:` prefixes recursively (case-insensitive) before matching.
Tests should cover: single `Re:`, single `Fwd:`, Outlook-style `FW:`, and nested `Re: Re:`.
