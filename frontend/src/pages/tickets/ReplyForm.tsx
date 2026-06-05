import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReplySchema, type CreateReplyInput } from '@repo/core';
import { createReply } from '../../services/tickets';
import {
	Alert,
	Button,
	TextField,
	styled,
} from '@mui/material';

const Actions = styled('div')(({ theme }) => ({
	display: 'flex',
	justifyContent: 'flex-end',
	marginTop: theme.spacing(1),
}));

interface ReplyFormProps {
	ticketId: number;
}

export function ReplyForm({ ticketId }: ReplyFormProps) {
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState('');

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateReplyInput>({
		resolver: zodResolver(createReplySchema),
		defaultValues: { body: '' },
	});

	const mutation = useMutation({
		mutationFn: (data: CreateReplyInput) => createReply(ticketId, data.body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
			reset();
			setServerError('');
		},
		onError: (err: Error) => setServerError(err.message),
	});

	return (
		<>
			{serverError && (
				<Alert severity='error' style={{ marginBottom: '1rem' }}>
					{serverError}
				</Alert>
			)}
			<form noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))}>
				<Controller
					control={control}
					name='body'
					render={({ field: { ref, ...rest } }) => (
						<TextField
							{...rest}
							slotProps={{ htmlInput: { ref } }}
							label='Reply'
							multiline
							rows={4}
							fullWidth
							error={!!errors.body}
							helperText={errors.body?.message}
						/>
					)}
				/>
				<Actions>
					<Button type='submit' variant='contained' disabled={mutation.isPending}>
						{mutation.isPending ? 'Sending...' : 'Send Reply'}
					</Button>
				</Actions>
			</form>
		</>
	);
}
