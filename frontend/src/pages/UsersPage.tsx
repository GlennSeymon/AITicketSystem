import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '../services/users';
import type { User } from '../services/users';
import {
	Alert,
	Button,
	Chip,
	Container,
	Skeleton,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
	styled,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const createSchema = z.object({
	name: z.string().min(1, 'Required'),
	email: z.string().email('Invalid email'),
	password: z.string().min(8, 'Min 8 characters'),
	role: z.enum(['ADMIN', 'AGENT']),
});
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({
	name: z.string().min(1, 'Required'),
	email: z.string().email('Invalid email'),
	role: z.enum(['ADMIN', 'AGENT']),
	isActive: z.boolean(),
});
type EditFormData = z.infer<typeof editSchema>;



const PageContainer = styled(Container)(({ theme }) => ({
	paddingTop: theme.spacing(4),
}));

const PageHeader = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: '1.5rem',
});

const FieldStack = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	paddingTop: '0.5rem',
	minWidth: 400,
});

const RightAlignCell = styled(TableCell)({
	textAlign: 'right',
});

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState('');

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateFormData>({
		resolver: zodResolver(createSchema),
		defaultValues: { name: '', email: '', password: '', role: 'AGENT' },
	});

	const mutation = useMutation({
		mutationFn: createUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			reset();
			setServerError('');
			onClose();
		},
		onError: (err: Error) => setServerError(err.message),
	});

	function handleClose() {
		reset();
		setServerError('');
		onClose();
	}

	return (
		<Dialog open={open} onClose={handleClose}>
			<form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
				<DialogTitle>Add User</DialogTitle>
				<DialogContent>
					<FieldStack>
						{serverError && <Alert severity='error'>{serverError}</Alert>}
						<Controller
							control={control}
							name='name'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									inputRef={ref}
									label='Name'
									fullWidth
									error={!!errors.name}
									helperText={errors.name?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='email'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									inputRef={ref}
									label='Email'
									type='email'
									fullWidth
									error={!!errors.email}
									helperText={errors.email?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='password'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									inputRef={ref}
									label='Password'
									type='password'
									fullWidth
									error={!!errors.password}
									helperText={errors.password?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='role'
							render={({ field }) => (
								<FormControl fullWidth>
									<InputLabel>Role</InputLabel>
									<Select {...field} label='Role'>
										<MenuItem value='AGENT'>Agent</MenuItem>
										<MenuItem value='ADMIN'>Admin</MenuItem>
									</Select>
								</FormControl>
							)}
						/>
					</FieldStack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button type='submit' variant='contained' disabled={mutation.isPending}>
						{mutation.isPending ? 'Creating...' : 'Create'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

function EditUserDialog({
	open,
	user,
	onClose,
}: {
	open: boolean;
	user: User;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState('');

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<EditFormData>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			role: user.role,
			isActive: user.isActive,
		},
	});

	const mutation = useMutation({
		mutationFn: (data: EditFormData) => updateUser(user.id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			setServerError('');
			onClose();
		},
		onError: (err: Error) => setServerError(err.message),
	});

	function handleClose() {
		setServerError('');
		onClose();
	}

	return (
		<Dialog open={open} onClose={handleClose}>
			<form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
				<DialogTitle>Edit User</DialogTitle>
				<DialogContent>
					<FieldStack>
						{serverError && <Alert severity='error'>{serverError}</Alert>}
						<Controller
							control={control}
							name='name'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									inputRef={ref}
									label='Name'
									fullWidth
									error={!!errors.name}
									helperText={errors.name?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='email'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									inputRef={ref}
									label='Email'
									type='email'
									fullWidth
									error={!!errors.email}
									helperText={errors.email?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='role'
							render={({ field }) => (
								<FormControl fullWidth>
									<InputLabel>Role</InputLabel>
									<Select {...field} label='Role'>
										<MenuItem value='AGENT'>Agent</MenuItem>
										<MenuItem value='ADMIN'>Admin</MenuItem>
									</Select>
								</FormControl>
							)}
						/>
						<Controller
							control={control}
							name='isActive'
							render={({ field }) => (
								<FormControlLabel
									control={<Switch checked={field.value} onChange={field.onChange} />}
									label='Active'
								/>
							)}
						/>
					</FieldStack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button type='submit' variant='contained' disabled={mutation.isPending}>
						{mutation.isPending ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default function UsersPage() {
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [editUser, setEditUser] = useState<User | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

	const { data: users, isPending, isError } = useQuery({ queryKey: ['users'], queryFn: getUsers });

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
									<TableCell><Skeleton /></TableCell>
									<TableCell><Skeleton /></TableCell>
									<TableCell><Skeleton variant='rounded' width={60} height={24} /></TableCell>
									<TableCell><Skeleton variant='rounded' width={60} height={24} /></TableCell>
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
										label={user.role === 'ADMIN' ? 'Admin' : 'Agent'}
										color={user.role === 'ADMIN' ? 'primary' : 'default'}
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

			<CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />

			{editUser && (
				<EditUserDialog open user={editUser} onClose={() => setEditUser(null)} />
			)}

			<Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
				<DialogTitle>Delete User</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete {deleteTarget?.name} ({deleteTarget?.email})? This
						action cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
					<Button
						variant='contained'
						color='error'
						disabled={deleteMutation.isPending}
						onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
					>
						{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}
