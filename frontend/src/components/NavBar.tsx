import { AppBar, Button, Toolbar, Typography, styled } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
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

const NavLink = styled(Button)({
	color: 'inherit',
}) as typeof Button;

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
				<NavLink component={Link} to='/'>AI Ticket System</NavLink>
				<GrowBox />
				<NavLink component={Link} to='/tickets'>
					Tickets
				</NavLink>
				{data?.user.role === 'ADMIN' && (
					<NavLink component={Link} to='/users'>
						Users
					</NavLink>
				)}
				<UserName variant='body1'>{data?.user.name}</UserName>
				<SignOutButton onClick={handleSignOut}>Sign Out</SignOutButton>
			</Toolbar>
		</StyledAppBar>
	);
}
