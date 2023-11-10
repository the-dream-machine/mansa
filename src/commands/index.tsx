import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider} from '@inkjs/ui';
import {theme} from '../utils/theme.js';

import {FullScreen} from '../components/FullScreen.js';
import {NavigationProvider} from '../components/NavigationProvider.js';
import NavigationHandler from '../components/NavigationHandler.js';

const queryClient = new QueryClient();

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<NavigationProvider>
					{/* <FullScreen> */}
					<NavigationHandler />
					{/* </FullScreen> */}
				</NavigationProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
