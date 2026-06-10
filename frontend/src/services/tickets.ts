import * as Sentry from '@sentry/react';
import api, { extractError } from '../lib/api';
import type { CreateTicketInput, UpdateTicketInput } from '@repo/core';

export interface Reply {
	id: string;
	body: string;
	bodyHTML: string | null;
	direction: 'INBOUND' | 'OUTBOUND';
	senderType: 'CUSTOMER' | 'AGENT' | null;
	author: { id: string; name: string } | null;
	createdAt: string;
}

export interface AssignedAgent {
	id: string;
	name: string;
	email: string;
}

export interface Ticket {
	id: number;
	subject: string;
	fromEmail: string;
	fromName: string;
	status: string;
	category: string | null;
	createdAt: string;
	updatedAt: string;
	body: string;
	replies: Reply[];
	assignedAgent: AssignedAgent | null;
}

export interface TicketStats {
	totalTickets: number;
	openTickets: number;
	resolvedByAI: number;
	aiResolutionPercent: number;
	avgResolutionTimeMs: number | null;
}

export interface DailyTicketCount {
	date: string;
	count: number;
}

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
		Sentry.captureException(err);
		throw extractError(err, 'Failed to create ticket');
	}
}

export async function getTicket(id: number): Promise<Ticket> {
	const { data } = await api.get<Ticket>(`/api/tickets/${id}`);
	return data;
}

export async function updateTicket(id: number, data: UpdateTicketInput): Promise<Ticket> {
	try {
		const { data: ticket } = await api.patch<Ticket>(`/api/tickets/${id}`, data);
		return ticket;
	} catch (err) {
		Sentry.captureException(err);
		throw extractError(err, 'Failed to update ticket');
	}
}

export async function createReply(ticketId: number, body: string): Promise<Reply> {
	try {
		const { data } = await api.post<Reply>(`/api/tickets/${ticketId}/replies`, { body });
		return data;
	} catch (err) {
		Sentry.captureException(err);
		throw extractError(err, 'Failed to send reply');
	}
}

export async function getTicketStats(): Promise<TicketStats> {
	const { data } = await api.get<TicketStats>('/api/tickets/stats');
	return data;
}

export async function getDailyTickets(): Promise<DailyTicketCount[]> {
	const { data } = await api.get<DailyTicketCount[]>('/api/tickets/daily');
	return data;
}
