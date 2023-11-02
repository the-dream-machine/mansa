import React from 'react';
import {useNavigation} from './NavigationProvider.js';
import {InstallDatabase} from './pages/setup/InstallDatabase.js';
import {InstallEmbeddingModel} from './pages/setup/InstallEmbeddingModel.js';
import {IndexFiles} from './pages/IndexFiles.js';
import {SelectInstallation} from './pages/SelectInstallation.js';

const NavigationHandler = () => {
	const navigation = useNavigation();
	if (!navigation) {
		return;
	}

	return (
		<>
			{navigation.activePage === 'installDatabase' && <InstallDatabase />}
			{navigation.activePage === 'installEmbeddingModel' && (
				<InstallEmbeddingModel />
			)}
			{navigation.activePage === 'indexFiles' && <IndexFiles />}
			{navigation.activePage === 'selectInstallation' && <SelectInstallation />}
		</>
	);
};

export default NavigationHandler;
