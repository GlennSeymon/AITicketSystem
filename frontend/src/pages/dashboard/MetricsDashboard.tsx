import { Alert, Grid, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getTicketStats } from '../../services/tickets';
import MetricCard from './MetricCard';
import TicketVolumeChart from './TicketVolumeChart';

function formatResolutionTime(ms: number | null): string {
	if (ms === null) return '—';
	const minutes = Math.round(ms / 60000);
	if (minutes < 120) return `${minutes} min`;
	return `${(minutes / 60).toFixed(1)} hr`;
}

export default function MetricsDashboard() {
	const { data, isPending, isError } = useQuery({
		queryKey: ['ticket-stats'],
		queryFn: getTicketStats,
	});

	if (isError) {
		return <Alert severity='error'>Failed to load dashboard metrics.</Alert>;
	}

	if (isPending) {
		return (
			<Grid container spacing={2}>
				{Array.from({ length: 5 }).map((_, i) => (
					<Grid key={i} size={{ xs: 12, sm: 6, md: 'grow' }}>
						<Skeleton variant='rectangular' height={120} />
					</Grid>
				))}
			</Grid>
		);
	}

	return (
		<>
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
					<MetricCard title='Total Tickets' value={data.totalTickets} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
					<MetricCard title='Open Tickets' value={data.openTickets} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
					<MetricCard title='Resolved by AI' value={data.resolvedByAI} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
					<MetricCard
						title='AI Resolution Rate'
						value={`${data.aiResolutionPercent}%`}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 'grow' }}>
					<MetricCard
						title='Avg Resolution Time'
						value={formatResolutionTime(data.avgResolutionTimeMs)}
					/>
				</Grid>
			</Grid>
			<TicketVolumeChart />
		</>
	);
}
