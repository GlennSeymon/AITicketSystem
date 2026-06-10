import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Paper, Typography, TextField, styled } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
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

const PageWrapper = styled('div')(({ theme }) => ({
	minHeight: '100vh',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	background:
		theme.palette.mode === 'dark'
			? 'radial-gradient(ellipse at 50% 0%, #1e3a5f 0%, #0f172a 55%)'
			: 'radial-gradient(ellipse at 50% 0%, #eff6ff 0%, #f9fafb 55%)',
}));

const LoginCard = styled(Paper)(({ theme }) => ({
	width: 400,
	maxWidth: '100%',
	padding: theme.spacing(5),
	borderRadius: 12,
}));

const BrandRow = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 10,
	marginBottom: 28,
});

const LogoMark = styled('div')(({ theme }) => ({
	width: 36,
	height: 36,
	backgroundColor: theme.palette.primary.main,
	borderRadius: 8,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
}));

const BrandIcon = styled(SupportAgentIcon)({
	fontSize: 20,
	color: '#ffffff',
});

const BrandName = styled(Typography)(({ theme }) => ({
	fontWeight: 700,
	fontSize: '1.0625rem',
	letterSpacing: '-0.01em',
	color: theme.palette.text.primary,
	lineHeight: 1,
}));

const CardTitle = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
	fontSize: '1.375rem',
	letterSpacing: '-0.02em',
	color: theme.palette.text.primary,
	marginBottom: theme.spacing(0.5),
}));

const CardSubtitle = styled(Typography)(({ theme }) => ({
	fontSize: '0.875rem',
	color: theme.palette.text.secondary,
	marginBottom: theme.spacing(3.5),
}));

const FieldLabel = styled('label')(({ theme }) => ({
	fontSize: '0.8125rem',
	fontWeight: 500,
	color: theme.palette.text.primary,
	marginBottom: 4,
	display: 'block',
	fontFamily: 'inherit',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	width: '100%',
	marginBottom: theme.spacing(2.5),
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
	marginBottom: theme.spacing(2.5),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
	width: '100%',
	marginTop: theme.spacing(0.5),
	height: 40,
	fontSize: '0.9375rem',
	fontWeight: 600,
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
		const { error } = await authClient.signIn.email(values);
		if (error) {
			setServerError(error.message ?? 'Login failed. Please try again.');
		} else {
			navigate('/', { replace: true });
		}
	}

	return (
		<PageWrapper>
			<LoginCard elevation={1}>
				<BrandRow>
					<LogoMark>
						<BrandIcon />
					</LogoMark>
					<BrandName>AI Tickets</BrandName>
				</BrandRow>

				<CardTitle>Welcome back</CardTitle>
				<CardSubtitle>Sign in to your support dashboard</CardSubtitle>

				{serverError && (
					<ErrorAlert severity='error'>{serverError}</ErrorAlert>
				)}

				<form onSubmit={handleSubmit(onSubmit)} noValidate>
					<FieldLabel>Email address</FieldLabel>
					<StyledTextField
						type='email'
						autoComplete='email'
						placeholder='you@example.com'
						error={!!errors.email}
						helperText={errors.email?.message}
						size='small'
						{...register('email')}
					/>

					<FieldLabel>Password</FieldLabel>
					<StyledTextField
						type='password'
						autoComplete='current-password'
						error={!!errors.password}
						helperText={errors.password?.message}
						size='small'
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
