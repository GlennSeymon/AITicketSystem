import { CircularProgress, styled } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../lib/authClient';

const CenteredBox = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100vh',
});

export default function ProtectedRoute() {
	const { data, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<CenteredBox>
				<CircularProgress />
			</CenteredBox>
		);
	}

	if (!data) {
		return <Navigate to='/login' replace />;
	}

	return <Outlet />;
}
