import React from 'react';
import {NavigationContext} from './NavigationProvider.js';
import {AppState, NavigationPage} from '../machines/navigationMachine.js';
import SelectPackageManager from './pages/SelectPackageManager.js';
import {Spinner} from '@inkjs/ui';
import {Tools} from './pages/Tools.js';
import {ToolsProvider} from './ToolsProvider.js';

interface Props {
	libraryName: string;
	libraryCommand: string;
}
const NavigationHandler = ({libraryName, libraryCommand}: Props) => {
	const [state] = NavigationContext.useActor();
	const showLoader = state.matches(AppState.DOES_CONFIG_EXIST);
	if (showLoader) {
		return <Spinner />;
	}

	return (
		<>
			{state.matches(NavigationPage.TOOLS) && (
				<ToolsProvider
					libraryCommand={libraryCommand}
					libraryName={libraryName}
				>
					<Tools />
				</ToolsProvider>
			)}
			{state.matches(NavigationPage.CREATE_CONFIG) && <SelectPackageManager />}
		</>
	);
};

export default NavigationHandler;
