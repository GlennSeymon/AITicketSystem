import { CircularProgress, styled } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../lib/authClient';
import { Role } from '@repo/core';

const CenteredBox = styled('div')({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100vh',
});

export default function AdminRoute() {
	const { data, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<CenteredBox>
				<CircularProgress />
			</CenteredBox>
		);
	}

	if (!data || data.user.role !== Role.ADMIN) {
		return <Navigate to='/' replace />;
	}

	return <Outlet />;
}
