import { AppBar, Button, Toolbar, Typography, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/authClient';

const StyledAppBar = styled(AppBar)({
	position: 'static',
});

const GrowBox = styled('div')({
	flexGrow: 1,
});

const UserName = styled(Typography)({
	marginRight: 16,
});

const SignOutButton = styled(Button)({
	color: 'inherit',
});

export default function NavBar() {
	const { data } = authClient.useSession();
	const navigate = useNavigate();

	async function handleSignOut() {
		await authClient.signOut();
		navigate('/login', { replace: true });
	}

	return (
		<StyledAppBar>
			<Toolbar>
				<Typography variant='h6'>AI Ticket System</Typography>
				<GrowBox />
				<UserName variant='body1'>{data?.user.name}</UserName>
				<SignOutButton onClick={handleSignOut}>Sign Out</SignOutButton>
			</Toolbar>
		</StyledAppBar>
	);
}
