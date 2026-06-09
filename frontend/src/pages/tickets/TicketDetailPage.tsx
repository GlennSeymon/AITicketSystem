import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTicket } from '../../services/tickets';
import { Alert, Divider, Grid, Paper, Typography, styled } from '@mui/material';
import { PageContainer } from '../../components/layout';
import { BackLink } from '../../components/BackLink';
import { TicketDetail } from './TicketDetail';
import { TicketUpdate } from './TicketUpdate';
import { ReplyThread } from './ReplyThread';
import { ReplyForm } from './ReplyForm';


const HeaderCard = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(3),
	marginBottom: theme.spacing(3),
}));

const MetaColumns = styled(Grid)(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const SectionDivider = styled(Divider)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const ReplySectionWrapper = styled('div')(({ theme }) => ({
	marginTop: theme.spacing(4),
}));

export default function TicketDetailPage() {
	const { id } = useParams<{ id: string }>();
	const ticketId = parseInt(id ?? '', 10);

	const { data: ticket, isPending, isError } = useQuery({
		queryKey: ['ticket', ticketId],
		queryFn: () => getTicket(ticketId),
		enabled: !isNaN(ticketId),
	});

	if (isNaN(ticketId)) {
		return (
			<PageContainer>
				<Alert severity='error'>Invalid ticket ID.</Alert>
			</PageContainer>
		);
	}

	if (isPending) {
		return (
			<PageContainer>
				<Typography>Loading...</Typography>
			</PageContainer>
		);
	}

	if (isError || !ticket) {
		return (
			<PageContainer>
				<Alert severity='error'>Failed to load ticket.</Alert>
			</PageContainer>
		);
	}

	return (
		<PageContainer maxWidth='md'>
			<BackLink to='/tickets'>Back to Tickets</BackLink>

			<HeaderCard variant='outlined'>
				<Typography variant='h5' component='h1'>
					{ticket.subject}
				</Typography>
				<MetaColumns container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<TicketDetail ticket={ticket} />
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<TicketUpdate ticket={ticket} />
					</Grid>
				</MetaColumns>
			</HeaderCard>

			<Typography variant='h6' gutterBottom>
				Replies
			</Typography>
			<SectionDivider />
			<ReplyThread ticket={ticket} />

			<ReplySectionWrapper>
				<Typography variant='h6' gutterBottom>
					Reply
				</Typography>
				<SectionDivider />
				<ReplyForm ticketId={ticketId} customerName={ticket.fromName.split(' ')[0]} assigneeName={ticket.assignedAgent?.name} />
			</ReplySectionWrapper>
		</PageContainer>
	);
}
