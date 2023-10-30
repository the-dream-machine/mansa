import React, {useEffect, useState} from 'react';
import {fs} from 'zx';
import {InstallDatabase} from './InstallDatabase.js';

export const Setup = () => {
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		try {
			fs.accessSync('./.fishcake', fs.constants.F_OK); // Check if the folder exists
			setIsInitialized(true);
		} catch (err) {
			setIsInitialized(false);
		}
	}, []);

	// if (isInitialized) {
	// }
	return <InstallDatabase />;
};
