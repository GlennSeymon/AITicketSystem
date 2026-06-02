---
name: auth_fixtures
description: Cookie-injection auth fixtures — adminPage/agentPage skip UI login by injecting pre-seeded session cookies
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
| `adminPage`        | Page        | Page with `better-auth.session_token=e2e-admin-session-token` injected |
| `agentPage`        | Page        | Page with `better-auth.session_token=e2e-agent-session-token` injected |

## Cookie spec

```typescript
{
  name: 'better-auth.session_token',
  value: '<token>',
  domain: 'localhost',
  path: '/',
  httpOnly: true,
  secure: false,
  sameSite: 'Lax',
  expires: new Date('2099-12-31').getTime() / 1000,
}
```

- Cookie is injected via `page.context().addCookies(...)` before the page is yielded to the test.
- The cookie must be injected BEFORE `page.goto(...)` — the session is validated on the first authenticated API call.
- `secure: false` is correct for localhost (no HTTPS in dev/test).

## Usage in tests

```typescript
import { test, expect } from '../fixtures/auth.fixtures';

// Cookie injection — no UI login needed
test('example', async ({ adminPage }) => {
  await adminPage.goto('/');
  // already authenticated
});

// UI login — use credentials fixture
test('login form', async ({ page, adminCredentials }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminCredentials.email);
  // ...
});
```

**Why:** Injecting cookies directly is faster and more reliable than driving the login UI for every test. Only login.spec.ts tests the UI login flow — all other specs use `adminPage`/`agentPage`.
