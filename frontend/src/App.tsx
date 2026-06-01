import {
	CssBaseline,
	Typography,
	Container,
	Alert,
	CircularProgress,
	styled,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

const StyledHeading = styled(Typography)(({ theme }) => ({
	marginTop: theme.spacing(4),
}));

async function fetchHealth(): Promise<{ status: string }> {
	const res = await fetch('/api/health');
	if (!res.ok) throw new Error('Health check failed');
	return res.json();
}

export default function App() {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['health'],
		queryFn: fetchHealth,
	});

	return (
		<>
			<CssBaseline />
			<Container>
				<StyledHeading variant='h4'>AI Ticket System</StyledHeading>
				{isLoading && <CircularProgress sx={{ mt: 2 }} />}
				{isError && (
					<Alert severity='error' sx={{ mt: 2 }}>
						Could not reach the backend.
					</Alert>
				)}
				{data && (
					<Alert severity='success' sx={{ mt: 2 }}>
						Backend status: {data.status}
					</Alert>
				)}
			</Container>
		</>
	);
}
