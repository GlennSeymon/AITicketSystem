import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import UsersPage from './UsersPage';
import { getUsers, createUser, updateUser, deleteUser } from '../services/users';
import type { User } from '../services/users';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../services/users');

const mockUsers: User[] = [
	{
		id: '1',
		name: 'Alice Admin',
		email: 'alice@example.com',
		role: 'ADMIN',
		isActive: true,
		createdAt: '2024-01-01T00:00:00.000Z',
	},
	{
		id: '2',
		name: 'Bob Agent',
		email: 'bob@example.com',
		role: 'AGENT',
		isActive: false,
		createdAt: '2024-01-01T00:00:00.000Z',
	},
];

describe('UsersPage', () => {
	beforeEach(() => {
		vi.mocked(getUsers).mockResolvedValue(mockUsers);
		vi.mocked(createUser).mockResolvedValue({ ...mockUsers[0], id: '3', name: 'New User' });
		vi.mocked(updateUser).mockResolvedValue(mockUsers[1]);
		vi.mocked(deleteUser).mockResolvedValue(undefined);
	});

	describe('loading state', () => {
		it('shows a skeleton table with column headers while data is loading', () => {
			vi.mocked(getUsers).mockImplementation(() => new Promise(() => {}));
			renderWithProviders(<UsersPage />);
			expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
			expect(screen.getAllByRole('row')).toHaveLength(6); // 1 header + 5 skeleton rows
			expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /add user/i })).not.toBeInTheDocument();
		});
	});

	describe('error state', () => {
		it('shows an error alert when the fetch fails', async () => {
			vi.mocked(getUsers).mockRejectedValue(new Error('Network error'));
			renderWithProviders(<UsersPage />);
			expect(await screen.findByText('Failed to load users.')).toBeInTheDocument();
		});
	});

	describe('table display', () => {
		it('renders user names and emails', async () => {
			renderWithProviders(<UsersPage />);
			expect(await screen.findByText('Alice Admin')).toBeInTheDocument();
			expect(screen.getByText('alice@example.com')).toBeInTheDocument();
			expect(screen.getByText('Bob Agent')).toBeInTheDocument();
			expect(screen.getByText('bob@example.com')).toBeInTheDocument();
		});

		it('shows the correct role chip for each user', async () => {
			renderWithProviders(<UsersPage />);
			await screen.findByText('Alice Admin');
			expect(screen.getByText('Admin')).toBeInTheDocument();
			expect(screen.getByText('Agent')).toBeInTheDocument();
		});

		it('shows the correct status chip for each user', async () => {
			renderWithProviders(<UsersPage />);
			await screen.findByText('Alice Admin');
			const rows = screen.getAllByRole('row');
			const aliceRow = rows.find((r) => within(r).queryByText('Alice Admin'));
			const bobRow = rows.find((r) => within(r).queryByText('Bob Agent'));
			expect(within(aliceRow!).getByText('Active')).toBeInTheDocument();
			expect(within(bobRow!).getByText('Inactive')).toBeInTheDocument();
		});
	});

	describe('create user', () => {
		it('opens the create dialog when "Add User" is clicked', async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Alice Admin');
			await user.click(screen.getByRole('button', { name: /add user/i }));
			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(within(screen.getByRole('dialog')).getByText('Add User')).toBeInTheDocument();
		});

		it('shows validation errors when submitting an empty form', async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Alice Admin');
			await user.click(screen.getByRole('button', { name: /add user/i }));
			await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /create/i }));
			expect(await screen.findByText('Name is required')).toBeInTheDocument();
			expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
		});

		it('calls createUser with form data and closes the dialog on success', async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Alice Admin');
			await user.click(screen.getByRole('button', { name: /add user/i }));
			const dialog = screen.getByRole('dialog');
			await user.type(within(dialog).getByLabelText('Name'), 'Charlie');
			await user.type(within(dialog).getByLabelText('Email'), 'charlie@example.com');
			await user.type(within(dialog).getByLabelText('Password'), 'password123');
			await user.click(within(dialog).getByRole('button', { name: /create/i }));
			await waitFor(() =>
				// TanStack Query passes a mutation context as the second arg when mutationFn is a direct reference
				expect(createUser).toHaveBeenCalledWith(
					{ name: 'Charlie', email: 'charlie@example.com', password: 'password123', role: 'AGENT' },
					expect.anything()
				)
			);
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		});

		it('shows a server error in the dialog when creation fails', async () => {
			vi.mocked(createUser).mockRejectedValue(new Error('Email already in use'));
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Alice Admin');
			await user.click(screen.getByRole('button', { name: /add user/i }));
			const dialog = screen.getByRole('dialog');
			await user.type(within(dialog).getByLabelText('Name'), 'Charlie');
			await user.type(within(dialog).getByLabelText('Email'), 'charlie@example.com');
			await user.type(within(dialog).getByLabelText('Password'), 'password123');
			await user.click(within(dialog).getByRole('button', { name: /create/i }));
			expect(await screen.findByText('Email already in use')).toBeInTheDocument();
		});
	});

	describe('edit user', () => {
		it("opens the edit dialog pre-populated with the user's data", async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Bob Agent');
			await user.click(screen.getByRole('button', { name: /edit bob agent/i }));
			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Bob Agent')).toBeInTheDocument();
			expect(screen.getByDisplayValue('bob@example.com')).toBeInTheDocument();
		});

		it("reflects the user's active status in the toggle", async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Bob Agent');
			await user.click(screen.getByRole('button', { name: /edit bob agent/i }));
			const toggle = within(screen.getByRole('dialog')).getByRole('switch', { name: /active/i });
			expect(toggle).not.toBeChecked();
		});

		it('calls updateUser with updated data and closes the dialog', async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Bob Agent');
			await user.click(screen.getByRole('button', { name: /edit bob agent/i }));
			const nameInput = screen.getByDisplayValue('Bob Agent');
			await user.clear(nameInput);
			await user.type(nameInput, 'Bob Updated');
			await user.click(screen.getByRole('button', { name: /save/i }));
			await waitFor(() =>
				expect(updateUser).toHaveBeenCalledWith('2', expect.objectContaining({ name: 'Bob Updated' }))
			);
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		});
	});

	describe('delete user', () => {
		it("opens the delete confirmation dialog with the user's details", async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Bob Agent');
			await user.click(screen.getByRole('button', { name: /delete bob agent/i }));
			const dialog = screen.getByRole('dialog');
			expect(within(dialog).getByText(/bob agent/i)).toBeInTheDocument();
			expect(within(dialog).getByText(/bob@example.com/i)).toBeInTheDocument();
		});

		it('calls deleteUser and closes the dialog when confirmed', async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Bob Agent');
			await user.click(screen.getByRole('button', { name: /delete bob agent/i }));
			await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }));
			await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('2'));
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		});

		it('does not call deleteUser when cancelled', async () => {
			const { user } = renderWithProviders(<UsersPage />);
			await screen.findByText('Bob Agent');
			await user.click(screen.getByRole('button', { name: /delete bob agent/i }));
			await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i }));
			expect(deleteUser).not.toHaveBeenCalled();
		});
	});
});
