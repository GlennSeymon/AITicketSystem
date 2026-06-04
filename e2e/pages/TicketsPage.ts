/**
 * Page Object Model for the Tickets page (`/tickets`).
 *
 * Selectors are anchored to the actual TicketsPage.tsx and
 * CreateTicketDialog.tsx implementations.
 *
 * TicketsPage:
 *   - Heading:         Typography h5 "Tickets"
 *   - Create button:   Button "Create Ticket"
 *   - Empty state:     Typography "No tickets yet."
 *   - Ticket table:    role="table" with rows for each ticket
 *
 * CreateTicketDialog:
 *   - Dialog:          role="dialog"
 *   - Subject:         TextField label="Subject"
 *   - From Name:       TextField label="From Name"
 *   - From Email:      TextField label="From Email"
 *   - Message:         TextField label="Message"
 *   - Category:        MUI Select with InputLabel="Category"
 *   - Cancel button:   Button "Cancel"
 *   - Submit button:   Button "Create"
 *   - Server error:    MUI Alert (role="alert") when mutation fails
 */

import { type Locator, type Page, expect } from '@playwright/test';

export class TicketsPage {
  readonly page: Page;

  // ── Page-level locators ───────────────────────────────────────────────────
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly emptyState: Locator;
  readonly table: Locator;

  // ── Dialog locators ───────────────────────────────────────────────────────
  readonly dialog: Locator;
  readonly subjectInput: Locator;
  readonly fromNameInput: Locator;
  readonly fromEmailInput: Locator;
  readonly messageInput: Locator;
  readonly categorySelect: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;
  readonly dialogServerError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Tickets', level: 1 });
    this.createButton = page.getByRole('button', { name: 'Create Ticket' });
    this.emptyState = page.getByText('No tickets yet.');
    this.table = page.getByRole('table');

    // Dialog locators — scoped to the dialog for safety
    this.dialog = page.getByRole('dialog');
    this.subjectInput = this.dialog.getByLabel('Subject');
    this.fromNameInput = this.dialog.getByLabel('From Name');
    this.fromEmailInput = this.dialog.getByLabel('From Email');
    this.messageInput = this.dialog.getByLabel('Message');
    this.categorySelect = this.dialog.getByLabel('Category');
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.submitButton = this.dialog.getByRole('button', { name: 'Create' });
    this.dialogServerError = this.dialog.getByRole('alert');
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/tickets');
  }

  // ── Page assertions ───────────────────────────────────────────────────────

  async expectOnTicketsPage(): Promise<void> {
    await expect(this.page).toHaveURL('/tickets');
    await expect(this.heading).toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
    await expect(this.table).not.toBeVisible();
  }

  async expectTableVisible(): Promise<void> {
    await expect(this.table).toBeVisible();
    await expect(this.emptyState).not.toBeVisible();
  }

  // ── Dialog actions ────────────────────────────────────────────────────────

  async openDialog(): Promise<void> {
    await this.createButton.click();
    await expect(this.dialog).toBeVisible();
  }

  async closeDialogViaCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async fillSubject(value: string): Promise<void> {
    await this.subjectInput.fill(value);
  }

  async fillFromName(value: string): Promise<void> {
    await this.fromNameInput.fill(value);
  }

  async fillFromEmail(value: string): Promise<void> {
    await this.fromEmailInput.fill(value);
  }

  async fillMessage(value: string): Promise<void> {
    await this.messageInput.fill(value);
  }

  /**
   * Select a category option from the MUI Select dropdown.
   * Passing undefined or empty string selects "None".
   */
  async selectCategory(label: string): Promise<void> {
    await this.categorySelect.click();
    // MUI Select renders options as role="option" in a listbox
    await this.page.getByRole('option', { name: label }).click();
  }

  async submitDialog(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill all required fields and submit the dialog.
   */
  async createTicket(ticket: {
    subject: string;
    fromName: string;
    fromEmail: string;
    message: string;
    category?: string;
  }): Promise<void> {
    await this.fillSubject(ticket.subject);
    await this.fillFromName(ticket.fromName);
    await this.fillFromEmail(ticket.fromEmail);
    await this.fillMessage(ticket.message);
    if (ticket.category) {
      await this.selectCategory(ticket.category);
    }
    await this.submitDialog();
  }

  // ── Dialog assertions ─────────────────────────────────────────────────────

  async expectDialogOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogClosed(): Promise<void> {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectFieldError(messageSubstring: string): Promise<void> {
    // react-hook-form renders helperText in a <p> inside the dialog.
    const helperText = this.dialog.locator('p').filter({ hasText: messageSubstring });
    await expect(helperText).toBeVisible();
  }

  async expectServerError(messageSubstring: string): Promise<void> {
    await expect(this.dialogServerError).toBeVisible();
    await expect(this.dialogServerError).toContainText(messageSubstring);
  }

  // ── Table row helpers ─────────────────────────────────────────────────────

  /**
   * Returns all data rows (excludes the header row).
   * The first row returned by getByRole('row') is the header.
   */
  getDataRows(): Locator {
    return this.table.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  /**
   * Returns the first data row containing the given subject text.
   */
  getRowBySubject(subject: string): Locator {
    return this.table.getByRole('row').filter({ hasText: subject });
  }
}
