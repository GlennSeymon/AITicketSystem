import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTicket } from '../../services/tickets';
import {
	Alert,
	Button,
	Chip,
	Container,
	Divider,
	Paper,
	Typography,
	styled,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatDate, statusColor } from '../../lib/format';

const PageContainer = styled(Container)(({ theme }) => ({
	paddingTop: theme.spacing(4),
	paddingBottom: theme.spacing(4),
}));

const BackButtonWrapper = styled('div')(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(3),
	marginBottom: theme.spacing(3),
}));

const MetaRow = styled('div')(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(2),
	alignItems: 'center',
	flexWrap: 'wrap',
	marginTop: theme.spacing(1),
}));

const MetaText = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontSize: '0.875rem',
}));

const SectionDivider = styled(Divider)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const MessagesContainer = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
});

const InboundBubble = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
	maxWidth: '75%',
	alignSelf: 'flex-start',
}));

const OutboundBubble = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
	maxWidth: '75%',
	alignSelf: 'flex-end',
	backgroundColor: theme.palette.primary.light,
	color: theme.palette.primary.contrastText,
}));

const MessageMeta = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontSize: '0.75rem',
	display: 'block',
	marginBottom: theme.spacing(0.5),
}));

const MessageBody = styled(Typography)({
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
});

export default function TicketDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
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
			<BackButtonWrapper>
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/tickets')}
				>
					Back to Tickets
				</Button>
			</BackButtonWrapper>

			<HeaderCard variant='outlined'>
				<Typography variant='h5' component='h1'>
					{ticket.subject}
				</Typography>
				<MetaRow>
					<MetaText>
						From: {ticket.fromName} &lt;{ticket.fromEmail}&gt;
					</MetaText>
					<Chip
						label={ticket.status}
						color={statusColor(ticket.status)}
						size='small'
					/>
					{ticket.category && (
						<Chip label={ticket.category} size='small' variant='outlined' />
					)}
					<MetaText>{formatDate(ticket.createdAt)}</MetaText>
				</MetaRow>
			</HeaderCard>

			<Typography variant='h6' gutterBottom>
				Messages
			</Typography>
			<SectionDivider />

			<MessagesContainer>
				{ticket.messages.map((msg) => {
					const Bubble = msg.direction === 'INBOUND' ? InboundBubble : OutboundBubble;
					return (
						<Bubble key={msg.id} variant='outlined' elevation={0}>
							<MessageMeta>
								{msg.direction === 'INBOUND' ? ticket.fromName : 'Support'} &middot;{' '}
								{formatDate(msg.createdAt)}
							</MessageMeta>
							<MessageBody variant='body2'>{msg.body}</MessageBody>
						</Bubble>
					);
				})}
				{ticket.messages.length === 0 && (
					<MetaText>No messages yet.</MetaText>
				)}
			</MessagesContainer>
		</PageContainer>
	);
}
