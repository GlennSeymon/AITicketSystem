/**
 * Page Object Model for the Login page (`/login`).
 *
 * Selectors are anchored to the actual LoginPage.tsx implementation:
 *   - Email field:    MUI TextField with label "Email"
 *   - Password field: MUI TextField with label "Password"
 *   - Submit button:  MUI Button with text "Sign in" (or "Signing in…" while pending)
 *   - Server error:   MUI Alert rendered when Better Auth returns an error
 *   - Field errors:   MUI TextField helperText rendered by react-hook-form / zod
 *
 * The page heading is a Typography element with text "Sign in" — note this is
 * also the button label, so we scope heading checks to an `h5` role.
 */

import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly serverErrorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    // The button text alternates between "Sign in" and "Signing in…".
    // We match by role + exact name "Sign in" for the idle state, and expose
    // a separate helper for the loading state check.
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    // Better Auth errors are surfaced inside an MUI Alert (role="alert").
    this.serverErrorAlert = page.getByRole('alert');
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  // ── Field helpers ─────────────────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  // ── Compound actions ──────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL('/login');
    await expect(this.page.getByRole('heading', { name: 'Sign in', level: 5 })).toBeVisible();
  }

  async expectServerError(messageSubstring: string): Promise<void> {
    await expect(this.serverErrorAlert).toBeVisible();
    await expect(this.serverErrorAlert).toContainText(messageSubstring);
  }

  async expectFieldError(fieldName: 'email' | 'password', messageSubstring: string): Promise<void> {
    // react-hook-form renders helperText in a <p> immediately after the input.
    // The MUI TextField associates the helper text via aria-describedby, so
    // we locate the paragraph that contains the error text.
    const helperText = this.page.locator('p').filter({ hasText: messageSubstring });
    await expect(helperText).toBeVisible();
  }

  async expectSubmitButtonDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectLoadingState(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Signing in…' })).toBeVisible();
  }

  async expectRedirectedToHome(): Promise<void> {
    await expect(this.page).toHaveURL('/');
  }
}
