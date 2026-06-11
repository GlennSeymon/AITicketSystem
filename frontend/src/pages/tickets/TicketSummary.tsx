import { useCompletion } from '@ai-sdk/react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Button, Paper, Typography, styled } from '@mui/material';

const SummaryWrapper = styled('div')(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const SummaryBox = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
	marginTop: theme.spacing(1),
	backgroundColor: theme.palette.action.hover,
}));

interface TicketSummaryProps {
	ticketId: number;
}

export function TicketSummary({ ticketId }: TicketSummaryProps) {
	const { complete, completion, isLoading } = useCompletion({
		api: `/api/tickets/${ticketId}/summarise`,
		streamProtocol: 'text',
	});

	return (
		<SummaryWrapper>
			<Button
				startIcon={<AutoAwesomeIcon />}
				onClick={() => complete('')}
				disabled={isLoading}
				variant='outlined'
				size='small'
			>
				{isLoading ? 'Summarising...' : 'Summarise'}
			</Button>
			{completion && (
				<SummaryBox variant='outlined' elevation={0}>
					<Typography variant='body2'>{completion}</Typography>
				</SummaryBox>
			)}
		</SummaryWrapper>
	);
}
