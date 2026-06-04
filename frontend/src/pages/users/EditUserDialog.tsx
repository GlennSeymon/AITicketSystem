import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema, type UpdateUserInput, Role } from '@repo/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser, type User } from '../../services/users';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Switch,
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

export function EditUserDialog({
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
	} = useForm<UpdateUserInput>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			role: user.role,
			isActive: user.isActive,
		},
	});

	const mutation = useMutation({
		mutationFn: (data: UpdateUserInput) => updateUser(user.id, data),
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
						<Controller
							control={control}
							name='isActive'
							render={({ field }) => (
								<FormControlLabel
									control={
										<Switch checked={field.value} onChange={field.onChange} />
									}
									label='Active'
								/>
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
						{mutation.isPending ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
