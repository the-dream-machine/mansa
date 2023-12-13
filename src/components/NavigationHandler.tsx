import React from 'react';
import {NavigationContext} from './NavigationProvider.js';
import {IndexRepository} from './pages/IndexRepository.js';
import {AppState, NavigationPage} from '../machines/navigationMachine.js';
import SelectPackageManager from './pages/SelectPackageManager.js';
import {StepsProvider} from './StepsProvider.js';
import {StepsHandler} from './StepsHandler.js';
import {About} from './pages/About.js';
import {IndexNewFiles} from './pages/IndexNewFiles.js';
import {Spinner} from '@inkjs/ui';
import {Chat} from './pages/Chat.js';

interface Props {
	libraryName: string;
}
const NavigationHandler = ({libraryName}: Props) => {
	const [state] = NavigationContext.useActor();
	const showLoader =
		state.matches(AppState.DOES_CONFIG_EXIST) ||
		state.matches(AppState.DO_CHECKSUMS_EXIST) ||
		state.matches(AppState.DOES_MAP_EXIST);

	if (showLoader) {
		return <Spinner />;
	}

	return (
		<>
			{state.matches(NavigationPage.CHAT) && <Chat name={libraryName} />}
			{state.matches(NavigationPage.ABOUT) && <About />}
			{state.matches(NavigationPage.CREATE_CONFIG) && <SelectPackageManager />}
			{state.matches(NavigationPage.INDEX_REPOSITORY) && <IndexRepository />}
			{state.matches(NavigationPage.INDEX_NEW_FILES) && <IndexNewFiles />}
			{state.matches(NavigationPage.STEPS) && (
				<StepsProvider>
					<StepsHandler />
				</StepsProvider>
			)}
		</>
	);
};

export default NavigationHandler;
