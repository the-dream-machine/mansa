import {fs} from 'zx';
import axios, {type AxiosResponse} from 'axios';

import type {FileMapItem} from '../../types/FileMapItem.js';
import {fishcakeRepositoryPath} from '../fishcakePath.js';
import {getRepositoryDetails} from '../repository/getRepositoryDetails.js';
import {type Run} from '../../types/Run.js';

export const generateSteps = async () => {
	const codebaseMap: FileMapItem[] = await fs.readJSON(
		`${fishcakeRepositoryPath}/map.json`,
	);
	const repositoryDetails = await getRepositoryDetails();
	const data = JSON.stringify({
		codebaseMap,
		dependencies: repositoryDetails.dependencies,
		devDependencies: repositoryDetails.devDependencies,
		question:
			'How do I set up trigger.dev in my project using the manual setup guide?',
	});
	const config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: 'http://localhost:3000/generate-steps',
		headers: {'Content-Type': 'application/json'},
		data,
	};

	try {
		const response: AxiosResponse<Run> = await axios.request(config);
		return response.data;
	} catch (error) {
		throw error;
	}
};
