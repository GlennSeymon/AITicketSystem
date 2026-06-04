/**
 * Page Object Model for the Users page (`/users`).
 *
 * Selectors are anchored to the actual UsersPage.tsx, CreateUserDialog.tsx,
 * and EditUserDialog.tsx implementations.
 *
 * UsersPage:
 *   - Heading:        Typography h5 "User Management"
 *   - Add button:     Button "Add User"
 *   - Table:          role="table" with columns: Name, Email, Role, Status, Actions
 *   - Edit button:    IconButton aria-label="Edit {name}"
 *   - Delete button:  IconButton aria-label="Delete {name}"
 *   - Status chip:    Chip with label "Active" or "Inactive"
 *   - Role chip:      Chip with label "Admin" or "Agent"
 *
 * CreateUserDialog:
 *   - Dialog:         role="dialog" with title "Add User"
 *   - Name:           TextField label="Name"
 *   - Email:          TextField label="Email"
 *   - Password:       TextField label="Password"
 *   - Role:           MUI Select with InputLabel="Role"
 *   - Cancel button:  Button "Cancel"
 *   - Submit button:  Button "Create"
 *   - Server error:   MUI Alert (role="alert") when mutation fails
 *
 * EditUserDialog:
 *   - Dialog:         role="dialog" with title "Edit User"
 *   - Name:           TextField label="Name"
 *   - Email:          TextField label="Email"
 *   - Role:           MUI Select with InputLabel="Role"
 *   - Active switch:  Switch label="Active" (role="switch")
 *   - Cancel button:  Button "Cancel"
 *   - Submit button:  Button "Save"
 *   - Server error:   MUI Alert (role="alert") when mutation fails
 *
 * DeleteConfirmDialog:
 *   - Dialog:         role="dialog" with title "Delete User"
 *   - Cancel button:  Button "Cancel"
 *   - Confirm button: Button "Delete"
 */

import { type Locator, type Page, expect } from '@playwright/test';

export class UsersPage {
  readonly page: Page;

  // ── Page-level locators ───────────────────────────────────────────────────
  readonly heading: Locator;
  readonly addUserButton: Locator;
  readonly table: Locator;

  // ── Shared dialog locator ─────────────────────────────────────────────────
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'User Management', level: 1 });
    this.addUserButton = page.getByRole('button', { name: 'Add User' });
    this.table = page.getByRole('table');
    this.dialog = page.getByRole('dialog');
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/users');
  }

  // ── Page assertions ───────────────────────────────────────────────────────

  async expectOnUsersPage(): Promise<void> {
    await expect(this.page).toHaveURL('/users');
    await expect(this.heading).toBeVisible();
  }

  async expectTableVisible(): Promise<void> {
    await expect(this.table).toBeVisible();
  }

  // ── Table row helpers ─────────────────────────────────────────────────────

  /**
   * Returns the first data row containing the given text (name or email).
   */
  getRowByText(text: string): Locator {
    return this.table.getByRole('row').filter({ hasText: text });
  }

  /**
   * Asserts that the table contains a row with the given text.
   */
  async expectRowVisible(text: string): Promise<void> {
    await expect(this.getRowByText(text)).toBeVisible();
  }

  /**
   * Asserts that the table does NOT contain a row with the given text.
   */
  async expectRowNotVisible(text: string): Promise<void> {
    await expect(this.getRowByText(text)).not.toBeVisible();
  }

  /**
   * Returns the Status chip ("Active" / "Inactive") within a given row.
   */
  getStatusChipInRow(row: Locator): Locator {
    // The table has two chip columns (Role, Status). The status chip is the
    // second chip in the row and contains "Active" or "Inactive".
    return row.getByText(/^(Active|Inactive)$/);
  }

  // ── Row action helpers ────────────────────────────────────────────────────

  /**
   * Clicks the Edit icon button for the user with the given name.
   */
  async clickEditForUser(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Edit ${name}` }).click();
    await expect(this.dialog).toBeVisible();
  }

  /**
   * Clicks the Delete icon button for the user with the given name.
   */
  async clickDeleteForUser(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(this.dialog).toBeVisible();
  }

  // ── Create dialog ─────────────────────────────────────────────────────────

  async openCreateDialog(): Promise<void> {
    await this.addUserButton.click();
    await expect(this.dialog).toBeVisible();
  }

  /**
   * Fills and submits the Create User dialog.
   * Role defaults to "Agent" if omitted.
   */
  async createUser(user: {
    name: string;
    email: string;
    password: string;
    role?: 'Admin' | 'Agent';
  }): Promise<void> {
    await this.openCreateDialog();
    await this.dialog.getByLabel('Name').fill(user.name);
    await this.dialog.getByLabel('Email').fill(user.email);
    await this.dialog.getByLabel('Password').fill(user.password);
    if (user.role) {
      await this.dialog.getByLabel('Role').click();
      await this.page.getByRole('option', { name: user.role }).click();
    }
    await this.dialog.getByRole('button', { name: 'Create' }).click();
    // Wait for the dialog to close, indicating success
    await expect(this.dialog).not.toBeVisible();
  }

  // ── Edit dialog ───────────────────────────────────────────────────────────

  /**
   * Opens the edit dialog for a user and updates the fields provided.
   * Omitting a field leaves it unchanged.
   */
  async editUser(
    name: string,
    updates: {
      name?: string;
      email?: string;
      role?: 'Admin' | 'Agent';
      isActive?: boolean;
    },
  ): Promise<void> {
    await this.clickEditForUser(name);

    if (updates.name !== undefined) {
      const nameInput = this.dialog.getByLabel('Name');
      await nameInput.clear();
      await nameInput.fill(updates.name);
    }
    if (updates.email !== undefined) {
      const emailInput = this.dialog.getByLabel('Email');
      await emailInput.clear();
      await emailInput.fill(updates.email);
    }
    if (updates.role !== undefined) {
      await this.dialog.getByLabel('Role').click();
      await this.page.getByRole('option', { name: updates.role }).click();
    }
    if (updates.isActive !== undefined) {
      const activeSwitch = this.dialog.getByRole('switch', { name: 'Active' });
      const isChecked = await activeSwitch.isChecked();
      if (isChecked !== updates.isActive) {
        await activeSwitch.click();
      }
    }

    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  // ── Delete dialog ─────────────────────────────────────────────────────────

  /**
   * Opens the delete confirmation dialog for a user and confirms deletion.
   */
  async deleteUser(name: string): Promise<void> {
    await this.clickDeleteForUser(name);
    await this.dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  /**
   * Opens the delete confirmation dialog for a user and cancels.
   */
  async cancelDeleteUser(name: string): Promise<void> {
    await this.clickDeleteForUser(name);
    await this.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  // ── Dialog assertions ─────────────────────────────────────────────────────

  async expectDialogOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogClosed(): Promise<void> {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectDialogContainsText(text: string): Promise<void> {
    await expect(this.dialog).toContainText(text);
  }
}
