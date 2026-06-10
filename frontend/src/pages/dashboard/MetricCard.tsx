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
	gap: theme.spacing(0.5),
	transition: 'border-color 150ms ease',
	'&:hover': {
		borderColor: theme.palette.divider,
	},
}));

const Label = styled(Typography)(({ theme }) => ({
	fontSize: '0.6875rem',
	fontWeight: 500,
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	color: theme.palette.text.secondary,
	lineHeight: 1.3,
}));

const Value = styled(Typography)(({ theme }) => ({
	fontWeight: 700,
	fontSize: '2.25rem',
	lineHeight: 1.1,
	color: theme.palette.text.primary,
	letterSpacing: '-0.03em',
}));

const Subtitle = styled(Typography)(({ theme }) => ({
	fontSize: '0.8125rem',
	color: theme.palette.text.secondary,
	marginTop: 2,
}));

export default function MetricCard({ title, value, subtitle }: MetricCardProps) {
	return (
		<Card>
			<Label>{title}</Label>
			<Value>{value}</Value>
			{subtitle && <Subtitle>{subtitle}</Subtitle>}
		</Card>
	);
}
