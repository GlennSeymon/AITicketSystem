/**
 * Tickets — ticket-list spec
 *
 * Covers:
 *  1.  Unauthenticated visit to /tickets redirects to /login
 *  2.  Authenticated agent can navigate to /tickets via the nav link
 *  3.  Authenticated admin can navigate to /tickets via the nav link
 *  4.  Empty state: "No tickets yet." shown when no tickets exist
 *  5.  "Create Ticket" button opens the dialog
 *  6.  Submitting empty form shows validation errors on all required fields
 *  7.  Submitting invalid email shows email validation error
 *  8.  Successfully creating a ticket closes the dialog and shows it in the table
 *  9.  Created ticket appears with correct Subject, From, Status, Category, Date
 * 10.  Cancel button closes the dialog without creating a ticket
 *
 * Infrastructure notes:
 * - Backend runs on port 3002, frontend (Vite) on port 3001 (baseURL).
 * - The DB is wiped and re-seeded once before the full test run (global-setup.ts).
 *   It is NOT reset between individual tests, so tests must not rely on a clean
 *   ticket table. Tests that need the empty state use a dedicated agent page that
 *   signs in and checks before any ticket is created.
 * - For tests that need a pre-existing ticket, the ticket is created via the
 *   backend API directly using an authenticated session.
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';
import { TicketsPage } from '../pages/TicketsPage';

// ── 1 — Unauthenticated access redirects to /login ───────────────────────────

test.describe('Unauthenticated access', () => {
  test('visiting /tickets without a session redirects to /login', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page).toHaveURL('/login');
  });
});

// ── 2 & 3 — Nav link navigation ──────────────────────────────────────────────

test.describe('Navigation via the nav bar', () => {
  test('authenticated agent can navigate to /tickets via the nav link', async ({ agentPage }) => {
    await agentPage.goto('/');

    await agentPage.getByRole('link', { name: 'Tickets' }).click();

    await expect(agentPage).toHaveURL('/tickets');
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.expectOnTicketsPage();
  });

  test('authenticated admin can navigate to /tickets via the nav link', async ({ adminPage }) => {
    await adminPage.goto('/');

    await adminPage.getByRole('link', { name: 'Tickets' }).click();

    await expect(adminPage).toHaveURL('/tickets');
    const ticketsPage = new TicketsPage(adminPage);
    await ticketsPage.expectOnTicketsPage();
  });
});

// ── 4 — Empty state ───────────────────────────────────────────────────────────

test.describe('Empty state', () => {
  test('"No tickets yet." is shown when there are no tickets', async ({ agentPage }) => {
    // The DB is seeded fresh before the test run with no tickets, so the
    // empty state is visible at the start of the run. This test must run
    // before any ticket-creating test — serial execution (workers: 1)
    // and suite ordering guarantee this.
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();

    await ticketsPage.expectEmptyState();
  });
});

// ── 5 — Opening the dialog ────────────────────────────────────────────────────

test.describe('"Create Ticket" dialog', () => {
  test('"Create Ticket" button opens the dialog', async ({ agentPage }) => {
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();

    await ticketsPage.openDialog();

    await ticketsPage.expectDialogOpen();
  });

  // ── 10 — Cancel closes dialog ──────────────────────────────────────────────

  test('Cancel button closes the dialog without creating a ticket', async ({ agentPage }) => {
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();

    // Count rows before opening the dialog
    await ticketsPage.openDialog();
    await ticketsPage.fillSubject('Should not be created');
    await ticketsPage.fillFromName('Ghost User');
    await ticketsPage.fillFromEmail('ghost@example.com');
    await ticketsPage.fillMessage('This ticket should not appear.');

    await ticketsPage.closeDialogViaCancel();

    await ticketsPage.expectDialogClosed();
    // The subject must not appear in the table (or empty state is still shown)
    await expect(agentPage.getByText('Should not be created')).not.toBeVisible();
  });

  // ── 6 — Required-field validation ─────────────────────────────────────────

  test('submitting an empty form shows validation errors on all required fields', async ({
    agentPage,
  }) => {
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();
    await ticketsPage.openDialog();

    // Submit without filling anything
    await ticketsPage.submitDialog();

    // Each required field should show its zod error message
    await ticketsPage.expectFieldError('Subject is required');
    await ticketsPage.expectFieldError('From name is required');
    // fromEmail is validated as email — an empty string triggers the email error
    await ticketsPage.expectFieldError('Invalid email');
    await ticketsPage.expectFieldError('Body is required');

    // Dialog must remain open
    await ticketsPage.expectDialogOpen();
  });

  // ── 7 — Email format validation ───────────────────────────────────────────

  test('submitting an invalid email shows the email validation error', async ({
    agentPage,
  }) => {
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();
    await ticketsPage.openDialog();

    await ticketsPage.fillSubject('Test subject');
    await ticketsPage.fillFromName('Test User');
    await ticketsPage.fillFromEmail('not-an-email');
    await ticketsPage.fillMessage('Some message body here.');

    await ticketsPage.submitDialog();

    await ticketsPage.expectFieldError('Invalid email');

    // All other fields are valid — no other errors should appear
    await expect(agentPage.locator('p').filter({ hasText: 'Subject is required' })).not.toBeVisible();
    await expect(agentPage.locator('p').filter({ hasText: 'From name is required' })).not.toBeVisible();
    await expect(agentPage.locator('p').filter({ hasText: 'Body is required' })).not.toBeVisible();

    await ticketsPage.expectDialogOpen();
  });

  // ── 8 & 9 — Successful creation ───────────────────────────────────────────

  test('successfully creating a ticket closes the dialog and shows the ticket in the table', async ({
    agentPage,
  }) => {
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();
    await ticketsPage.openDialog();

    await ticketsPage.createTicket({
      subject: 'Help with my account',
      fromName: 'Alice Tester',
      fromEmail: 'alice@example.com',
      message: 'I cannot log in to my account. Please help.',
      category: 'General',
    });

    // Dialog closes on success
    await ticketsPage.expectDialogClosed();

    // Ticket table is now visible
    await ticketsPage.expectTableVisible();

    // The new row is present
    const row = ticketsPage.getRowBySubject('Help with my account');
    await expect(row).toBeVisible();
  });

  test('created ticket row shows correct Subject, From, Status, Category, and Date columns', async ({
    agentPage,
  }) => {
    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();
    await ticketsPage.openDialog();

    const today = new Date();
    const expectedDatePattern = today.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    await ticketsPage.createTicket({
      subject: 'Billing question for column check',
      fromName: 'Bob Checker',
      fromEmail: 'bob@example.com',
      message: 'I was charged twice this month.',
      category: 'Refund',
    });

    await ticketsPage.expectDialogClosed();

    const row = ticketsPage.getRowBySubject('Billing question for column check');
    await expect(row).toBeVisible();

    // Subject column
    await expect(row.getByText('Billing question for column check')).toBeVisible();

    // From column — rendered as "Bob Checker <bob@example.com>"
    await expect(row.getByText(/Bob Checker/)).toBeVisible();
    await expect(row.getByText(/bob@example\.com/)).toBeVisible();

    // Status column — MUI Chip with label "OPEN"
    await expect(row.getByText('OPEN')).toBeVisible();

    // Category column
    await expect(row.getByText('REFUND')).toBeVisible();

    // Date column — formatted as "Jun 4, 2026" (locale-dependent but matches today)
    await expect(row.getByText(expectedDatePattern)).toBeVisible();
  });
});
