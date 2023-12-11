import React from 'react';
import zod from 'zod';
import {argument} from 'pastel';
import {ThemeProvider} from '@inkjs/ui';
import NavigationHandler from '../components/NavigationHandler.js';
import {NavigationProvider} from '../components/NavigationProvider.js';
import {inkTheme} from '../styles/inkTheme.js';
import {FullScreen} from '../components/FullScreen.js';
import {Chat} from '../components/pages/Chat.js';

export const args = zod.tuple([
	zod
		.string()
		.optional()
		.describe(
			argument({
				name: 'prompt',
				description: 'Prompt to pass to the agent',
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
				<FullScreen>
					<Chat />
				</FullScreen>
			</NavigationProvider>
		</ThemeProvider>
	);
}
