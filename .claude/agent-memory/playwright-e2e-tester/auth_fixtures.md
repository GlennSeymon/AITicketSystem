---
name: auth_fixtures
description: Auth fixtures — adminPage/agentPage sign in via Better Auth API endpoint before yielding the page
metadata:
  type: project
---

## File

`e2e/fixtures/auth.fixtures.ts`

## Pattern

Extends `@playwright/test` base with four fixtures:

| Fixture            | Type        | Description |
|--------------------|-------------|-------------|
| `adminCredentials` | Credentials | `{ email, password }` from env/defaults |
| `agentCredentials` | Credentials | `{ email, password }` from env/defaults |
| `adminPage`        | Page        | Page pre-authenticated via real sign-in API call |
| `agentPage`        | Page        | Page pre-authenticated via real sign-in API call |

## How authentication works

`adminPage`/`agentPage` call `page.request.post('/api/auth/sign-in/email', { data: { email, password } })` before yielding the page. `page.request` shares the cookie jar with the `page` object, so the session cookie set by Better Auth is automatically available for all subsequent `page.goto()` calls.

This uses the real sign-in endpoint (not raw cookie injection) because Better Auth may sign/transform tokens internally. The API call guarantees the session cookie is always valid.

## Usage in tests

```typescript
import { test, expect } from '../fixtures/auth.fixtures';

// Pre-authenticated — no UI login needed
test('example', async ({ adminPage }) => {
  await adminPage.goto('/');
  // already authenticated
});

// UI login test — use credentials fixture
test('login form', async ({ page, adminCredentials }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminCredentials.email);
  // ...
});
```

## Authenticating in pure API tests (no page)

For API-level tests using Playwright's `request` fixture, replicate the sign-in
call manually, then extract the `Set-Cookie` header to forward as `Cookie:` in
subsequent requests:

```typescript
const signInRes = await request.post('http://localhost:3002/api/auth/sign-in/email', {
  data: { email, password },
});
const rawCookie = signInRes.headers()['set-cookie'];
const sessionCookie = rawCookie
  .split('\n')
  .map((c) => c.split(';')[0].trim())
  .filter(Boolean)
  .join('; ');

// Use in subsequent requests:
await request.patch(`http://localhost:3002/api/tickets/${id}`, {
  headers: { Cookie: sessionCookie },
  data: { status: 'CLOSED' },
});
```

**Why API login instead of raw cookie injection:** Better Auth may sign or transform the session token internally. Using the real sign-in endpoint guarantees the cookie is correct regardless of internal handling.
