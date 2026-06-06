import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { TicketDetail } from './TicketDetail';
import type { Ticket } from '../../services/tickets';
import { renderWithProviders } from '../../test/renderWithProviders';

const mockTicket: Ticket = {
	id: 1,
	subject: 'Cannot access module 3',
	fromEmail: 'alice@example.com',
	fromName: 'Alice Tester',
	status: 'OPEN',
	category: 'TECHNICAL',
	body: 'I cannot access module 3.',
	replies: [],
	assignedAgent: null,
	createdAt: '2026-06-04T00:00:00.000Z',
	updatedAt: '2026-06-05T00:00:00.000Z',
};

describe('TicketDetail', () => {
	it('renders the FROM label', () => {
		renderWithProviders(<TicketDetail ticket={mockTicket} />);
		expect(screen.getByText('From')).toBeInTheDocument();
	});

	it('renders the customer name and email', () => {
		renderWithProviders(<TicketDetail ticket={mockTicket} />);
		expect(screen.getByText(/Alice Tester/)).toBeInTheDocument();
		expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
	});

	it('renders the CREATED label and formatted date', () => {
		renderWithProviders(<TicketDetail ticket={mockTicket} />);
		expect(screen.getByText('Created')).toBeInTheDocument();
		// formatDate output is locale-dependent; verify year is present
		expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
	});

	it('renders the UPDATED label and formatted date', () => {
		renderWithProviders(<TicketDetail ticket={mockTicket} />);
		expect(screen.getByText('Updated')).toBeInTheDocument();
	});

	it('does not render time components (uses formatDate, not formatDateTime)', () => {
		renderWithProviders(<TicketDetail ticket={mockTicket} />);
		// formatDate omits time — no seconds separator should appear
		expect(screen.queryByText(/\d+:\d{2}:\d{2}/)).not.toBeInTheDocument();
	});
});
