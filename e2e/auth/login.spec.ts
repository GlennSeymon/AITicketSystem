/**
 * Authentication — Login spec
 *
 * Covers:
 *  1. Happy path: admin can log in and lands on /
 *  2. Happy path: agent can log in and lands on /
 *  3. Invalid credentials: wrong password shows server error
 *  4. Invalid credentials: non-existent email shows server error
 *  5. Empty form submission: zod validation prevents API call, shows field errors
 *  6. Invalid email format: zod validation shows email field error
 *  7. Empty password only: zod validation shows password field error
 *  8. Unauthenticated visit to / redirects to /login
 *  9. Unauthenticated visit to /users redirects to /login
 * 10. Authenticated admin visiting /login is redirected to /
 * 11. Authenticated agent visiting /login is redirected to /
 * 12. Admin can access /users after login
 * 13. Agent is redirected away from /users (role-based access control)
 * 14. Admin sees "Users" nav link; agent does not
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';
import { LoginPage } from '../pages/LoginPage';
import { NavBarPage } from '../pages/NavBarPage';

// ── 1 & 2 — Happy path login ────────────────────────────────────────────────

test.describe('Happy path login', () => {
	test('admin can log in with valid credentials and lands on /', async ({
		page,
		adminCredentials,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.expectOnLoginPage();

		await loginPage.login(adminCredentials.email, adminCredentials.password);

		await expect(page).toHaveURL('/');
		const navBar = new NavBarPage(page);
		await navBar.expectVisible();
	});

	test('agent can log in with valid credentials and lands on /', async ({
		page,
		agentCredentials,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.expectOnLoginPage();

		await loginPage.login(agentCredentials.email, agentCredentials.password);

		await expect(page).toHaveURL('/');
		const navBar = new NavBarPage(page);
		await navBar.expectVisible();
	});

	test('login page shows user name in nav bar after successful login', async ({
		page,
		adminCredentials,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.login(adminCredentials.email, adminCredentials.password);

		await expect(page).toHaveURL('/');
		const navBar = new NavBarPage(page);
		await navBar.expectUserName('Test Admin');
	});
});

// ── 3 & 4 — Invalid credentials ────────────────────────────────────────────

test.describe('Invalid credentials', () => {
	test('wrong password shows a server error message', async ({
		page,
		adminCredentials,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await loginPage.login(adminCredentials.email, 'wrong-password-abc123');

		await loginPage.expectServerError('Invalid');
		// Must remain on /login
		await expect(page).toHaveURL('/login');
	});

	test('non-existent email shows a server error message', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await loginPage.login('nobody@example.com', 'SomePassword1!');

		await loginPage.expectServerError('Invalid');
		await expect(page).toHaveURL('/login');
	});

	test('server error is cleared when a new submission starts', async ({
		page,
		adminCredentials,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		// Trigger an error first
		await loginPage.login(adminCredentials.email, 'bad-password');
		await loginPage.expectServerError('Invalid');

		// Correct credentials — the error alert should disappear before navigation
		await loginPage.fillPassword(adminCredentials.password);
		await loginPage.submit();

		await expect(page).toHaveURL('/');
	});
});

// ── 5–7 — Client-side form validation ──────────────────────────────────────

test.describe('Form validation', () => {
	test('submitting an empty form shows required-field errors for both fields', async ({
		page,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		// Click submit without filling any fields
		await loginPage.submit();

		await loginPage.expectFieldError('email', 'Email is required');
		await loginPage.expectFieldError('password', 'Password is required');
		// Must stay on /login — no API call is made
		await expect(page).toHaveURL('/login');
	});

	test('invalid email format shows an email validation error', async ({
		page,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await loginPage.fillEmail('not-an-email');
		await loginPage.fillPassword('SomePassword1!');
		await loginPage.submit();

		await loginPage.expectFieldError('email', 'Invalid email address');
		await expect(page).toHaveURL('/login');
	});

	test('empty password with valid email shows password required error', async ({
		page,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await loginPage.fillEmail('user@example.com');
		// Leave password empty — do not call fillPassword
		await loginPage.submit();

		await loginPage.expectFieldError('password', 'Password is required');
		await expect(page).toHaveURL('/login');
	});

	test('empty email with valid password shows email required error', async ({
		page,
	}) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		// Leave email empty
		await loginPage.fillPassword('SomePassword1!');
		await loginPage.submit();

		await loginPage.expectFieldError('email', 'Email is required');
		await expect(page).toHaveURL('/login');
	});
});

// ── 8 & 9 — Unauthenticated access redirects to /login ─────────────────────

test.describe('Unauthenticated access is redirected to /login', () => {
	test('visiting / without a session redirects to /login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL('/login');
	});

	test('visiting /users without a session redirects to /login', async ({
		page,
	}) => {
		await page.goto('/users');
		await expect(page).toHaveURL('/login');
	});

	test('visiting an unknown route without a session redirects to /login', async ({
		page,
	}) => {
		// App.tsx: <Route path='*' element={<Navigate to='/' replace />} />
		// The wildcard navigates to / which is also protected, ending at /login.
		await page.goto('/some/random/path');
		await expect(page).toHaveURL('/login');
	});
});

// ── 10 & 11 — Already-authenticated user visiting /login is redirected ──────

test.describe('Authenticated user visiting /login is redirected away', () => {
	test('admin session — /login redirects to /', async ({ adminPage }) => {
		await adminPage.goto('/login');
		await expect(adminPage).toHaveURL('/');
	});

	test('agent session — /login redirects to /', async ({ agentPage }) => {
		await agentPage.goto('/login');
		await expect(agentPage).toHaveURL('/');
	});
});

// ── 12 & 13 — Role-based access to /users ──────────────────────────────────

test.describe('Role-based access control for /users', () => {
	test('admin can access /users', async ({ adminPage }) => {
		await adminPage.goto('/users');
		await expect(adminPage).toHaveURL('/users');
		await expect(
			adminPage.getByRole('heading', { name: 'Users' }),
		).toBeVisible();
	});

	test('agent is redirected from /users to /', async ({ agentPage }) => {
		await agentPage.goto('/users');
		// AdminRoute redirects non-admins to /
		await expect(agentPage).toHaveURL('/');
		// The Users heading must not be present
		await expect(
			agentPage.getByRole('heading', { name: 'Users' }),
		).not.toBeVisible();
	});
});

// ── 14 — Nav bar role-conditional links ────────────────────────────────────

test.describe('Nav bar role-conditional links', () => {
	test('admin sees the Users nav link', async ({ adminPage }) => {
		await adminPage.goto('/');
		const navBar = new NavBarPage(adminPage);
		await navBar.expectUsersLinkVisible();
	});

	test('agent does not see the Users nav link', async ({ agentPage }) => {
		await agentPage.goto('/');
		const navBar = new NavBarPage(agentPage);
		await navBar.expectUsersLinkHidden();
	});
});

// ── Home page content ───────────────────────────────────────────────────────

test.describe('Home page content after login', () => {
	test('home page shows welcome message with user name for admin', async ({
		adminPage,
	}) => {
		await adminPage.goto('/');
		await expect(
			adminPage.getByRole('heading', { name: 'Welcome, Test Admin', level: 5 }),
		).toBeVisible();
	});

	test('home page shows welcome message with user name for agent', async ({
		agentPage,
	}) => {
		await agentPage.goto('/');
		await expect(
			agentPage.getByRole('heading', { name: 'Welcome, Test Agent', level: 5 }),
		).toBeVisible();
	});
});
