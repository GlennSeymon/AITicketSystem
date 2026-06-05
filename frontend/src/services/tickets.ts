import api, { extractError } from '../lib/api';
import type { CreateTicketInput, UpdateTicketInput } from '@repo/core';

export type Ticket = {
	id: number;
	subject: string;
	fromEmail: string;
	fromName: string;
	status: string;
	category: string | null;
	createdAt: string;
	updatedAt: string;
};

export type Reply = {
	id: string;
	body: string;
	direction: 'INBOUND' | 'OUTBOUND';
	senderType: 'CUSTOMER' | 'AGENT' | null;
	author: { id: string; name: string } | null;
	createdAt: string;
};

export type AssignedAgent = { id: string; name: string; email: string };

export type TicketDetail = Ticket & {
	body: string;
	replies: Reply[];
	assignedAgent: AssignedAgent | null;
};

export async function getTickets(params?: {
	status?: string;
	category?: string;
	sortField?: string;
	sortOrder?: 'asc' | 'desc';
	page?: number;
	pageSize?: number;
}): Promise<{ data: Ticket[]; total: number }> {
	const { data } = await api.get<{ data: Ticket[]; total: number }>('/api/tickets', { params });
	return data;
}

export async function createTicket(data: CreateTicketInput): Promise<Ticket> {
	try {
		const { data: ticket } = await api.post<Ticket>('/api/tickets', data);
		return ticket;
	} catch (err) {
		throw extractError(err, 'Failed to create ticket');
	}
}

export async function getTicket(id: number): Promise<TicketDetail> {
	const { data } = await api.get<TicketDetail>(`/api/tickets/${id}`);
	return data;
}

export async function updateTicket(id: number, data: UpdateTicketInput): Promise<Ticket> {
	try {
		const { data: ticket } = await api.patch<Ticket>(`/api/tickets/${id}`, data);
		return ticket;
	} catch (err) {
		throw extractError(err, 'Failed to update ticket');
	}
}

export async function createReply(ticketId: number, body: string): Promise<Reply> {
	try {
		const { data } = await api.post<Reply>(`/api/tickets/${ticketId}/replies`, { body });
		return data;
	} catch (err) {
		throw extractError(err, 'Failed to send reply');
	}
}
