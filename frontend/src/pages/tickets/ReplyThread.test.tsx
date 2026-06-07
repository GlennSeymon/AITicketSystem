import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ReplyThread } from './ReplyThread';
import type { Ticket, Reply } from '../../services/tickets';
import { renderWithProviders } from '../../test/renderWithProviders';

const baseTicket: Ticket = {
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

const customerReply: Reply = {
	id: 'reply-1',
	body: 'I still cannot access it.',
	bodyHTML: null,
	direction: 'INBOUND',
	senderType: 'CUSTOMER',
	author: null,
	createdAt: '2026-06-04T01:00:00.000Z',
};

const agentReply: Reply = {
	id: 'reply-2',
	body: 'We are looking into this.',
	bodyHTML: null,
	direction: 'OUTBOUND',
	senderType: 'AGENT',
	author: { id: 'agent-1', name: 'Agent Alice' },
	createdAt: '2026-06-04T02:00:00.000Z',
};

describe('ReplyThread', () => {
	describe('empty state', () => {
		it('shows "No replies yet." when there are no replies', () => {
			renderWithProviders(<ReplyThread ticket={baseTicket} />);
			expect(screen.getByText('No replies yet.')).toBeInTheDocument();
		});

		it('does not show "No replies yet." when there are replies', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [customerReply] }} />);
			expect(screen.queryByText('No replies yet.')).not.toBeInTheDocument();
		});
	});

	describe('reply body', () => {
		it('renders the reply body text', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [customerReply] }} />);
			expect(screen.getByText('I still cannot access it.')).toBeInTheDocument();
		});

		it('renders bodyHTML when present instead of body', () => {
			const htmlReply: Reply = { ...customerReply, body: 'plain text', bodyHTML: '<strong>rich text</strong>' };
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [htmlReply] }} />);
			expect(screen.getByText('rich text')).toBeInTheDocument();
			expect(screen.queryByText('plain text')).not.toBeInTheDocument();
		});

		it('falls back to body when bodyHTML is null', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [customerReply] }} />);
			expect(screen.getByText('I still cannot access it.')).toBeInTheDocument();
		});

		it('renders multiple reply bodies', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [customerReply, agentReply] }} />);
			expect(screen.getByText('I still cannot access it.')).toBeInTheDocument();
			expect(screen.getByText('We are looking into this.')).toBeInTheDocument();
		});
	});

	describe('sender name', () => {
		it('shows the customer name for CUSTOMER replies', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [customerReply] }} />);
			expect(screen.getByText(/Alice Tester\s*·/)).toBeInTheDocument();
		});

		it('shows the agent name for AGENT replies with an author', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [agentReply] }} />);
			expect(screen.getByText(/Agent Alice\s*·/)).toBeInTheDocument();
		});

		it('falls back to "Support" for AGENT replies with no author', () => {
			const noAuthorReply: Reply = { ...agentReply, author: null };
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [noAuthorReply] }} />);
			expect(screen.getByText(/Support\s*·/)).toBeInTheDocument();
		});

		it('uses direction as fallback when senderType is null — INBOUND shows customer name', () => {
			const legacyReply: Reply = { ...customerReply, senderType: null };
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [legacyReply] }} />);
			expect(screen.getByText(/Alice Tester\s*·/)).toBeInTheDocument();
		});

		it('uses direction as fallback when senderType is null — OUTBOUND shows "Support"', () => {
			const legacyReply: Reply = { ...agentReply, senderType: null, author: null };
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [legacyReply] }} />);
			expect(screen.getByText(/Support\s*·/)).toBeInTheDocument();
		});
	});

	describe('timestamp', () => {
		it('shows a datetime with seconds for each reply', () => {
			renderWithProviders(<ReplyThread ticket={{ ...baseTicket, replies: [customerReply] }} />);
			expect(screen.getByText(/\d+:\d{2}:\d{2}/)).toBeInTheDocument();
		});
	});
});
