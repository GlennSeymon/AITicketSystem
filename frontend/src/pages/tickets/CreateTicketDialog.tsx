import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketSchema, type CreateTicketInput, TicketCategory } from '@repo/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket } from '../../services/tickets';
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
	gap: '0.5rem',
	paddingTop: '0.25rem',
	minWidth: 480,
});

export function CreateTicketDialog({
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
	} = useForm<CreateTicketInput>({
		resolver: zodResolver(createTicketSchema),
		defaultValues: { subject: '', fromEmail: '', fromName: '', body: '', category: undefined },
	});

	const mutation = useMutation({
		mutationFn: createTicket,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
				<DialogTitle>Create Ticket</DialogTitle>
				<DialogContent>
					<FieldStack>
						{serverError && <Alert severity='error'>{serverError}</Alert>}
						<Controller
							control={control}
							name='subject'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									slotProps={{ htmlInput: { ref } }}
									label='Subject'
									fullWidth
									error={!!errors.subject}
									helperText={errors.subject?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='fromName'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									slotProps={{ htmlInput: { ref } }}
									label='From Name'
									fullWidth
									error={!!errors.fromName}
									helperText={errors.fromName?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='fromEmail'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									slotProps={{ htmlInput: { ref } }}
									label='From Email'
									type='email'
									fullWidth
									error={!!errors.fromEmail}
									helperText={errors.fromEmail?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='body'
							render={({ field: { ref, ...rest } }) => (
								<TextField
									{...rest}
									slotProps={{ htmlInput: { ref } }}
									label='Message'
									multiline
									rows={3}
									fullWidth
									error={!!errors.body}
									helperText={errors.body?.message}
								/>
							)}
						/>
						<Controller
							control={control}
							name='category'
							render={({ field: { value, onChange, ...rest } }) => (
								<FormControl fullWidth>
									<InputLabel>Category</InputLabel>
									<Select
										{...rest}
										value={value ?? ''}
										onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
										label='Category'
									>
										<MenuItem value=''><em>None</em></MenuItem>
										<MenuItem value={TicketCategory.GENERAL}>General</MenuItem>
										<MenuItem value={TicketCategory.TECHNICAL}>Technical</MenuItem>
										<MenuItem value={TicketCategory.REFUND}>Refund</MenuItem>
										<MenuItem value={TicketCategory.UNCATEGORISED}>Uncategorised</MenuItem>
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
