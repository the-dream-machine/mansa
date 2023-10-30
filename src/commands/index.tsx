import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider} from '@inkjs/ui';
import {theme} from '../utils/theme.js';

import {Setup} from '../components/pages/setup/Setup.js';
import {FullScreen} from '../components/FullScreen.js';

const queryClient = new QueryClient();

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<FullScreen>
					<Setup />
				</FullScreen>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
