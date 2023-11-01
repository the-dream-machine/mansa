import React, {useEffect, useState} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Spinner, ThemeProvider} from '@inkjs/ui';
import {theme} from '../utils/theme.js';

import {FullScreen} from '../components/FullScreen.js';
import {chromaStart} from '../scripts/chroma/chromaStart.js';
import {chromaStop} from '../scripts/chroma/chromaStop.js';
import {NavigationProvider} from '../components/NavigationProvider.js';
import NavigationHandler from '../components/NavigationHandler.js';

const queryClient = new QueryClient();

const listenerCallback = async () => {
	await chromaStop();
};

export default function App() {
	const [isInitializingDatabase, setIsInitializingDatabase] = useState(false);

	useEffect(() => {
		setIsInitializingDatabase(true);
		// Start chroma DB on mount

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		(async () => {
			await chromaStart();
			setIsInitializingDatabase(false);
		})();

		return () => {
			// Stop Chroma DB on unmount

			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			process.off('SIGINT', listenerCallback);
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			process.off('SIGTERM', listenerCallback);
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			process.off('uncaughtException', listenerCallback);
		};
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<NavigationProvider>
					<FullScreen>
						{isInitializingDatabase ? (
							<Spinner label="🍥 Starting database..." />
						) : (
							<NavigationHandler />
						)}
					</FullScreen>
				</NavigationProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
