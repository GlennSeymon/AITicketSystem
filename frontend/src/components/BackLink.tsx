import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material';

const StyledLink = styled(Link)(({ theme }) => ({
	display: 'inline-flex',
	alignItems: 'center',
	gap: theme.spacing(0.5),
	marginBottom: theme.spacing(2),
	color: theme.palette.primary.main,
	textDecoration: 'none',
	fontSize: '0.875rem',
	'&:hover': { textDecoration: 'underline' },
}));

interface BackLinkProps {
	to: string;
	children: ReactNode;
}

export function BackLink({ to, children }: BackLinkProps) {
	return (
		<StyledLink to={to}>
			<ArrowBackIcon fontSize='small' />
			{children}
		</StyledLink>
	);
}
