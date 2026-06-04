import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import TicketDetailPage from './TicketDetailPage';
import { getTicket, updateTicket } from '../../services/tickets';
import type { TicketDetail, Ticket } from '../../services/tickets';
import { getAgents } from '../../services/agents';
import type { Agent } from '../../services/agents';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('react-router-dom', () => ({
	useParams: vi.fn(() => ({ id: '1' })),
	useNavigate: vi.fn(() => vi.fn()),
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
	messages: [
		{
			id: 'msg-1',
			body: 'I cannot access module 3.',
			direction: 'INBOUND',
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

describe('TicketDetailPage', () => {
	beforeEach(() => {
		vi.mocked(useParams).mockReturnValue({ id: '1' });
		vi.mocked(getTicket).mockResolvedValue(mockTicket);
		vi.mocked(getAgents).mockResolvedValue(mockAgents);
		vi.mocked(updateTicket).mockResolvedValue(mockTicketResponse);
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

		it('shows "No messages yet." when the messages array is empty', async () => {
			vi.mocked(getTicket).mockResolvedValue({ ...mockTicket, messages: [] });
			renderWithProviders(<TicketDetailPage />);
			await screen.findByText('Cannot access module 3');
			expect(screen.getByText('No messages yet.')).toBeInTheDocument();
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
			expect(screen.getByRole('combobox', { name: 'Assigned to' })).toHaveTextContent('Agent Alice');
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
});
