import {fs} from 'zx';
import {addToGitIgnore} from './addToGitIgnore.js';
import type {Config} from '../types/Config.js';

export const registerRepo = async ({repo, filePaths}: Config) => {
	const dirPath = './.fishcake';

	await fs.mkdir(dirPath, {recursive: true});
	await fs.writeJson(`${dirPath}/config.json`, {repo, filePaths});
	await addToGitIgnore();

	return true;
};
