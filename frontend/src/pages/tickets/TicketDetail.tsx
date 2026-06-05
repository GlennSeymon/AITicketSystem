import { type TicketDetail as TicketDetailData } from '../../services/tickets';
import { Box, Stack, Typography, styled } from '@mui/material';
import { formatDate } from '../../lib/format';

export const MetaLabel = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontSize: '0.75rem',
	textTransform: 'uppercase',
	letterSpacing: '0.05em',
	marginBottom: theme.spacing(0.5),
}));

const MetaValue = styled(Typography)({
	fontSize: '0.875rem',
});

interface TicketDetailProps {
	ticket: TicketDetailData;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
	return (
		<Stack direction='column' spacing={2}>
			<Box>
				<MetaLabel>From</MetaLabel>
				<MetaValue>
					{ticket.fromName} &lt;{ticket.fromEmail}&gt;
				</MetaValue>
			</Box>
			<Box>
				<MetaLabel>Created</MetaLabel>
				<MetaValue>{formatDate(ticket.createdAt)}</MetaValue>
			</Box>
			<Box>
				<MetaLabel>Updated</MetaLabel>
				<MetaValue>{formatDate(ticket.updatedAt)}</MetaValue>
			</Box>
		</Stack>
	);
}
