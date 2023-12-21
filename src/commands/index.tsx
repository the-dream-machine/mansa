import React from 'react';
import zod from 'zod';
import {argument} from 'pastel';
import {ThemeProvider} from '@inkjs/ui';

import {NavigationProvider} from '../components/NavigationProvider.js';
import {inkTheme} from '../styles/inkTheme.js';
import NavigationHandler from '../components/NavigationHandler.js';

export const args = zod.tuple([
	zod.string().describe(
		argument({
			name: 'command',
			description: 'The command you want to run e.g "install"',
		}),
	),
	zod.string().describe(
		argument({
			name: 'library',
			description: 'Name of the library you are trying to use e.g "stripe"',
		}),
	),
]);

type Props = {
	args: zod.infer<typeof args>;
};

export default function Index({args}: Props) {
	return (
		<ThemeProvider theme={inkTheme}>
			<NavigationProvider>
				{/* <FullScreen> */}
				<NavigationHandler libraryCommand={args[0]} libraryName={args[1]} />
				{/* </FullScreen> */}
			</NavigationProvider>
		</ThemeProvider>
	);
}
