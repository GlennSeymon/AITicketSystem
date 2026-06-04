/**
 * Users page — full-stack CRUD e2e tests
 *
 * These tests exercise the entire request path: browser → Vite proxy →
 * Express API → PostgreSQL → React re-render. Component-level concerns
 * (loading states, client-side validation, dialog open/close, cancel
 * behaviour) are covered by the Vitest component test at:
 *   frontend/src/pages/users/UsersPage.test.tsx
 *
 * Covers:
 *  1. Admin sees the two seeded users in the table
 *  2. Admin can create a new user (full form → API → appears in table)
 *  3. Admin can edit a user's name (pre-filled form → change → save → updated in table)
 *  4. Admin can toggle a user's active status (edit dialog switch → save → chip updates)
 *  5. Admin can delete a user (confirmation → confirm → user gone from table)
 *  6. Delete confirmation dialog shows the target user's name and email
 *  7. Cancelling delete leaves the user in the table
 *
 * Skipped (already in e2e/auth/login.spec.ts):
 *  - Unauthenticated visit to /users redirects to /login
 *  - Agent is redirected from /users to /
 *
 * Test isolation strategy
 * ───────────────────────
 * The DB is seeded once before the entire Playwright run and is NOT reset
 * between individual tests. To avoid cross-test contamination:
 *  - Mutating tests (create/edit/delete) use unique timestamped emails so
 *    they never collide with each other or the seed accounts.
 *  - The two seed accounts (admin@e2e.test, agent@e2e.test) are relied on
 *    only for the read-only "sees seeded users" test. All other tests operate
 *    on freshly created users.
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';
import { UsersPage } from '../pages/UsersPage';

// ── 1 — Admin sees seeded users in the table ───────────────────────────────

test.describe('Read: seeded users are visible', () => {
	test('admin sees both seed accounts in the users table', async ({ adminPage }) => {
		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();
		await usersPage.expectOnUsersPage();
		await usersPage.expectTableVisible();

		// Both seed accounts must appear
		await usersPage.expectRowVisible('admin@e2e.test');
		await usersPage.expectRowVisible('agent@e2e.test');
	});

	test('table columns are rendered with the correct headers', async ({ adminPage }) => {
		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		const table = usersPage.table;
		await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Email' })).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Role' })).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
		await expect(table.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
	});

	test('admin seed account row shows Admin role chip and Active status chip', async ({ adminPage }) => {
		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		const adminRow = usersPage.getRowByText('admin@e2e.test');
		await expect(adminRow.getByText('Admin', { exact: true })).toBeVisible();
		await expect(adminRow.getByText('Active', { exact: true })).toBeVisible();
	});

	test('agent seed account row shows Agent role chip and Active status chip', async ({ adminPage }) => {
		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		const agentRow = usersPage.getRowByText('agent@e2e.test');
		await expect(agentRow.getByText('Agent', { exact: true })).toBeVisible();
		await expect(agentRow.getByText('Active', { exact: true })).toBeVisible();
	});
});

// ── 2 — Create user ────────────────────────────────────────────────────────

test.describe('Create: admin can create a new user', () => {
	test('creating a new agent user adds the user to the table', async ({ adminPage }) => {
		const email = `new-agent-${Date.now()}@example.com`;
		const name = 'New Agent User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		await usersPage.createUser({
			name,
			email,
			password: 'SecurePass1!',
			role: 'Agent',
		});

		// After dialog closes, the table should be refreshed and the new row visible
		await usersPage.expectRowVisible(email);
		const newRow = usersPage.getRowByText(email);
		await expect(newRow.getByText(name)).toBeVisible();
		await expect(newRow.getByText('Agent', { exact: true })).toBeVisible();
		await expect(newRow.getByText('Active', { exact: true })).toBeVisible();
	});

	test('creating a new admin user shows the Admin role chip', async ({ adminPage }) => {
		const email = `new-admin-${Date.now()}@example.com`;
		const name = 'New Admin User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		await usersPage.createUser({
			name,
			email,
			password: 'SecurePass1!',
			role: 'Admin',
		});

		await usersPage.expectRowVisible(email);
		const newRow = usersPage.getRowByText(email);
		await expect(newRow.getByText('Admin', { exact: true })).toBeVisible();
	});
});

// ── 3 — Edit name ──────────────────────────────────────────────────────────

test.describe('Edit: admin can update a user\'s name', () => {
	test('saving an edited name updates the name in the table row', async ({ adminPage }) => {
		// Create a throwaway user to edit so we do not mutate the seed accounts
		const email = `edit-name-${Date.now()}@example.com`;
		const originalName = 'Edit Name Original';
		const updatedName = 'Edit Name Updated';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		// Create the user first
		await usersPage.createUser({ name: originalName, email, password: 'SecurePass1!' });
		await usersPage.expectRowVisible(email);

		// Now edit the name
		await usersPage.editUser(originalName, { name: updatedName });

		// Updated name should appear in the table; original name should be gone from that row
		await usersPage.expectRowVisible(email);
		const editedRow = usersPage.getRowByText(email);
		await expect(editedRow.getByText(updatedName)).toBeVisible();
		await expect(editedRow.getByText(originalName)).not.toBeVisible();
	});
});

// ── 4 — Toggle active status ───────────────────────────────────────────────

test.describe('Edit: admin can toggle a user\'s active status', () => {
	test('toggling Active off changes the Status chip to Inactive', async ({ adminPage }) => {
		const email = `toggle-active-${Date.now()}@example.com`;
		const name = 'Toggle Active User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		// Create the user (new users are active by default)
		await usersPage.createUser({ name, email, password: 'SecurePass1!' });
		await usersPage.expectRowVisible(email);

		// Verify initial state
		const row = usersPage.getRowByText(email);
		await expect(row.getByText('Active', { exact: true })).toBeVisible();

		// Toggle inactive
		await usersPage.editUser(name, { isActive: false });

		// Status chip must now read "Inactive"
		const updatedRow = usersPage.getRowByText(email);
		await expect(updatedRow.getByText('Inactive', { exact: true })).toBeVisible();
		await expect(updatedRow.getByText('Active', { exact: true })).not.toBeVisible();
	});

	test('toggling Active back on changes the Status chip to Active', async ({ adminPage }) => {
		const email = `toggle-reactivate-${Date.now()}@example.com`;
		const name = 'Toggle Reactivate User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		// Create, then immediately deactivate
		await usersPage.createUser({ name, email, password: 'SecurePass1!' });
		await usersPage.editUser(name, { isActive: false });

		const row = usersPage.getRowByText(email);
		await expect(row.getByText('Inactive', { exact: true })).toBeVisible();

		// Re-activate
		await usersPage.editUser(name, { isActive: true });

		const updatedRow = usersPage.getRowByText(email);
		await expect(updatedRow.getByText('Active', { exact: true })).toBeVisible();
		await expect(updatedRow.getByText('Inactive', { exact: true })).not.toBeVisible();
	});
});

// ── 5 — Delete user ────────────────────────────────────────────────────────

test.describe('Delete: admin can delete a user', () => {
	test('confirming deletion removes the user from the table', async ({ adminPage }) => {
		const email = `delete-me-${Date.now()}@example.com`;
		const name = 'Delete Me User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		await usersPage.createUser({ name, email, password: 'SecurePass1!' });
		await usersPage.expectRowVisible(email);

		await usersPage.deleteUser(name);

		await usersPage.expectRowNotVisible(email);
	});
});

// ── 6 — Delete confirmation dialog content ─────────────────────────────────

test.describe('Delete: confirmation dialog shows user details', () => {
	test('delete dialog contains the target user\'s name and email', async ({ adminPage }) => {
		const email = `delete-confirm-${Date.now()}@example.com`;
		const name = 'Delete Confirm User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		await usersPage.createUser({ name, email, password: 'SecurePass1!' });
		await usersPage.expectRowVisible(email);

		// Open the delete dialog but do not confirm
		await usersPage.clickDeleteForUser(name);

		// Dialog should show both name and email in its body text
		await usersPage.expectDialogContainsText(name);
		await usersPage.expectDialogContainsText(email);

		// Clean up: cancel so we do not leave a stale open dialog
		await usersPage.dialog.getByRole('button', { name: 'Cancel' }).click();
		await usersPage.expectDialogClosed();
	});
});

// ── 7 — Cancel delete ─────────────────────────────────────────────────────

test.describe('Delete: cancelling leaves the user in the table', () => {
	test('cancelling the delete confirmation keeps the user in the table', async ({ adminPage }) => {
		const email = `delete-cancel-${Date.now()}@example.com`;
		const name = 'Delete Cancel User';

		const usersPage = new UsersPage(adminPage);
		await usersPage.goto();

		await usersPage.createUser({ name, email, password: 'SecurePass1!' });
		await usersPage.expectRowVisible(email);

		await usersPage.cancelDeleteUser(name);

		// User must still be in the table
		await usersPage.expectRowVisible(email);
	});
});
