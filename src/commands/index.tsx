import React from 'react';
import {ThemeProvider} from '@inkjs/ui';
import {theme} from '../utils/theme.js';

import {FullScreen} from '../components/FullScreen.js';
import {NavigationProvider} from '../components/NavigationProvider.js';
import NavigationHandler from '../components/NavigationHandler.js';

export default function App() {
	return (
		<ThemeProvider theme={theme}>
			<NavigationProvider>
				<FullScreen>
					<NavigationHandler />
				</FullScreen>
			</NavigationProvider>
		</ThemeProvider>
	);
}
