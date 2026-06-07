import DOMPurify from 'dompurify';
import { Paper, Typography, styled } from '@mui/material';
import { SenderType, ReplyDirection } from '@repo/core';
import type { Ticket } from '../../services/tickets';
import { formatDateTime } from '../../lib/format';

const ThreadContainer = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
});

const InboundBubble = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
}));

const OutboundBubble = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
	backgroundColor: theme.palette.primary.light,
	color: theme.palette.primary.contrastText,
}));

const ReplyMeta = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontSize: '0.75rem',
	display: 'block',
	marginBottom: theme.spacing(0.5),
}));

const ReplyBody = styled(Typography)({
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
});

const EmptyState = styled(Typography)({
	fontSize: '0.875rem',
});

interface ReplyThreadProps {
	ticket: Ticket;
}

export function ReplyThread({ ticket }: ReplyThreadProps) {
	return (
		<ThreadContainer>
			{ticket.replies.map((reply) => {
				const isCustomer = reply.senderType
					? reply.senderType === SenderType.CUSTOMER
					: reply.direction === ReplyDirection.INBOUND;
				const Bubble = isCustomer ? InboundBubble : OutboundBubble;
				return (
					<Bubble key={reply.id} variant='outlined' elevation={0}>
						<ReplyMeta>
							{isCustomer ? ticket.fromName : (reply.author?.name ?? 'Support')}{' '}
							&middot; {formatDateTime(reply.createdAt)}
						</ReplyMeta>
						<ReplyBody
							variant='body2'
							dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.bodyHTML ?? reply.body) }}
						/>
					</Bubble>
				);
			})}
			{ticket.replies.length === 0 && <EmptyState>No replies yet.</EmptyState>}
		</ThreadContainer>
	);
}
