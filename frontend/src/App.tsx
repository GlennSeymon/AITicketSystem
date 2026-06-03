import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/users/UsersPage';
import theme from './theme';

function AuthLayout() {
	return (
		<>
			<NavBar />
			<Outlet />
		</>
	);
}

export default function App() {
	return (
		<ThemeProvider theme={theme}>
			<BrowserRouter>
				<CssBaseline />
				<Routes>
					<Route path='/login' element={<LoginPage />} />
					<Route element={<ProtectedRoute />}>
						<Route element={<AuthLayout />}>
							<Route index element={<HomePage />} />
							<Route element={<AdminRoute />}>
								<Route path='/users' element={<UsersPage />} />
							</Route>
						</Route>
					</Route>
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}
