/**
 * Auth fixtures for Playwright e2e tests.
 *
 * Two fixture flavours are provided:
 *
 * 1. `adminPage` / `agentPage` — pages pre-authenticated via a direct POST to
 *    Better Auth's sign-in endpoint. The resulting session cookie is stored in
 *    the browser context automatically by Playwright, so all subsequent
 *    page.goto() calls within the test are authenticated. Use these for any
 *    test that simply needs an authenticated starting state.
 *
 * 2. `adminCredentials` / `agentCredentials` — plain credential objects for
 *    tests that explicitly exercise the login UI (login.spec.ts).
 *
 * Why API login instead of cookie injection
 * ─────────────────────────────────────────
 * Injecting a raw session token only works if Better Auth stores the token
 * as-is in the database. In practice Better Auth may sign or transform the
 * token. Using the real sign-in endpoint lets Better Auth create the cookie
 * itself, which is always correct regardless of internal token handling.
 *
 * page.request shares the cookie jar with page, so cookies set by the API
 * response are immediately available for subsequent page.goto() calls.
 */

import { test as base, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Credentials {
  email: string;
  password: string;
}

async function loginViaApi(page: Page, email: string, password: string): Promise<void> {
  const response = await page.request.post('/api/auth/sign-in/email', {
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(
      `Auth fixture: sign-in failed for ${email} — ${response.status()} ${await response.text()}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

type AuthFixtures = {
  /** A page pre-authenticated as the admin test user. */
  adminPage: Page;
  /** A page pre-authenticated as the agent test user. */
  agentPage: Page;
  /** Admin credentials (email + password) sourced from env / defaults. */
  adminCredentials: Credentials;
  /** Agent credentials (email + password) sourced from env / defaults. */
  agentCredentials: Credentials;
};

// ---------------------------------------------------------------------------
// Extended test object
// ---------------------------------------------------------------------------

export const test = base.extend<AuthFixtures>({
  adminCredentials: async ({}, use) => {
    await use({
      email: process.env.ADMIN_EMAIL ?? 'admin@e2e.test',
      password: process.env.ADMIN_PASSWORD ?? 'TestAdmin123!',
    });
  },

  agentCredentials: async ({}, use) => {
    await use({
      email: process.env.AGENT_EMAIL ?? 'agent@e2e.test',
      password: process.env.AGENT_PASSWORD ?? 'TestAgent123!',
    });
  },

  adminPage: async ({ page }, use) => {
    await loginViaApi(page, 'admin@e2e.test', 'TestAdmin123!');
    await use(page);
  },

  agentPage: async ({ page }, use) => {
    await loginViaApi(page, 'agent@e2e.test', 'TestAgent123!');
    await use(page);
  },
});

export { expect } from '@playwright/test';
