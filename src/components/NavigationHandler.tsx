import React from 'react';
import {NavigationContext} from './NavigationProvider.js';
import {InstallDatabase} from './pages/setup/InstallDatabase.js';
import {InstallEmbeddingModel} from './pages/setup/InstallEmbeddingModel.js';
import {IndexRepo} from './pages/IndexRepo.js';
import {SelectAction} from './pages/SelectAction.js';
import {AppState, NavigationPage} from '../machines/navigationMachine.js';
import {GlobalLoader} from './GlobalLoader.js';

const NavigationHandler = () => {
	const [state] = NavigationContext.useActor();
	console.log('🌱 # state:', state.value);
	const showLoader =
		state.matches(AppState.IS_DATABASE_INSTALLED) ||
		state.matches(AppState.IS_DATABASE_RUNNING) ||
		state.matches(AppState.STARTING_DATABASE) ||
		state.matches(AppState.IS_EMBEDDING_MODEL_INSTALLED) ||
		state.matches(AppState.IS_REPO_INDEXED);

	if (showLoader) {
		return <GlobalLoader />;
	}

	return (
		<>
			{state.matches(NavigationPage.INSTALL_DATABASE) && <InstallDatabase />}
			{state.matches(NavigationPage.INSTALL_EMBEDDING_MODEL) && (
				<InstallEmbeddingModel />
			)}
			{state.matches(NavigationPage.INDEX_REPO) && <IndexRepo />}
			{state.matches(NavigationPage.SELECT_OPTION) && <SelectAction />}
		</>
	);
};

export default NavigationHandler;
