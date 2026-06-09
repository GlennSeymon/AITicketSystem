import { Typography } from '@mui/material';
import { authClient } from '../lib/authClient';
import { PageContainer, PageHeader } from '../components/layout';
import MetricsDashboard from './dashboard/MetricsDashboard';

export default function HomePage() {
	const { data } = authClient.useSession();

	return (
		<PageContainer>
			<PageHeader>
				<Typography variant='h5' component='h1'>
					Welcome, {data?.user.name}
				</Typography>
			</PageHeader>
			<MetricsDashboard />
		</PageContainer>
	);
}
