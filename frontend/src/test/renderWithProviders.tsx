import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

export function renderWithProviders(ui: ReactElement) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return {
		user: userEvent.setup(),
		...render(
			<MemoryRouter>
				<QueryClientProvider client={client}>{ui}</QueryClientProvider>
			</MemoryRouter>,
		),
	};
}
