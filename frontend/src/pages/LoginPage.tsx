import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Paper, TextField, Typography, styled } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authClient } from '../lib/authClient';

const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const PageWrapper = styled('div')({
	minHeight: '100vh',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
});

const LoginCard = styled(Paper)(({ theme }) => ({
	width: 380,
	maxWidth: '100%',
	padding: theme.spacing(4),
	textAlign: 'left',
}));

const CardTitle = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(3),
	fontWeight: 600,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	width: '100%',
	marginBottom: theme.spacing(2),
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
	width: '100%',
	marginTop: theme.spacing(1),
}));

export default function LoginPage() {
	const { data, isPending } = authClient.useSession();
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	if (!isPending && data) {
		return <Navigate to='/' replace />;
	}

	async function onSubmit(values: LoginFormData) {
		setServerError(null);
		const { error } = await authClient.signIn.email({
			email: values.email,
			password: values.password,
		});
		if (error) {
			setServerError(error.message ?? 'Login failed. Please try again.');
		} else {
			navigate('/', { replace: true });
		}
	}

	return (
		<PageWrapper>
			<LoginCard elevation={3}>
				<CardTitle variant='h5'>Sign in</CardTitle>
				{serverError && (
					<ErrorAlert severity='error'>{serverError}</ErrorAlert>
				)}
				<form onSubmit={handleSubmit(onSubmit)} noValidate>
					<StyledTextField
						label='Email'
						type='email'
						autoComplete='email'
						error={!!errors.email}
						helperText={errors.email?.message}
						{...register('email')}
					/>
					<StyledTextField
						label='Password'
						type='password'
						autoComplete='current-password'
						error={!!errors.password}
						helperText={errors.password?.message}
						{...register('password')}
					/>
					<SubmitButton
						type='submit'
						variant='contained'
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Signing in…' : 'Sign in'}
					</SubmitButton>
				</form>
			</LoginCard>
		</PageWrapper>
	);
}
