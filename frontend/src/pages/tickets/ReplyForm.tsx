import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompletion } from '@ai-sdk/react';
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
	gap: theme.spacing(1),
	marginTop: theme.spacing(1),
}));

interface ReplyFormProps {
	ticketId: number;
	customerName: string;
	assigneeName?: string;
}

export function ReplyForm({ ticketId, customerName, assigneeName }: ReplyFormProps) {
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState('');

	const {
		control,
		handleSubmit,
		reset,
		watch,
		getValues,
		setValue,
		formState: { errors },
	} = useForm<CreateReplyInput>({
		resolver: zodResolver(createReplySchema),
		defaultValues: { body: '' },
	});

	const { complete, completion, isLoading: isPolishing } = useCompletion({
		api: '/api/tickets/polish-reply',
		streamProtocol: 'text',
		onFinish: (_prompt, text) => setValue('body', text),
	});

	useEffect(() => {
		if (isPolishing && completion) setValue('body', completion);
	}, [completion, isPolishing, setValue]);

	const mutation = useMutation({
		mutationFn: (data: CreateReplyInput) => createReply(ticketId, data.body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
			reset();
			setServerError('');
		},
		onError: (err: Error) => setServerError(err.message),
	});

	const body = watch('body');

	const handlePolish = () => {
		const current = getValues('body');
		if (current.trim()) complete(current, { body: { customerName, assigneeName } });
	};

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
							disabled={isPolishing}
						/>
					)}
				/>
				<Actions>
					<Button
						type='button'
						variant='outlined'
						onClick={handlePolish}
						disabled={!body?.trim() || isPolishing || mutation.isPending}
					>
						{isPolishing ? 'Polishing...' : 'Polish'}
					</Button>
					<Button type='submit' variant='contained' disabled={!body?.trim() || mutation.isPending || isPolishing}>
						{mutation.isPending ? 'Sending...' : 'Send Reply'}
					</Button>
				</Actions>
			</form>
		</>
	);
}
