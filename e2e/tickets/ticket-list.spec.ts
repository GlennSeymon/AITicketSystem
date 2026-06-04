/**
 * Tickets — e2e tests (auth + routing concerns only)
 *
 * Component-level tests (empty state, dialog, form validation, create,
 * cancel) live in frontend/src/pages/tickets/TicketsPage.test.tsx.
 *
 * Covers:
 *  1. Unauthenticated visit to /tickets redirects to /login
 *  2. Authenticated agent can navigate to /tickets via the nav link
 *  3. Authenticated admin can navigate to /tickets via the nav link
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';
import { TicketsPage } from '../pages/TicketsPage';

test.describe('Unauthenticated access', () => {
	test('visiting /tickets without a session redirects to /login', async ({ page }) => {
		await page.goto('/tickets');
		await expect(page).toHaveURL('/login');
	});
});

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
