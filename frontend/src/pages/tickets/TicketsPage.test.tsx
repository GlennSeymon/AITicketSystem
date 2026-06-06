import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import TicketsPage from './TicketsPage';
import { getTickets, createTicket } from '../../services/tickets';
import type { Ticket } from '../../services/tickets';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../services/tickets');

const ticketDefaults = { body: '', replies: [], assignedAgent: null };

const mockTickets: Ticket[] = [
	{
		...ticketDefaults,
		id: 1,
		subject: 'Cannot access module 3',
		fromName: 'Alice Tester',
		fromEmail: 'alice@example.com',
		status: 'OPEN',
		category: 'TECHNICAL',
		createdAt: '2026-06-04T00:00:00.000Z',
		updatedAt: '2026-06-04T00:00:00.000Z',
	},
	{
		...ticketDefaults,
		id: 2,
		subject: 'Refund request',
		fromName: 'Bob Checker',
		fromEmail: 'bob@example.com',
		status: 'RESOLVED',
		category: null,
		createdAt: '2026-06-04T00:00:00.000Z',
		updatedAt: '2026-06-04T00:00:00.000Z',
	},
];

const newTicket: Ticket = {
	...ticketDefaults,
	id: 3,
	subject: 'New ticket subject',
	fromName: 'Charlie New',
	fromEmail: 'charlie@example.com',
	status: 'OPEN',
	category: 'GENERAL',
	createdAt: '2026-06-04T00:00:00.000Z',
	updatedAt: '2026-06-04T00:00:00.000Z',
};

const mockResponse = { data: mockTickets, total: 2 };

describe('TicketsPage', () => {
	beforeEach(() => {
		vi.mocked(getTickets).mockResolvedValue(mockResponse);
		vi.mocked(createTicket).mockResolvedValue(newTicket);
	});

	describe('loading state', () => {
		it('shows column headers and the create button while data is loading', () => {
			vi.mocked(getTickets).mockImplementation(() => new Promise(() => {}));
			renderWithProviders(<TicketsPage />);
			// DataGrid renders column headers immediately, even while loading
			expect(screen.getByRole('columnheader', { name: 'Subject' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'From' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
			// Page header (with Create Ticket button) is always visible
			expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
		});
	});

	describe('error state', () => {
		it('shows an error alert when the fetch fails', async () => {
			vi.mocked(getTickets).mockRejectedValue(new Error('Network error'));
			renderWithProviders(<TicketsPage />);
			expect(await screen.findByText('Failed to load tickets.')).toBeInTheDocument();
		});
	});

	describe('empty state', () => {
		it('shows "No tickets yet." when there are no tickets', async () => {
			vi.mocked(getTickets).mockResolvedValue({ data: [], total: 0 });
			renderWithProviders(<TicketsPage />);
			expect(await screen.findByText('No tickets yet.')).toBeInTheDocument();
		});
	});

	describe('server-side pagination', () => {
		it('fetches with default page 0 and pageSize 10 on initial render', async () => {
			renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			expect(getTickets).toHaveBeenCalledWith(
				expect.objectContaining({ page: 0, pageSize: 10 })
			);
		});
	});

	describe('server-side sorting', () => {
		it('fetches with default sort (createdAt desc) on initial render', async () => {
			renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			expect(getTickets).toHaveBeenCalledWith(
				expect.objectContaining({ sortField: 'createdAt', sortOrder: 'desc' })
			);
		});

		it('refetches with updated sort params when a column header is clicked', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('columnheader', { name: 'Subject' }));
			await waitFor(() =>
				expect(getTickets).toHaveBeenCalledWith(
					expect.objectContaining({ sortField: 'subject', sortOrder: 'asc' })
				)
			);
		});
	});

	describe('filtering', () => {
		it('renders the Status and Category filter dropdowns', async () => {
			renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByLabelText('Status')).toBeInTheDocument();
			expect(screen.getByLabelText('Category')).toBeInTheDocument();
		});

		it('refetches with status param when a status filter is selected', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByLabelText('Status'));
			await user.click(screen.getByRole('option', { name: 'OPEN' }));
			await waitFor(() =>
				expect(getTickets).toHaveBeenCalledWith(
					expect.objectContaining({ status: 'OPEN' })
				)
			);
		});

		it('refetches with category param when a category filter is selected', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByLabelText('Category'));
			await user.click(screen.getByRole('option', { name: 'TECHNICAL' }));
			await waitFor(() =>
				expect(getTickets).toHaveBeenCalledWith(
					expect.objectContaining({ category: 'TECHNICAL' })
				)
			);
		});

		it('clears the status filter when "All" is selected', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByLabelText('Status'));
			await user.click(screen.getByRole('option', { name: 'OPEN' }));
			await user.click(screen.getByLabelText('Status'));
			await user.click(screen.getByRole('option', { name: 'All' }));
			await waitFor(() =>
				expect(getTickets).toHaveBeenCalledWith(
					expect.objectContaining({ status: undefined })
				)
			);
		});
	});

	describe('table display', () => {
		it('renders subject and from name/email for each ticket', async () => {
			renderWithProviders(<TicketsPage />);
			expect(await screen.findByText('Cannot access module 3')).toBeInTheDocument();
			expect(screen.getByText(/Alice Tester/)).toBeInTheDocument();
			expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
			expect(screen.getByText('Refund request')).toBeInTheDocument();
		});

		it('renders status chips for each ticket', async () => {
			renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText('OPEN')).toBeInTheDocument();
			expect(screen.getByText('RESOLVED')).toBeInTheDocument();
		});

		it('renders the category value or a dash when category is null', async () => {
			renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText('TECHNICAL')).toBeInTheDocument();
			expect(screen.getByText('—')).toBeInTheDocument();
		});
	});

	describe('"Create Ticket" dialog', () => {
		it('opens the dialog when "Create Ticket" is clicked', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('button', { name: /create ticket/i }));
			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(within(screen.getByRole('dialog')).getByText('Create Ticket')).toBeInTheDocument();
		});

		it('shows required-field validation errors when submitting an empty form', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('button', { name: /create ticket/i }));
			await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^create$/i }));
			expect(await screen.findByText('Subject is required')).toBeInTheDocument();
			expect(screen.getByText('From name is required')).toBeInTheDocument();
			expect(screen.getByText('Invalid email')).toBeInTheDocument();
			expect(screen.getByText('Body is required')).toBeInTheDocument();
		});

		it('shows the email validation error when an invalid email is entered', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('button', { name: /create ticket/i }));
			const dialog = screen.getByRole('dialog');
			await user.type(within(dialog).getByLabelText('Subject'), 'A subject');
			await user.type(within(dialog).getByLabelText('From Name'), 'A name');
			await user.type(within(dialog).getByLabelText('From Email'), 'not-an-email');
			await user.type(within(dialog).getByLabelText('Message'), 'A body');
			await user.click(within(dialog).getByRole('button', { name: /^create$/i }));
			expect(await screen.findByText('Invalid email')).toBeInTheDocument();
			expect(screen.queryByText('Subject is required')).not.toBeInTheDocument();
			expect(screen.queryByText('Body is required')).not.toBeInTheDocument();
		});

		it('calls createTicket with form data and closes the dialog on success', async () => {
			vi.mocked(getTickets)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({ data: [...mockTickets, newTicket], total: 3 });
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('button', { name: /create ticket/i }));
			const dialog = screen.getByRole('dialog');
			await user.type(within(dialog).getByLabelText('Subject'), 'New ticket subject');
			await user.type(within(dialog).getByLabelText('From Name'), 'Charlie New');
			await user.type(within(dialog).getByLabelText('From Email'), 'charlie@example.com');
			await user.type(within(dialog).getByLabelText('Message'), 'Message body here.');
			await user.click(within(dialog).getByRole('button', { name: /^create$/i }));
			await waitFor(() =>
				expect(createTicket).toHaveBeenCalledWith(
					expect.objectContaining({
						subject: 'New ticket subject',
						fromName: 'Charlie New',
						fromEmail: 'charlie@example.com',
						body: 'Message body here.',
					}),
					expect.anything()
				)
			);
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		});

		it('closes the dialog without calling createTicket when Cancel is clicked', async () => {
			const { user } = renderWithProviders(<TicketsPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('button', { name: /create ticket/i }));
			const dialog = screen.getByRole('dialog');
			await user.type(within(dialog).getByLabelText('Subject'), 'Should not be saved');
			await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			expect(createTicket).not.toHaveBeenCalled();
		});
	});
});
