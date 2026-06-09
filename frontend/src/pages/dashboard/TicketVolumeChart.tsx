import { Alert, Paper, Typography, styled } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDailyTickets } from '../../services/tickets';

const ChartCard = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(3),
	marginTop: theme.spacing(3),
}));

const ChartTitle = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

function formatXAxis(dateStr: string): string {
	const [, month, day] = dateStr.split('-');
	return `${parseInt(month)}/${parseInt(day)}`;
}

export default function TicketVolumeChart() {
	const { data, isPending, isError } = useQuery({
		queryKey: ['daily-tickets'],
		queryFn: getDailyTickets,
	});

	if (isError) {
		return <Alert severity='error'>Failed to load ticket volume data.</Alert>;
	}

	return (
		<ChartCard elevation={1}>
			<ChartTitle variant='overline' color='text.secondary'>
				Tickets per Day — Last 30 Days
			</ChartTitle>
			<ResponsiveContainer width='100%' height={240}>
				<BarChart data={isPending ? [] : data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
					<CartesianGrid strokeDasharray='3 3' vertical={false} />
					<XAxis
						dataKey='date'
						tickFormatter={formatXAxis}
						tick={{ fontSize: 11 }}
						interval={4}
					/>
					<YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
					<Tooltip
						formatter={(value) => [value, 'Tickets']}
						labelFormatter={(label) => {
							const [year, month, day] = String(label).split('-');
							return new Date(+year, +month - 1, +day).toLocaleDateString('en-AU', {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
							});
						}}
					/>
					<Bar dataKey='count' fill='#7c3aed' radius={[3, 3, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
