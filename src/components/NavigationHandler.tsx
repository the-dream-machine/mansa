import React from 'react';
import {NavigationContext} from './NavigationProvider.js';
import {IndexRepository} from './pages/IndexRepository.js';
import {AppState, NavigationPage} from '../machines/navigationMachine.js';
import {GlobalLoader} from './GlobalLoader.js';
import SelectPackageManager from './pages/SelectPackageManager.js';
import {StepsProvider} from './StepsProvider.js';
import {StepsHandler} from './StepsHandler.js';

const NavigationHandler = () => {
	const [state] = NavigationContext.useActor();
	const showLoader =
		state.matches(AppState.DOES_CONFIG_EXIST) ||
		state.matches(AppState.DOES_CHECKSUMS_EXIST) ||
		state.matches(AppState.DOES_MAP_EXIST);

	if (showLoader) {
		return <GlobalLoader />;
	}

	return (
		<>
			{state.matches(NavigationPage.CREATE_CONFIG) && <SelectPackageManager />}
			{state.matches(NavigationPage.INDEX_REPOSITORY) && <IndexRepository />}
			{state.matches(NavigationPage.SELECT_OPTION) && (
				<StepsProvider>
					<StepsHandler />
				</StepsProvider>
			)}
		</>
	);
};

export default NavigationHandler;
