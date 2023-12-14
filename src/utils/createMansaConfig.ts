import {fs} from 'zx';
import {addToGitIgnore} from '../scripts/addToGitIgnore.js';

import {mansaRepositoryPath} from './mansaPath.js';
import type {RepoConfig} from '../types/Repo.js';

export const createMansaConfig = async ({packageManager}: RepoConfig) => {
	await fs.mkdir(mansaRepositoryPath, {recursive: true});
	await fs.writeJson(`${mansaRepositoryPath}/config.json`, {packageManager});
	await addToGitIgnore();

	return true;
};
