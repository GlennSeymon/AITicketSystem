import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import TicketDetailPage from './TicketDetailPage';
import { getTicket, updateTicket, createReply } from '../../services/tickets';
import type { TicketDetail, Ticket, Reply } from '../../services/tickets';
import { getAgents } from '../../services/agents';
import type { Agent } from '../../services/agents';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('react-router-dom', () => ({
	useParams: vi.fn(() => ({ id: '1' })),
	Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={String(to)}>{children}</a>,
	MemoryRouter: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../services/tickets');
vi.mock('../../services/agents');

const mockAgents: Agent[] = [
	{ id: 'agent-1', name: 'Agent Alice', email: 'agent-alice@example.com' },
	{ id: 'agent-2', name: 'Agent Bob', email: 'agent-bob@example.com' },
];

const mockTicket: TicketDetail = {
	id: 1,
	subject: 'Cannot access module 3',
	fromEmail: 'alice@example.com',
	fromName: 'Alice Tester',
	status: 'OPEN',
	category: 'TECHNICAL',
	body: 'I cannot access module 3.',
	assignedAgent: null,
	createdAt: '2026-06-04T00:00:00.000Z',
	updatedAt: '2026-06-05T00:00:00.000Z',
	replies: [
		{
			id: 'msg-1',
			body: 'I cannot access module 3.',
			direction: 'INBOUND',
			senderType: 'CUSTOMER',
			author: null,
			createdAt: '2026-06-04T00:00:00.000Z',
		},
	],
};

const mockTicketResponse: Ticket = {
	id: 1,
	subject: 'Cannot access module 3',
	fromEmail: 'alice@example.com',
	fromName: 'Alice Tester',
	status: 'OPEN',
	category: 'TECHNICAL',
	createdAt: '2026-06-04T00:00:00.000Z',
	updatedAt: '2026-06-05T00:00:00.000Z',
};

const mockReply: Reply = {
	id: 'msg-2',
	body: 'We are looking into this.',
	direction: 'OUTBOUND',
	senderType: 'AGENT',
	author: { id: 'agent-1', name: 'Agent Alice' },
	createdAt: '2026-06-04T01:00:00.000Z',
};

describe('TicketDetailPage', () => {
	beforeEach(() => {
		vi.mocked(useParams).mockReturnValue({ id: '1' });
		vi.mocked(getTicket).mockResolvedValue(mockTicket);
		vi.mocked(getAgents).mockResolvedValue(mockAgents);
		vi.mocked(updateTicket).mockResolvedValue(mockTicketResponse);
		vi.mocked(createReply).mockResolvedValue(mockReply);
	});

	describe('loading state', () => {
		it('shows loading text while the ticket is fetching', () => {
			vi.mocked(getTicket).mockImplementation(() => new Promise(() => {}));
			renderWithProviders(<TicketDetailPage />);
			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});
	});

	describe('error state', () => {
		it('shows an error alert when the ticket fetch fails', async () => {
			vi.mocked(getTicket).mockRejectedValue(new Error('Network error'));
			renderWithProviders(<TicketDetailPage />);
			expect(await screen.findByText('Failed to load ticket.')).toBeInTheDocument();
		});
	});

	describe('invalid ID', () => {
		it('shows an error alert for a non-numeric ticket ID', () => {
			vi.mocked(useParams).mockReturnValue({ id: 'abc' });
			renderWithProviders(<TicketDetailPage />);
			expect(screen.getByText('Invalid ticket ID.')).toBeInTheDocument();
		});
	});

	describe('ticket display', () => {
		it('renders the ticket subject', async () => {
			renderWithProviders(<TicketDetailPage />);
			expect(await screen.findByText('Cannot access module 3')).toBeInTheDocument();
		});

		it('renders the sender name and email', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText(/Alice Tester.*alice@example\.com/)).toBeInTheDocument();
		});

		it('renders the current status in the status dropdown', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Open');
		});

		it('renders the current category in the category dropdown', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Technical');
		});

		it('shows "None" in the category dropdown when category is null', async () => {
			vi.mocked(getTicket).mockResolvedValue({ ...mockTicket, category: null });
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('None');
		});

		it('renders inbound message content', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText('I cannot access module 3.')).toBeInTheDocument();
		});

		it('shows "No replies yet." when the replies array is empty', async () => {
			vi.mocked(getTicket).mockResolvedValue({ ...mockTicket, replies: [] });
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText('No replies yet.')).toBeInTheDocument();
		});
	});

	describe('reply display', () => {
		it('shows the customer name in the metadata for CUSTOMER replies', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText(/Alice Tester\s*·/)).toBeInTheDocument();
		});

		it('shows the agent name in the metadata for AGENT replies', async () => {
			vi.mocked(getTicket).mockResolvedValue({
				...mockTicket,
				replies: [
					{
						id: 'msg-2',
						body: 'We are looking into this.',
						direction: 'OUTBOUND',
						senderType: 'AGENT',
						author: { id: 'agent-1', name: 'Agent Alice' },
						createdAt: '2026-06-04T01:00:00.000Z',
					},
				],
			});
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText(/Agent Alice\s*·/)).toBeInTheDocument();
		});

		it('falls back to "Support" for AGENT replies with no author', async () => {
			vi.mocked(getTicket).mockResolvedValue({
				...mockTicket,
				replies: [
					{
						id: 'msg-2',
						body: 'We are looking into this.',
						direction: 'OUTBOUND',
						senderType: 'AGENT',
						author: null,
						createdAt: '2026-06-04T01:00:00.000Z',
					},
				],
			});
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText(/Support\s*·/)).toBeInTheDocument();
		});

		it('shows a datetime with seconds in the message metadata', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			// time component includes seconds: matches HH:MM:SS pattern
			expect(screen.getByText(/\d+:\d{2}:\d{2}/)).toBeInTheDocument();
		});
	});

	describe('agent assignment', () => {
		it('shows "Unassigned" in the dropdown when no agent is assigned', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByRole('combobox', { name: 'Assigned to' })).toHaveTextContent('Unassigned');
		});

		it('shows the assigned agent name when an agent is already assigned', async () => {
			vi.mocked(getTicket).mockResolvedValue({
				...mockTicket,
				assignedAgent: mockAgents[0],
			});
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await waitFor(() =>
				expect(screen.getByRole('combobox', { name: 'Assigned to' })).toHaveTextContent('Agent Alice')
			);
		});

		it('lists all available agents in the dropdown', async () => {
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('combobox', { name: 'Assigned to' }));
			expect(screen.getByRole('option', { name: 'Unassigned' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Agent Alice' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Agent Bob' })).toBeInTheDocument();
		});

		it('calls updateTicket with the agent ID when an agent is selected', async () => {
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('combobox', { name: 'Assigned to' }));
			await user.click(screen.getByRole('option', { name: 'Agent Alice' }));
			await waitFor(() =>
				expect(updateTicket).toHaveBeenCalledWith(1, { assignedAgentId: 'agent-1' })
			);
		});

		it('calls updateTicket with null when "Unassigned" is selected', async () => {
			vi.mocked(getTicket).mockResolvedValue({
				...mockTicket,
				assignedAgent: mockAgents[0],
			});
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('combobox', { name: 'Assigned to' }));
			await user.click(screen.getByRole('option', { name: 'Unassigned' }));
			await waitFor(() =>
				expect(updateTicket).toHaveBeenCalledWith(1, { assignedAgentId: null })
			);
		});
	});

	describe('reply form', () => {
		it('renders the reply textarea and Send Reply button', async () => {
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByLabelText('Reply')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /send reply/i })).toBeInTheDocument();
		});

		it('shows a validation error when the form is submitted empty', async () => {
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			expect(await screen.findByText('Reply cannot be empty')).toBeInTheDocument();
			expect(createReply).not.toHaveBeenCalled();
		});

		it('calls createReply with the ticket ID and body on submit', async () => {
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.type(screen.getByLabelText('Reply'), 'We are looking into this.');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			await waitFor(() =>
				expect(createReply).toHaveBeenCalledWith(1, 'We are looking into this.')
			);
		});

		it('clears the reply textarea after a successful reply', async () => {
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.type(screen.getByLabelText('Reply'), 'We are looking into this.');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			await waitFor(() => expect(createReply).toHaveBeenCalled());
			await waitFor(() =>
				expect(screen.getByLabelText('Reply')).toHaveValue('')
			);
		});

		it('shows a server error alert when createReply fails', async () => {
			vi.mocked(createReply).mockRejectedValue(new Error('Failed to send reply'));
			const { user } = renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			await user.type(screen.getByLabelText('Reply'), 'Some reply.');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			expect(await screen.findByText('Failed to send reply')).toBeInTheDocument();
		});
	});
});
