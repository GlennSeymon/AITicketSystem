/**
 * Page Object Model for the Ticket Detail page (`/tickets/:id`).
 *
 * Selectors are anchored to the actual TicketDetailPage.tsx implementation.
 *
 * TicketDetailPage:
 *   - Back link:         Link "Back to Tickets" (React Router Link, role="link")
 *   - Subject heading:   Typography h1 with the ticket subject text
 *   - Messages section:  heading "Messages"
 *   - Message bubbles:   Paper elements containing sender name · datetime + body
 *   - Reply label:       heading "Reply"
 *   - Reply textarea:    TextField label="Reply" (multiline)
 *   - Send button:       Button "Send Reply"
 *   - Reply error:       Alert (role="alert") when the mutation fails
 *
 * TicketUpdate (right-hand column):
 *   - Status select:     combobox labelled "Status"   (SrOnlyLabel id="status-label")
 *   - Category select:   combobox labelled "Category" (SrOnlyLabel id="category-label")
 *   - Assigned to select:combobox labelled "Assigned to" (SrOnlyLabel id="assign-agent-label")
 */

import { type Locator, type Page, expect } from '@playwright/test';

export class TicketDetailPage {
  readonly page: Page;

  // ── Page-level locators ───────────────────────────────────────────────────
  readonly backLink: Locator;
  readonly messagesHeading: Locator;
  readonly replyHeading: Locator;
  readonly replyTextarea: Locator;
  readonly sendReplyButton: Locator;
  readonly replyError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backLink = page.getByRole('link', { name: 'Back to Tickets' });
    this.messagesHeading = page.getByRole('heading', { name: 'Replies' });
    this.replyHeading = page.getByRole('heading', { name: 'Reply' });
    this.replyTextarea = page.getByLabel('Reply');
    this.sendReplyButton = page.getByRole('button', { name: 'Send Reply' });
    this.replyError = page.getByRole('alert');
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(ticketId: number): Promise<void> {
    await this.page.goto(`/tickets/${ticketId}`);
  }

  async clickBack(): Promise<void> {
    await this.backLink.click();
  }

  // ── Page assertions ───────────────────────────────────────────────────────

  async expectOnDetailPage(ticketId: number): Promise<void> {
    await expect(this.page).toHaveURL(`/tickets/${ticketId}`);
    await expect(this.messagesHeading).toBeVisible();
  }

  async expectSubjectHeading(subject: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: subject, level: 1 })).toBeVisible();
  }

  // ── Message thread helpers ────────────────────────────────────────────────

  /**
   * Returns a locator for the paragraph element in the message thread whose
   * text matches the given pattern. MessageMeta renders as a <p> element and
   * contains the sender name and datetime separated by a middle dot.
   *
   * Example: /Test Agent.*\d+:\d{2}:\d{2}/
   */
  getMessageMeta(pattern: RegExp): Locator {
    return this.page.getByText(pattern);
  }

  // ── Reply form actions ────────────────────────────────────────────────────

  async fillReply(body: string): Promise<void> {
    await this.replyTextarea.fill(body);
  }

  async submitReply(): Promise<void> {
    await this.sendReplyButton.click();
  }

  async sendReply(body: string): Promise<void> {
    await this.fillReply(body);
    await this.submitReply();
  }

  // ── Reply form assertions ─────────────────────────────────────────────────

  async expectReplyTextareaEmpty(): Promise<void> {
    await expect(this.replyTextarea).toHaveValue('');
  }

  async expectReplyError(messageSubstring: string): Promise<void> {
    await expect(this.replyError).toBeVisible();
    await expect(this.replyError).toContainText(messageSubstring);
  }

  // ── TicketUpdate inline select helpers ────────────────────────────────────

  /**
   * Returns the combobox locator for the named inline-edit select.
   * The accessible name comes from the visually-hidden SrOnlyLabel rendered by
   * TicketUpdate.tsx (ids: "status-label", "category-label", "assign-agent-label").
   */
  getInlineSelect(labelName: 'Status' | 'Category' | 'Assigned to'): Locator {
    return this.page.getByRole('combobox', { name: labelName });
  }

  /**
   * Selects an option in one of the TicketUpdate inline Select fields.
   * Clicks the combobox to open the MUI dropdown, then clicks the option by
   * visible text. Waits for the listbox to close before returning.
   */
  async changeInlineSelect(
    labelName: 'Status' | 'Category' | 'Assigned to',
    optionText: string,
  ): Promise<void> {
    await this.getInlineSelect(labelName).click();
    await this.page.getByRole('option', { name: optionText }).click();
    // Wait for the listbox to close — indicates the selection was accepted
    await expect(this.page.getByRole('listbox')).toBeHidden();
  }

  /**
   * Asserts that the named inline-edit select currently displays the given
   * value text.
   */
  async expectInlineSelectValue(
    labelName: 'Status' | 'Category' | 'Assigned to',
    expectedText: string,
  ): Promise<void> {
    await expect(this.getInlineSelect(labelName)).toHaveText(expectedText);
  }
}
