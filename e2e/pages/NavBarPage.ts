/**
 * Page Object Model for the NavBar component.
 *
 * Selectors are anchored to the actual NavBar.tsx implementation:
 *   - App title:   Typography "AI Ticket System"
 *   - Users link:  Button "Users" — only rendered when user.role === 'ADMIN'
 *   - User name:   Typography showing data.user.name
 *   - Sign Out:    Button "Sign Out"
 *
 * NavBar is only rendered inside ProtectedRoute → AuthLayout, so it is never
 * present on the /login page.
 */

import { type Locator, type Page, expect } from '@playwright/test';

export class NavBarPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly appTitle: Locator;
  readonly usersLink: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appTitle = page.getByRole('banner').getByText('AI Ticket System');
    // NavLink is a MUI Button with component={Link} — renders as <a> (role="link")
    this.usersLink = page.getByRole('link', { name: 'Users' });
    this.signOutButton = page.getByRole('button', { name: 'Sign Out' });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async clickSignOut(): Promise<void> {
    await this.signOutButton.click();
  }

  async clickUsersLink(): Promise<void> {
    await this.usersLink.click();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectVisible(): Promise<void> {
    await expect(this.appTitle).toBeVisible();
    await expect(this.signOutButton).toBeVisible();
  }

  async expectUserName(name: string): Promise<void> {
    await expect(this.page.getByRole('banner').getByText(name)).toBeVisible();
  }

  async expectUsersLinkVisible(): Promise<void> {
    await expect(this.usersLink).toBeVisible();
  }

  async expectUsersLinkHidden(): Promise<void> {
    await expect(this.usersLink).not.toBeVisible();
  }
}
