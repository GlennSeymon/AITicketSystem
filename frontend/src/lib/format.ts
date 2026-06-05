import { TicketStatus } from '@repo/core';

export function statusColor(status: string): 'warning' | 'success' | 'default' {
	if (status === TicketStatus.OPEN) return 'warning';
	if (status === TicketStatus.RESOLVED) return 'success';
	return 'default';
}

export function toTitleCase(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

export function formatDateTime(iso: string) {
	return new Date(iso).toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit',
	});
}
