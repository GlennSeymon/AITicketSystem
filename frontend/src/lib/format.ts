import { TicketStatus } from '@repo/core';

export function statusColor(status: string): 'warning' | 'success' | 'default' {
	if (status === TicketStatus.OPEN) return 'warning';
	if (status === TicketStatus.RESOLVED) return 'success';
	return 'default';
}

export function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}
