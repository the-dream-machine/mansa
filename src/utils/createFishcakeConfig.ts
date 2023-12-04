import {fs} from 'zx';
import {addToGitIgnore} from '../scripts/addToGitIgnore.js';

import {fishcakeRepositoryPath} from './fishcakePath.js';
import type {RepoConfig} from '../types/Repo.js';

export const createFishcakeConfig = async ({packageManager}: RepoConfig) => {
	await fs.mkdir(fishcakeRepositoryPath, {recursive: true});
	await fs.writeJson(`${fishcakeRepositoryPath}/config.json`, {packageManager});
	await addToGitIgnore();

	return true;
};
