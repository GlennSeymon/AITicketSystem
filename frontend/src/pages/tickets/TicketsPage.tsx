import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTickets, type Ticket } from '../../services/tickets';
import { TicketStatus } from '@repo/core';
import {
	Alert,
	Button,
	Chip,
	Container,
	Typography,
	styled,
} from '@mui/material';
import {
	DataGrid,
	type GridColDef,
	type GridSortModel,
	type GridRenderCellParams,
} from '@mui/x-data-grid';
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
	if (status === TicketStatus.OPEN) return 'warning';
	if (status === TicketStatus.RESOLVED) return 'success';
	return 'default';
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

const columns: GridColDef<Ticket>[] = [
	{
		field: 'subject',
		headerName: 'Subject',
		flex: 2,
		minWidth: 200,
	},
	{
		field: 'fromName',
		headerName: 'From',
		flex: 1.5,
		minWidth: 180,
		renderCell: ({ row }: GridRenderCellParams<Ticket>) =>
			`${row.fromName} <${row.fromEmail}>`,
	},
	{
		field: 'status',
		headerName: 'Status',
		width: 120,
		renderCell: ({ value }: GridRenderCellParams<Ticket>) => (
			<Chip label={value} color={statusColor(value)} size='small' />
		),
	},
	{
		field: 'category',
		headerName: 'Category',
		width: 160,
		valueFormatter: (value: string | null) => value ?? '—',
	},
	{
		field: 'createdAt',
		headerName: 'Date',
		width: 140,
		valueFormatter: (value: string) => formatDate(value),
	},
];

export default function TicketsPage() {
	const [createOpen, setCreateOpen] = useState(false);
	const [sortModel, setSortModel] = useState<GridSortModel>([
		{ field: 'createdAt', sort: 'desc' },
	]);

	const { data: tickets = [], isPending, isError } = useQuery({
		queryKey: ['tickets', sortModel],
		queryFn: () => getTickets({
			sortField: sortModel[0]?.field,
			sortOrder: sortModel[0]?.sort ?? undefined,
		}),
	});

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

			<DataGrid
				rows={tickets}
				columns={columns}
				sortingMode='server'
				sortModel={sortModel}
				onSortModelChange={setSortModel}
				loading={isPending}
				autoHeight
				hideFooter
				disableRowSelectionOnClick
				disableColumnFilter
				localeText={{ noRowsLabel: 'No tickets yet.' }}
			/>

			<CreateTicketDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>
		</PageContainer>
	);
}
