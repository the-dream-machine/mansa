import React from 'react';
import {NavigationContext} from './NavigationProvider.js';
import {IndexRepository} from './pages/IndexRepository.js';
import {SelectAction} from './pages/SelectAction.js';
import {AppState, NavigationPage} from '../machines/navigationMachine.js';
import {GlobalLoader} from './GlobalLoader.js';
import SelectPackageManager from './pages/SelectPackageManager.js';
import {ExampleScrollPage} from './ExampleScrollPage.js';

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
			{state.matches(NavigationPage.SELECT_OPTION) && <SelectAction />}
			{/* {state.matches(NavigationPage.SELECT_OPTION) && <ExampleScrollPage />} */}
		</>
	);
};

export default NavigationHandler;
