import {fs} from 'zx';
import {addToGitIgnore} from './addToGitIgnore.js';
import type {Config} from '../types/Config.js';

export const registerRepo = async ({repo, filePaths}: Config) => {
	const dirPath = './.fishcake';
	try {
		await fs.access(dirPath, fs.constants.F_OK);
	} catch (error) {
		await fs.mkdir(dirPath, {recursive: true});
		await fs.writeJson(`${dirPath}/config.json`, {repo, filePaths});
		await addToGitIgnore();
	}

	return;
};
