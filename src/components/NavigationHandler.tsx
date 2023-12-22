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
		<ToolsProvider libraryCommand={libraryCommand} libraryName={libraryName}>
			{state.matches(NavigationPage.TOOLS) && <Tools />}
			{state.matches(NavigationPage.CREATE_CONFIG) && <SelectPackageManager />}
		</ToolsProvider>
	);
};

export default NavigationHandler;
