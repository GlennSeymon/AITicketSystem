/**
 * Authentication — Logout spec
 *
 * Covers:
 *  1. Admin can sign out — session cookie is cleared and user lands on /login
 *  2. Agent can sign out — session cookie is cleared and user lands on /login
 *  3. After sign out, navigating to / redirects back to /login (session gone)
 *  4. After sign out, the nav bar is no longer visible
 *  5. After sign out, visiting /login does NOT redirect (session gone)
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';
import { NavBarPage } from '../pages/NavBarPage';
import { LoginPage } from '../pages/LoginPage';

test.describe('Sign out', () => {
  test('admin can sign out and is redirected to /login', async ({ adminPage }) => {
    await adminPage.goto('/');
    const navBar = new NavBarPage(adminPage);
    await navBar.expectVisible();

    await navBar.clickSignOut();

    await expect(adminPage).toHaveURL('/login');
  });

  test('agent can sign out and is redirected to /login', async ({ agentPage }) => {
    await agentPage.goto('/');
    const navBar = new NavBarPage(agentPage);
    await navBar.expectVisible();

    await navBar.clickSignOut();

    await expect(agentPage).toHaveURL('/login');
  });

  test('after sign out, navigating to / redirects back to /login', async ({ adminPage }) => {
    // Sign out
    await adminPage.goto('/');
    const navBar = new NavBarPage(adminPage);
    await navBar.clickSignOut();
    await expect(adminPage).toHaveURL('/login');

    // Now try to navigate directly to the protected home route
    await adminPage.goto('/');
    await expect(adminPage).toHaveURL('/login');
  });

  test('after sign out, the nav bar is not present on /login', async ({ agentPage }) => {
    await agentPage.goto('/');
    const navBar = new NavBarPage(agentPage);
    await navBar.clickSignOut();
    await expect(agentPage).toHaveURL('/login');

    // NavBar is only rendered inside AuthLayout (inside ProtectedRoute), so
    // after sign-out the app shows the LoginPage which has no NavBar.
    await expect(agentPage.getByRole('banner')).not.toBeAttached();
  });

  test('after sign out, visiting /login does not redirect away', async ({ adminPage }) => {
    // Sign out first
    await adminPage.goto('/');
    const navBar = new NavBarPage(adminPage);
    await navBar.clickSignOut();
    await expect(adminPage).toHaveURL('/login');

    // Navigate to /login explicitly — should stay there, not bounce to /
    await adminPage.goto('/login');
    const loginPage = new LoginPage(adminPage);
    await loginPage.expectOnLoginPage();
  });

  test('after sign out, visiting /users redirects to /login', async ({ adminPage }) => {
    await adminPage.goto('/');
    const navBar = new NavBarPage(adminPage);
    await navBar.clickSignOut();
    await expect(adminPage).toHaveURL('/login');

    await adminPage.goto('/users');
    await expect(adminPage).toHaveURL('/login');
  });

  test('sign out button triggers sign-out even from a deep admin route', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await expect(adminPage).toHaveURL('/users');

    const navBar = new NavBarPage(adminPage);
    await navBar.clickSignOut();

    await expect(adminPage).toHaveURL('/login');
  });
});
