import { Typography, styled } from '@mui/material';

const PageContainer = styled('div')({
	padding: '2rem',
});

export default function UsersPage() {
	return (
		<PageContainer>
			<Typography variant='h4' component='h1'>
				Users
			</Typography>
		</PageContainer>
	);
}
