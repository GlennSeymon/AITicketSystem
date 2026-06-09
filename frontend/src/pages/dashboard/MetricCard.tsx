import { Paper, Typography, styled } from '@mui/material';

interface MetricCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
}

const Card = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(3),
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const Value = styled(Typography)({ fontWeight: 700 });

export default function MetricCard({ title, value, subtitle }: MetricCardProps) {
	return (
		<Card elevation={1}>
			<Typography variant='overline' color='text.secondary'>
				{title}
			</Typography>
			<Value variant='h4'>{value}</Value>
			{subtitle && (
				<Typography variant='body2' color='text.secondary'>
					{subtitle}
				</Typography>
			)}
		</Card>
	);
}
