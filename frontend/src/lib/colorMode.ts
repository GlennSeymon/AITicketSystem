import { createContext, useContext } from 'react';

interface ColorModeContextValue {
	mode: 'light' | 'dark';
	toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue>({
	mode: 'light',
	toggleColorMode: () => {},
});

export function useColorMode() {
	return useContext(ColorModeContext);
}
