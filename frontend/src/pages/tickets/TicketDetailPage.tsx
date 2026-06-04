import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicket, updateTicket } from '../../services/tickets';
import { getAgents } from '../../services/agents';
import {
	Alert,
	Button,
	Chip,
	Container,
	Divider,
	FormControl,
	Grid,
	MenuItem,
	Paper,
	Select,
	type SelectChangeEvent,
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

const MetaGridContainer = styled(Grid)(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const MetaLabel = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontSize: '0.75rem',
	textTransform: 'uppercase',
	letterSpacing: '0.05em',
	marginBottom: theme.spacing(0.5),
}));

const MetaValue = styled(Typography)({
	fontSize: '0.875rem',
});

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
}));

const OutboundBubble = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
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
	const queryClient = useQueryClient();
	const ticketId = parseInt(id ?? '', 10);

	const { data: ticket, isPending, isError } = useQuery({
		queryKey: ['ticket', ticketId],
		queryFn: () => getTicket(ticketId),
		enabled: !isNaN(ticketId),
	});

	const { data: agents = [] } = useQuery({
		queryKey: ['agents'],
		queryFn: getAgents,
	});

	const [agentId, setAgentId] = useState<string>('');
	const assignMutation = useMutation({
		mutationFn: (newAgentId: string | null) =>
			updateTicket(ticketId, { assignedAgentId: newAgentId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] }),
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

	const effectiveAgentId = assignMutation.isPending
		? agentId
		: (ticket.assignedAgent?.id ?? '');

	function handleAssignChange(e: SelectChangeEvent) {
		const newId = e.target.value;
		setAgentId(newId);
		assignMutation.mutate(newId || null);
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
				<MetaGridContainer container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>From</MetaLabel>
						<MetaValue>{ticket.fromName} &lt;{ticket.fromEmail}&gt;</MetaValue>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Assigned to</MetaLabel>
						<FormControl fullWidth size='small'>
							<Select
								value={effectiveAgentId}
								onChange={handleAssignChange}
								displayEmpty
								disabled={assignMutation.isPending}
							>
								<MenuItem value=''>Unassigned</MenuItem>
								{agents.map((agent) => (
									<MenuItem key={agent.id} value={agent.id}>
										{agent.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Status</MetaLabel>
						<Chip
							label={ticket.status}
							color={statusColor(ticket.status)}
							size='small'
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Category</MetaLabel>
						{ticket.category
							? <Chip label={ticket.category} size='small' variant='outlined' />
							: <MetaValue>—</MetaValue>}
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Created</MetaLabel>
						<MetaValue>{formatDate(ticket.createdAt)}</MetaValue>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Updated</MetaLabel>
						<MetaValue>{formatDate(ticket.updatedAt)}</MetaValue>
					</Grid>
				</MetaGridContainer>
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
					<MetaValue>No messages yet.</MetaValue>
				)}
			</MessagesContainer>
		</PageContainer>
	);
}
