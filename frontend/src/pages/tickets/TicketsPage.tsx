import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTickets, type Ticket } from '../../services/tickets';
import { TicketStatus, TicketCategory, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@repo/core';
import {
	Alert,
	Button,
	Chip,
	Container,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	type SelectChangeEvent,
	Typography,
	styled,
} from '@mui/material';
import {
	DataGrid,
	type GridColDef,
	type GridPaginationModel,
	type GridSortModel,
	type GridRenderCellParams,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { CreateTicketDialog } from './CreateTicketDialog';
import { formatDate, statusColor } from '../../lib/format';

const PageContainer = styled(Container)(({ theme }) => ({
	paddingTop: theme.spacing(4),
}));

const PageHeader = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: '1rem',
});

const FilterBar = styled('div')(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(2),
	marginBottom: theme.spacing(2),
}));

const FilterFormControl = styled(FormControl)({
	minWidth: 160,
});

const SubjectLink = styled(Link)(({ theme }) => ({
	color: theme.palette.primary.main,
	textDecoration: 'none',
	'&:hover': {
		textDecoration: 'underline',
	},
}));

const columns: GridColDef<Ticket>[] = [
	{
		field: 'subject',
		headerName: 'Subject',
		flex: 2,
		minWidth: 200,
		renderCell: ({ row }: GridRenderCellParams<Ticket>) => (
			<SubjectLink to={`/tickets/${row.id}`}>{row.subject}</SubjectLink>
		),
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
	const [statusFilter, setStatusFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});

	function handleSortModelChange(model: GridSortModel) {
		setSortModel(model);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}

	function handleStatusChange(e: SelectChangeEvent) {
		setStatusFilter(e.target.value);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}

	function handleCategoryChange(e: SelectChangeEvent) {
		setCategoryFilter(e.target.value);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}

	const { data, isPending, isError } = useQuery({
		queryKey: [
			'tickets',
			sortModel,
			statusFilter,
			categoryFilter,
			paginationModel,
		],
		queryFn: () =>
			getTickets({
				sortField: sortModel[0]?.field,
				sortOrder: sortModel[0]?.sort ?? undefined,
				status: statusFilter || undefined,
				category: categoryFilter || undefined,
				page: paginationModel.page,
				pageSize: paginationModel.pageSize,
			}),
	});

	const tickets = data?.data ?? [];
	const rowCount = data?.total ?? 0;

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

			<FilterBar>
				<FilterFormControl size='small'>
					<InputLabel id='status-filter-label'>Status</InputLabel>
					<Select
						labelId='status-filter-label'
						id='status-filter'
						value={statusFilter}
						label='Status'
						onChange={handleStatusChange}
					>
						<MenuItem value=''>All</MenuItem>
						{Object.values(TicketStatus).map((s) => (
							<MenuItem key={s} value={s}>
								{s}
							</MenuItem>
						))}
					</Select>
				</FilterFormControl>

				<FilterFormControl size='small'>
					<InputLabel id='category-filter-label'>Category</InputLabel>
					<Select
						labelId='category-filter-label'
						id='category-filter'
						value={categoryFilter}
						label='Category'
						onChange={handleCategoryChange}
					>
						<MenuItem value=''>All</MenuItem>
						{Object.values(TicketCategory).map((c) => (
							<MenuItem key={c} value={c}>
								{c}
							</MenuItem>
						))}
					</Select>
				</FilterFormControl>
			</FilterBar>

			<DataGrid
				rows={tickets}
				columns={columns}
				sortingMode='server'
				sortModel={sortModel}
				onSortModelChange={handleSortModelChange}
				paginationMode='server'
				rowCount={rowCount}
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				loading={isPending}
				autoHeight
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
