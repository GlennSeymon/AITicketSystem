import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser, type User } from '../../services/users';
import { Role } from '@repo/core';
import {
	Alert,
	Button,
	Chip,
	Skeleton,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	styled,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { PageContainer, PageHeader } from '../../components/layout';

const RightAlignCell = styled(TableCell)({
	textAlign: 'right',
});

export default function UsersPage() {
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [editUser, setEditUser] = useState<User | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

	const {
		data: users,
		isPending,
		isError,
	} = useQuery({ queryKey: ['users'], queryFn: getUsers });

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteUser(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			setDeleteTarget(null);
		},
		onError: (err: Error) => alert(err.message),
	});

	if (isPending) {
		return (
			<PageContainer>
				<PageHeader>
					<Skeleton variant='text' width={200} height={40} />
					<Skeleton variant='rounded' width={120} height={36} />
				</PageHeader>
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								{['Name', 'Email', 'Role', 'Status', 'Actions'].map((col) => (
									<TableCell key={col}>{col}</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton />
									</TableCell>
									<TableCell>
										<Skeleton />
									</TableCell>
									<TableCell>
										<Skeleton variant='rounded' width={60} height={24} />
									</TableCell>
									<TableCell>
										<Skeleton variant='rounded' width={60} height={24} />
									</TableCell>
									<RightAlignCell>
										<Skeleton variant='circular' width={28} height={28} />
									</RightAlignCell>
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
				<Alert severity='error'>Failed to load users.</Alert>
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<PageHeader>
				<Typography variant='h5' component='h1'>
					User Management
				</Typography>
				<Button
					variant='contained'
					startIcon={<PersonAddIcon />}
					onClick={() => setCreateOpen(true)}
				>
					Add User
				</Button>
			</PageHeader>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Role</TableCell>
							<TableCell>Status</TableCell>
							<RightAlignCell>Actions</RightAlignCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>{user.name}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Chip
										label={user.role === Role.ADMIN ? 'Admin' : 'Agent'}
										color={user.role === Role.ADMIN ? 'primary' : 'default'}
										size='small'
									/>
								</TableCell>
								<TableCell>
									<Chip
										label={user.isActive ? 'Active' : 'Inactive'}
										color={user.isActive ? 'success' : 'error'}
										size='small'
									/>
								</TableCell>
								<RightAlignCell>
									<IconButton
										size='small'
										onClick={() => setEditUser(user)}
										aria-label={`Edit ${user.name}`}
									>
										<EditOutlinedIcon fontSize='small' />
									</IconButton>
									<IconButton
										size='small'
										color='error'
										onClick={() => setDeleteTarget(user)}
										aria-label={`Delete ${user.name}`}
									>
										<DeleteOutlinedIcon fontSize='small' />
									</IconButton>
								</RightAlignCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			<CreateUserDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>

			{editUser && (
				<EditUserDialog
					open
					user={editUser}
					onClose={() => setEditUser(null)}
				/>
			)}

			<Dialog
				open={Boolean(deleteTarget)}
				onClose={() => setDeleteTarget(null)}
			>
				<DialogTitle>Delete User</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete {deleteTarget?.name} (
						{deleteTarget?.email})? This action cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
					<Button
						variant='contained'
						color='error'
						disabled={deleteMutation.isPending}
						onClick={() =>
							deleteTarget && deleteMutation.mutate(deleteTarget.id)
						}
					>
						{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}
