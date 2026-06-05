import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('formatDate', () => {
	it('formats an ISO string as a date without a time component', () => {
		const result = formatDate('2026-06-04T14:30:45.000Z');
		expect(result).not.toMatch(/\d+:\d\d/);
	});
});

describe('formatDateTime', () => {
	it('includes a time with minutes and seconds', () => {
		const result = formatDateTime('2026-06-04T14:30:45.000Z');
		expect(result).toMatch(/\d+:\d\d:\d\d/);
	});

	it('produces a longer string than formatDate for the same input', () => {
		const iso = '2026-06-04T14:30:45.000Z';
		expect(formatDateTime(iso).length).toBeGreaterThan(formatDate(iso).length);
	});
});
