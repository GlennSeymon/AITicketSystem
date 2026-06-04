import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserInput, Role } from '@repo/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '../../services/users';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	styled,
} from '@mui/material';

const FieldStack = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	paddingTop: '0.5rem',
	minWidth: 400,
});

export function CreateUserDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState('');

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateUserInput>({
		resolver: zodResolver(createUserSchema),
		defaultValues: { name: '', email: '', password: '', role: Role.AGENT },
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
									slotProps={{ htmlInput: { ref } }}
									label='Name'
									fullWidth
									error={!!errors.name}
									helperText={errors.name?.message ?? ' '}
								/>
							)}
						/>
						<Controller
							control={control}
							name='email'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									slotProps={{ htmlInput: { ref } }}
									label='Email'
									type='email'
									fullWidth
									error={!!errors.email}
									helperText={errors.email?.message ?? ' '}
								/>
							)}
						/>
						<Controller
							control={control}
							name='password'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									slotProps={{ htmlInput: { ref } }}
									label='Password'
									type='password'
									fullWidth
									error={!!errors.password}
									helperText={errors.password?.message ?? ' '}
								/>
							)}
						/>
						<Controller
							control={control}
							name='role'
							render={({ field }) => (
								<FormControl fullWidth>
									<InputLabel id='role-label'>Role</InputLabel>
									<Select {...field} labelId='role-label' id='role-select' label='Role'>
										<MenuItem value={Role.AGENT}>Agent</MenuItem>
										<MenuItem value={Role.ADMIN}>Admin</MenuItem>
									</Select>
								</FormControl>
							)}
						/>
					</FieldStack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button
						type='submit'
						variant='contained'
						disabled={mutation.isPending}
					>
						{mutation.isPending ? 'Creating...' : 'Create'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
