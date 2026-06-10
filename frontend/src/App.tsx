import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import { ColorModeContext } from './lib/colorMode';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/users/UsersPage';
import TicketsPage from './pages/tickets/TicketsPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import { createAppTheme } from './theme';

function AuthLayout() {
	return (
		<>
			<NavBar />
			<Outlet />
		</>
	);
}

export default function App() {
	const [mode, setMode] = useState<'light' | 'dark'>(() => {
		return (localStorage.getItem('colorMode') as 'light' | 'dark') || 'light';
	});

	const colorModeValue = useMemo(
		() => ({
			mode,
			toggleColorMode: () => {
				setMode((prev) => {
					const next = prev === 'light' ? 'dark' : 'light';
					localStorage.setItem('colorMode', next);
					return next;
				});
			},
		}),
		[mode],
	);

	const theme = useMemo(() => createAppTheme(mode), [mode]);

	return (
		<ColorModeContext.Provider value={colorModeValue}>
			<ThemeProvider theme={theme}>
				<BrowserRouter>
					<CssBaseline />
					<Routes>
						<Route path='/login' element={<LoginPage />} />
						<Route element={<ProtectedRoute />}>
							<Route element={<AuthLayout />}>
								<Route index element={<HomePage />} />
								<Route path='/tickets' element={<TicketsPage />} />
								<Route path='/tickets/:id' element={<TicketDetailPage />} />
								<Route element={<AdminRoute />}>
									<Route path='/users' element={<UsersPage />} />
								</Route>
							</Route>
						</Route>
						<Route path='*' element={<Navigate to='/' replace />} />
					</Routes>
				</BrowserRouter>
			</ThemeProvider>
		</ColorModeContext.Provider>
	);
}
