import { createTheme } from '@mui/material/styles';

const theme = createTheme({
	palette: {
		primary: {
			main: '#aa3bff',
			light: '#c47dff',
			dark: '#7b1fd4',
			contrastText: '#ffffff',
		},
	},
	typography: {
		fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
	},
	shape: {
		borderRadius: 8,
	},
	components: {
		MuiButton: {
			defaultProps: {
				disableElevation: true,
			},
			styleOverrides: {
				root: {
					textTransform: 'none',
				},
			},
		},
	},
});

export default theme;
