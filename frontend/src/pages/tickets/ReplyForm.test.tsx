import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { ReplyForm } from './ReplyForm';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createReply } from '../../services/tickets';
import { useCompletion } from '@ai-sdk/react';

const mockComplete = vi.fn();

vi.mock('@ai-sdk/react', () => ({
	useCompletion: vi.fn(),
}));

vi.mock('../../services/tickets', () => ({
	createReply: vi.fn(),
}));

const defaultProps = {
	ticketId: 1,
	customerName: 'Alice',
	assigneeName: 'Agent Bob',
};

describe('ReplyForm', () => {
	beforeEach(() => {
		vi.mocked(useCompletion).mockReturnValue({
			complete: mockComplete,
			completion: '',
			isLoading: false,
		} as ReturnType<typeof useCompletion>);
		vi.mocked(createReply).mockResolvedValue(undefined as never);
	});

	describe('initial state', () => {
		it('renders the reply textarea', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('textbox', { name: /reply/i })).toBeInTheDocument();
		});

		it('disables the Polish button when the textarea is empty', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('button', { name: /^polish$/i })).toBeDisabled();
		});

		it('disables the Send Reply button when the textarea is empty', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
		});
	});

	describe('after typing', () => {
		it('enables the Polish button once text is entered', async () => {
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'draft');
			expect(screen.getByRole('button', { name: /^polish$/i })).toBeEnabled();
		});

		it('enables the Send Reply button once text is entered', async () => {
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'draft');
			expect(screen.getByRole('button', { name: /send reply/i })).toBeEnabled();
		});

		it('keeps both buttons disabled when only whitespace is entered', async () => {
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), '   ');
			expect(screen.getByRole('button', { name: /^polish$/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
		});
	});

	describe('Polish button', () => {
		it('calls complete with the body text, customerName, and assigneeName', async () => {
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'my draft reply');
			await user.click(screen.getByRole('button', { name: /^polish$/i }));
			expect(mockComplete).toHaveBeenCalledWith('my draft reply', {
				body: { customerName: 'Alice', assigneeName: 'Agent Bob' },
			});
		});

		it('omits assigneeName from the call when not provided', async () => {
			const { user } = renderWithProviders(
				<ReplyForm ticketId={1} customerName='Alice' />,
			);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'draft');
			await user.click(screen.getByRole('button', { name: /^polish$/i }));
			expect(mockComplete).toHaveBeenCalledWith('draft', {
				body: { customerName: 'Alice', assigneeName: undefined },
			});
		});
	});

	describe('polishing state', () => {
		beforeEach(() => {
			vi.mocked(useCompletion).mockReturnValue({
				complete: mockComplete,
				completion: 'Streamed text so far...',
				isLoading: true,
			} as ReturnType<typeof useCompletion>);
		});

		it('shows "Polishing..." on the Polish button', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('button', { name: /polishing/i })).toBeInTheDocument();
		});

		it('disables the Polish button while polishing', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('button', { name: /polishing/i })).toBeDisabled();
		});

		it('disables the Send Reply button while polishing', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
		});

		it('disables the textarea while polishing', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			expect(screen.getByRole('textbox', { name: /reply/i })).toBeDisabled();
		});
	});

	describe('onFinish callback', () => {
		it('updates the textarea with the polished text when streaming completes', () => {
			renderWithProviders(<ReplyForm {...defaultProps} />);
			const { onFinish } = vi.mocked(useCompletion).mock.calls[0][0];
			act(() => {
				onFinish!('original draft', 'Polished reply text.');
			});
			expect(screen.getByRole('textbox', { name: /reply/i })).toHaveValue('Polished reply text.');
		});
	});

	describe('form submission', () => {
		it('calls createReply with the ticketId and body on submit', async () => {
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'my reply');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			await waitFor(() => {
				expect(createReply).toHaveBeenCalledWith(1, 'my reply');
			});
		});

		it('resets the textarea after a successful submit', async () => {
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'my reply');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			await waitFor(() => {
				expect(screen.getByRole('textbox', { name: /reply/i })).toHaveValue('');
			});
		});

		it('shows an error alert on submit failure', async () => {
			vi.mocked(createReply).mockRejectedValue(new Error('Server unavailable'));
			const { user } = renderWithProviders(<ReplyForm {...defaultProps} />);
			await user.type(screen.getByRole('textbox', { name: /reply/i }), 'my reply');
			await user.click(screen.getByRole('button', { name: /send reply/i }));
			await waitFor(() => {
				expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
			});
		});
	});
});
