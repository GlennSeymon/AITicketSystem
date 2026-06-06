/**
 * Ticket Detail — e2e tests (auth + routing + reply flow + inline field editing)
 *
 * Component-level tests (loading states, form validation) live in
 * frontend/src/pages/tickets/TicketDetailPage.test.tsx.
 *
 * Covers:
 *  1. Unauthenticated visit to /tickets/:id redirects to /login
 *  2. Clicking a ticket subject link on /tickets navigates to /tickets/:id
 *  3. Sending a reply appends it to the message thread with the agent's
 *     name and a datetime (h:mm:ss format)
 *  4. Inline field editing (Status, Category, Assigned to) persists after reload
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';
import { TicketsPage } from '../pages/TicketsPage';
import { TicketDetailPage } from '../pages/TicketDetailPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a ticket via the API and returns its numeric id.
 * Uses the provided authenticated page's request context so the session
 * cookie is automatically included.
 */
async function createTicketViaApi(
  page: import('@playwright/test').Page,
  subject: string,
): Promise<number> {
  const response = await page.request.post('/api/tickets', {
    data: {
      subject,
      fromName: 'E2E Tester',
      fromEmail: 'e2e@tester.example',
      body: 'This ticket was created by the e2e test suite.',
      category: 'TECHNICAL',
    },
  });
  if (!response.ok()) {
    throw new Error(
      `createTicketViaApi: POST /api/tickets failed — ${response.status()} ${await response.text()}`,
    );
  }
  const ticket = await response.json() as { id: number };
  return ticket.id;
}

// ---------------------------------------------------------------------------
// Unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Unauthenticated access', () => {
  test('visiting /tickets/:id without a session redirects to /login', async ({ page }) => {
    // Use a plausible ID; the redirect should happen before any data fetch.
    await page.goto('/tickets/1');
    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Navigation from the ticket list
// ---------------------------------------------------------------------------

test.describe('Navigation from the ticket list', () => {
  test('clicking a ticket subject link navigates to the detail page', async ({ agentPage }) => {
    const subject = 'E2E Nav Test — subject link';
    const ticketId = await createTicketViaApi(agentPage, subject);

    const ticketsPage = new TicketsPage(agentPage);
    await ticketsPage.goto();

    // The subject is rendered as a link inside the DataGrid
    const subjectLink = agentPage.getByRole('link', { name: subject });
    await expect(subjectLink).toBeVisible();
    await subjectLink.click();

    await expect(agentPage).toHaveURL(`/tickets/${ticketId}`);

    const detailPage = new TicketDetailPage(agentPage);
    await detailPage.expectSubjectHeading(subject);
  });
});

// ---------------------------------------------------------------------------
// Reply flow
// ---------------------------------------------------------------------------

test.describe('Reply flow', () => {
  test('submitting a reply appends it to the message thread', async ({ agentPage }) => {
    const subject = 'E2E Reply Flow — thread test';
    const ticketId = await createTicketViaApi(agentPage, subject);

    const detailPage = new TicketDetailPage(agentPage);
    await detailPage.goto(ticketId);
    await detailPage.expectOnDetailPage(ticketId);

    const replyBody = 'Hello, this is a test reply from the e2e suite.';
    await detailPage.sendReply(replyBody);

    // After successful submission the textarea is cleared
    await detailPage.expectReplyTextareaEmpty();

    // The reply body appears in the message thread
    await expect(agentPage.getByText(replyBody)).toBeVisible();

    // The agent's name (from seed.test.ts: 'Test Agent') appears in the thread
    // alongside a datetime that includes seconds (h:mm:ss pattern)
    const agentName = 'Test Agent';
    // The MessageMeta line reads: "<senderName> · <datetime>"
    // We match the agent name and a time-with-seconds pattern in the same region
    const metaPattern = new RegExp(`${agentName}.*\\d+:\\d{2}:\\d{2}`);
    await expect(agentPage.getByText(metaPattern)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Inline field editing
// ---------------------------------------------------------------------------

test.describe('Inline field editing', () => {
  test('changing the status select persists after reload', async ({ agentPage }) => {
    // Tickets are seeded with no explicit status; the backend default is OPEN.
    const ticketId = await createTicketViaApi(agentPage, 'E2E Status Edit — inline persist');

    const detailPage = new TicketDetailPage(agentPage);
    await detailPage.goto(ticketId);
    await detailPage.expectOnDetailPage(ticketId);

    // Change status from Open → Resolved
    await detailPage.changeInlineSelect('Status', 'Resolved');

    // Reload and confirm the value was persisted server-side
    await agentPage.reload();
    await detailPage.expectOnDetailPage(ticketId);
    await detailPage.expectInlineSelectValue('Status', 'Resolved');
  });

  test('changing the category select persists after reload', async ({ agentPage }) => {
    // Ticket is created with category TECHNICAL; change it to General.
    const ticketId = await createTicketViaApi(agentPage, 'E2E Category Edit — inline persist');

    const detailPage = new TicketDetailPage(agentPage);
    await detailPage.goto(ticketId);
    await detailPage.expectOnDetailPage(ticketId);

    // Change category from Technical → General
    await detailPage.changeInlineSelect('Category', 'General');

    // Reload and confirm the value was persisted server-side
    await agentPage.reload();
    await detailPage.expectOnDetailPage(ticketId);
    await detailPage.expectInlineSelectValue('Category', 'General');
  });

  test('assigning an agent persists after reload', async ({ agentPage }) => {
    // The seeded agent is named 'Test Agent' (from seed.test.ts).
    const ticketId = await createTicketViaApi(agentPage, 'E2E Agent Assign — inline persist');

    const detailPage = new TicketDetailPage(agentPage);
    await detailPage.goto(ticketId);
    await detailPage.expectOnDetailPage(ticketId);

    // Assign to Test Agent (ticket starts unassigned)
    await detailPage.changeInlineSelect('Assigned to', 'Test Agent');

    // Reload and confirm the assignment was persisted server-side
    await agentPage.reload();
    await detailPage.expectOnDetailPage(ticketId);
    await detailPage.expectInlineSelectValue('Assigned to', 'Test Agent');
  });
});
