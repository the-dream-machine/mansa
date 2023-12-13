import React from 'react';
import zod from 'zod';
import {argument} from 'pastel';
import {ThemeProvider} from '@inkjs/ui';
import NavigationHandler from '../components/NavigationHandler.js';
import {NavigationProvider} from '../components/NavigationProvider.js';
import {inkTheme} from '../styles/inkTheme.js';
import {FullScreen} from '../components/FullScreen.js';

export const args = zod.tuple([
	zod.string().describe(
		argument({
			name: 'library',
			description: 'Library to install e.g "stripe"',
		}),
	),
]);

type Props = {
	args: zod.infer<typeof args>;
};

export default function Install({args}: Props) {
	return (
		<ThemeProvider theme={inkTheme}>
			<NavigationProvider>
				{/* <FullScreen> */}
				<NavigationHandler libraryName={args[0]} />
				{/* </FullScreen> */}
			</NavigationProvider>
		</ThemeProvider>
	);
}
