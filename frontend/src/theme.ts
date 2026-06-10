import { createTheme } from '@mui/material/styles';

export function createAppTheme(mode: 'light' | 'dark') {
	const isDark = mode === 'dark';

	const colors = {
		bg: isDark ? '#0f172a' : '#f9fafb',
		paper: isDark ? '#1e293b' : '#ffffff',
		border: isDark ? '#334155' : '#e5e7eb',
		borderHover: isDark ? '#475569' : '#d1d5db',
		textPrimary: isDark ? '#f1f5f9' : '#111827',
		textSecondary: isDark ? '#94a3b8' : '#6b7280',
		hover: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
		activeNavBg: isDark ? '#1e3a5f' : '#eff6ff',
		navBar: isDark ? '#1e293b' : '#ffffff',
		primary: isDark ? '#3b82f6' : '#2563eb',
	};

	return createTheme({
		palette: {
			mode,
			primary: {
				main: colors.primary,
				light: '#60a5fa',
				dark: '#1d4ed8',
				contrastText: '#ffffff',
			},
			secondary: {
				main: '#6b7280',
			},
			background: {
				default: colors.bg,
				paper: colors.paper,
			},
			text: {
				primary: colors.textPrimary,
				secondary: colors.textSecondary,
			},
			divider: colors.border,
			error: { main: '#ef4444' },
			warning: { main: '#f59e0b' },
			success: { main: '#10b981' },
			info: { main: '#3b82f6' },
		},
		typography: {
			fontFamily: "'Geist Variable', -apple-system, BlinkMacSystemFont, sans-serif",
			h4: { fontWeight: 700, letterSpacing: '-0.02em' },
			h5: { fontWeight: 600, letterSpacing: '-0.01em' },
			h6: { fontWeight: 600 },
			body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
			body2: { fontSize: '0.875rem', lineHeight: 1.5 },
			overline: {
				fontSize: '0.6875rem',
				fontWeight: 500,
				letterSpacing: '0.08em',
				lineHeight: 1.4,
			},
		},
		shape: {
			borderRadius: 8,
		},
		components: {
			MuiCssBaseline: {
				styleOverrides: {
					body: {
						backgroundColor: colors.bg,
						WebkitFontSmoothing: 'antialiased',
						MozOsxFontSmoothing: 'grayscale',
					},
				},
			},
			MuiAppBar: {
				defaultProps: { elevation: 0 },
				styleOverrides: {
					root: {
						backgroundColor: colors.navBar,
						borderBottom: `1px solid ${colors.border}`,
						color: colors.textPrimary,
					},
				},
			},
			MuiPaper: {
				defaultProps: { elevation: 0 },
				styleOverrides: {
					root: {
						backgroundImage: 'none',
						border: `1px solid ${colors.border}`,
					},
				},
			},
			MuiButton: {
				defaultProps: { disableElevation: true },
				styleOverrides: {
					root: {
						textTransform: 'none',
						fontWeight: 500,
						fontSize: '0.875rem',
						letterSpacing: 0,
						'&.MuiButton-containedPrimary:hover': {
							backgroundColor: '#1d4ed8',
						},
						'&.MuiButton-outlinedPrimary': {
							borderColor: colors.borderHover,
							color: colors.textSecondary,
							'&:hover': {
								borderColor: colors.border,
								backgroundColor: colors.hover,
							},
						},
					},
				},
			},
			MuiChip: {
				styleOverrides: {
					root: {
						fontWeight: 500,
						fontSize: '0.75rem',
						borderRadius: 6,
						'&.MuiChip-colorSuccess': {
							backgroundColor: isDark ? '#14532d' : '#dcfce7',
							color: isDark ? '#86efac' : '#166534',
						},
						'&.MuiChip-colorWarning': {
							backgroundColor: isDark ? '#78350f' : '#fef3c7',
							color: isDark ? '#fde68a' : '#92400e',
						},
						'&.MuiChip-colorDefault': {
							backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
							color: isDark ? '#94a3b8' : '#374151',
							border: isDark ? `1px solid ${colors.border}` : 'none',
						},
						'&.MuiChip-colorError': {
							backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
							color: isDark ? '#fca5a5' : '#991b1b',
						},
						'&.MuiChip-colorInfo': {
							backgroundColor: isDark ? '#1e3a5f' : '#dbeafe',
							color: isDark ? '#93c5fd' : '#1e40af',
						},
					},
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: { fontSize: '0.875rem' },
				},
			},
			MuiInputLabel: {
				styleOverrides: {
					root: { fontSize: '0.875rem' },
				},
			},
			MuiAlert: {
				styleOverrides: {
					root: {
						borderRadius: 8,
						fontSize: '0.875rem',
						border: 'none',
					},
				},
			},
			MuiDialog: {
				styleOverrides: {
					paper: {
						border: 'none',
						boxShadow: isDark
							? '0 20px 60px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)'
							: '0 20px 60px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
					},
				},
			},
			MuiTooltip: {
				styleOverrides: {
					tooltip: {
						fontSize: '0.75rem',
						backgroundColor: isDark ? '#334155' : '#1f2937',
						borderRadius: 6,
					},
				},
			},
			MuiTableCell: {
				styleOverrides: {
					head: {
						fontWeight: 600,
						fontSize: '0.8125rem',
						color: colors.textSecondary,
						backgroundColor: isDark ? '#1e293b' : '#f9fafb',
					},
				},
			},
			MuiIconButton: {
				styleOverrides: {
					root: {
						color: colors.textSecondary,
						'&:hover': {
							backgroundColor: colors.hover,
							color: colors.textPrimary,
						},
					},
				},
			},
		},
	});
}
