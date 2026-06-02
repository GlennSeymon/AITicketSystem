import { Container, Typography, styled } from '@mui/material';
import { authClient } from '../lib/authClient';

const PageContainer = styled(Container)(({ theme }) => ({
	paddingTop: theme.spacing(4),
	textAlign: 'left',
}));

const WelcomeHeading = styled(Typography)({
	fontWeight: 500,
});

export default function HomePage() {
	const { data } = authClient.useSession();

	return (
		<PageContainer>
			<WelcomeHeading variant='h5'>Welcome, {data?.user.name}</WelcomeHeading>
		</PageContainer>
	);
}
