import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicket, updateTicket } from '../../services/tickets';
import { getAgents } from '../../services/agents';
import { TicketStatus, TicketCategory } from '@repo/core';
import {
	Alert,
	Button,
	Container,
	Divider,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	type SelectChangeEvent,
	Typography,
	styled,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatDate, toTitleCase } from '../../lib/format';

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

const SrOnlyLabel = styled(InputLabel)({
	position: 'absolute',
	width: 1,
	height: 1,
	padding: 0,
	margin: -1,
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	border: 0,
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
	const [localStatus, setLocalStatus] = useState<string>('');
	const [localCategory, setLocalCategory] = useState<string>('');

	const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });

	const assignMutation = useMutation({
		mutationFn: (newAgentId: string | null) =>
			updateTicket(ticketId, { assignedAgentId: newAgentId }),
		onSuccess: invalidate,
	});
	const statusMutation = useMutation({
		mutationFn: (status: string) =>
			updateTicket(ticketId, { status: status as (typeof TicketStatus)[keyof typeof TicketStatus] }),
		onSuccess: invalidate,
	});
	const categoryMutation = useMutation({
		mutationFn: (category: string | null) =>
			updateTicket(ticketId, { category: (category || null) as (typeof TicketCategory)[keyof typeof TicketCategory] | null }),
		onSuccess: invalidate,
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

	const effectiveAgentId = assignMutation.isPending ? agentId : (ticket.assignedAgent?.id ?? '');
	const effectiveStatus = statusMutation.isPending ? localStatus : ticket.status;
	const effectiveCategory = categoryMutation.isPending ? localCategory : (ticket.category ?? '');

	function handleAssignChange(e: SelectChangeEvent) {
		const newId = e.target.value;
		setAgentId(newId);
		assignMutation.mutate(newId || null);
	}

	function handleStatusChange(e: SelectChangeEvent) {
		const newStatus = e.target.value;
		setLocalStatus(newStatus);
		statusMutation.mutate(newStatus);
	}

	function handleCategoryChange(e: SelectChangeEvent) {
		const newCategory = e.target.value;
		setLocalCategory(newCategory);
		categoryMutation.mutate(newCategory || null);
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
							<SrOnlyLabel id='assign-agent-label'>Assigned to</SrOnlyLabel>
							<Select
								labelId='assign-agent-label'
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
						<MetaLabel>Created</MetaLabel>
						<MetaValue>{formatDate(ticket.createdAt)}</MetaValue>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Status</MetaLabel>
						<FormControl fullWidth size='small'>
							<SrOnlyLabel id='status-label'>Status</SrOnlyLabel>
							<Select
								labelId='status-label'
								value={effectiveStatus}
								onChange={handleStatusChange}
								disabled={statusMutation.isPending}
							>
								{Object.values(TicketStatus).sort().map((s) => (
									<MenuItem key={s} value={s}>{toTitleCase(s)}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Updated</MetaLabel>
						<MetaValue>{formatDate(ticket.updatedAt)}</MetaValue>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<MetaLabel>Category</MetaLabel>
						<FormControl fullWidth size='small'>
							<SrOnlyLabel id='category-label'>Category</SrOnlyLabel>
							<Select
								labelId='category-label'
								value={effectiveCategory}
								onChange={handleCategoryChange}
								displayEmpty
								disabled={categoryMutation.isPending}
							>
								<MenuItem value=''>None</MenuItem>
								{Object.values(TicketCategory).sort().map((c) => (
									<MenuItem key={c} value={c}>{toTitleCase(c)}</MenuItem>
								))}
							</Select>
						</FormControl>
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
