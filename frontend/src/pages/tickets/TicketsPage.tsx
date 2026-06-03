import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTickets, type Ticket } from '../../services/tickets';
import {
	Alert,
	Button,
	Chip,
	Container,
	Paper,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	styled,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { CreateTicketDialog } from './CreateTicketDialog';

const PageContainer = styled(Container)(({ theme }) => ({
	paddingTop: theme.spacing(4),
}));

const PageHeader = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: '1.5rem',
});

function statusColor(status: string): 'warning' | 'success' | 'default' {
	if (status === 'OPEN') return 'warning';
	if (status === 'RESOLVED') return 'success';
	return 'default';
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

export default function TicketsPage() {
	const [createOpen, setCreateOpen] = useState(false);

	const { data: tickets, isPending, isError } = useQuery({
		queryKey: ['tickets'],
		queryFn: () => getTickets(),
	});

	if (isPending) {
		return (
			<PageContainer>
				<PageHeader>
					<Skeleton variant='text' width={160} height={40} />
					<Skeleton variant='rounded' width={140} height={36} />
				</PageHeader>
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								{['Subject', 'From', 'Status', 'Category', 'Date'].map((col) => (
									<TableCell key={col}>{col}</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 5 }).map((_, j) => (
										<TableCell key={j}>
											<Skeleton />
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</PageContainer>
		);
	}

	if (isError) {
		return (
			<PageContainer>
				<Alert severity='error'>Failed to load tickets.</Alert>
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<PageHeader>
				<Typography variant='h5' component='h1'>
					Tickets
				</Typography>
				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={() => setCreateOpen(true)}
				>
					Create Ticket
				</Button>
			</PageHeader>

			{tickets.length === 0 ? (
				<Typography color='text.secondary'>No tickets yet.</Typography>
			) : (
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Subject</TableCell>
								<TableCell>From</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Category</TableCell>
								<TableCell>Date</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{tickets.map((ticket: Ticket) => (
								<TableRow key={ticket.id} hover>
									<TableCell>{ticket.subject}</TableCell>
									<TableCell>{ticket.fromName} &lt;{ticket.fromEmail}&gt;</TableCell>
									<TableCell>
										<Chip
											label={ticket.status}
											color={statusColor(ticket.status)}
											size='small'
										/>
									</TableCell>
									<TableCell>{ticket.category ?? '—'}</TableCell>
									<TableCell>{formatDate(ticket.createdAt)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<CreateTicketDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>
		</PageContainer>
	);
}
