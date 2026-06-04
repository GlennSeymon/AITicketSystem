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

export type Message = {
	id: string;
	body: string;
	direction: 'INBOUND' | 'OUTBOUND';
	createdAt: string;
};

export type TicketDetail = Ticket & { body: string; messages: Message[] };

export async function getTickets(params?: {
	status?: string;
	category?: string;
	sortField?: string;
	sortOrder?: 'asc' | 'desc';
}): Promise<Ticket[]> {
	const { data } = await api.get<Ticket[]>('/api/tickets', { params });
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
