import { AppBar, Avatar, Button, Divider, IconButton, Toolbar, styled } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authClient } from '../lib/authClient';
import { useColorMode } from '../lib/colorMode';
import { Role } from '@repo/core';

const StyledAppBar = styled(AppBar)({
	position: 'static',
	height: 56,
	justifyContent: 'center',
});

const Brand = styled(Link)(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	gap: 8,
	textDecoration: 'none',
	color: theme.palette.text.primary,
	fontWeight: 700,
	fontSize: '0.9375rem',
	letterSpacing: '-0.01em',
	flexShrink: 0,
	'&:hover': { opacity: 0.8 },
}));

const LogoMark = styled('div')(({ theme }) => ({
	width: 28,
	height: 28,
	backgroundColor: theme.palette.primary.main,
	borderRadius: 6,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
}));

const LogoIcon = styled(SupportAgentIcon)({
	fontSize: 16,
	color: '#ffffff',
});

const NavArea = styled('nav')({
	display: 'flex',
	alignItems: 'center',
	gap: 2,
	marginLeft: 24,
	flexGrow: 1,
});

interface NavLinkItemProps {
	active?: boolean;
}

const NavLinkItem = styled(Link, {
	shouldForwardProp: (p) => p !== 'active',
})<NavLinkItemProps>(({ theme, active }) => ({
	color: active ? theme.palette.primary.main : theme.palette.text.secondary,
	fontWeight: active ? 600 : 500,
	fontSize: '0.875rem',
	textDecoration: 'none',
	padding: '5px 12px',
	borderRadius: 6,
	backgroundColor: active
		? theme.palette.mode === 'dark'
			? 'rgba(59,130,246,0.15)'
			: '#eff6ff'
		: 'transparent',
	display: 'inline-flex',
	alignItems: 'center',
	lineHeight: 1.5,
	transition: 'background-color 120ms, color 120ms',
	'&:hover': {
		backgroundColor: theme.palette.action.hover,
		color: theme.palette.text.primary,
	},
}));

const UserSection = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 10,
});

const UserName = styled('span')(({ theme }) => ({
	fontSize: '0.875rem',
	fontWeight: 500,
	color: theme.palette.text.secondary,
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
	width: 28,
	height: 28,
	fontSize: '0.6875rem',
	fontWeight: 700,
	backgroundColor: theme.palette.primary.main,
	color: '#ffffff',
}));

const NavDivider = styled(Divider)({
	height: 20,
	margin: '0 4px',
});

const SignOutButton = styled(Button)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontWeight: 500,
	fontSize: '0.875rem',
	minWidth: 0,
	padding: '6px 10px',
	gap: 6,
	'&:hover': {
		color: theme.palette.text.primary,
		backgroundColor: theme.palette.action.hover,
	},
}));

const SmallLogoutIcon = styled(LogoutIcon)({
	fontSize: 16,
});

const ToggleButton = styled(IconButton)(({ theme }) => ({
	width: 32,
	height: 32,
	borderRadius: 6,
	color: theme.palette.text.secondary,
	'&:hover': {
		backgroundColor: theme.palette.action.hover,
		color: theme.palette.text.primary,
	},
}));

export default function NavBar() {
	const { data } = authClient.useSession();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { mode, toggleColorMode } = useColorMode();

	async function handleSignOut() {
		await authClient.signOut();
		navigate('/login', { replace: true });
	}

	const initials = data?.user.name
		?.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<StyledAppBar>
			<Toolbar variant='dense' style={{ height: 56 }}>
				<Brand to='/'>
					<LogoMark>
						<LogoIcon />
					</LogoMark>
					AI Tickets
				</Brand>

				<NavArea>
					<NavLinkItem to='/' active={pathname === '/'}>
						Dashboard
					</NavLinkItem>
					<NavLinkItem to='/tickets' active={pathname.startsWith('/tickets')}>
						Tickets
					</NavLinkItem>
					{data?.user.role === Role.ADMIN && (
						<NavLinkItem to='/users' active={pathname === '/users'}>
							Users
						</NavLinkItem>
					)}
				</NavArea>

				<UserSection>
					<ToggleButton onClick={toggleColorMode} title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
						{mode === 'dark' ? <LightModeOutlinedIcon style={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon style={{ fontSize: 18 }} />}
					</ToggleButton>

					<NavDivider orientation='vertical' flexItem />

					<UserAvatar>{initials}</UserAvatar>
					<UserName>{data?.user.name}</UserName>

					<NavDivider orientation='vertical' flexItem />

					<SignOutButton onClick={handleSignOut} startIcon={<SmallLogoutIcon />}>
						Sign out
					</SignOutButton>
				</UserSection>
			</Toolbar>
		</StyledAppBar>
	);
}
