import {fs} from 'zx';
import {addToGitIgnore} from '../scripts/addToGitIgnore.js';

import {fishcakeRepositoryPath} from './fishcakePath.js';
import type {FishcakeRepoConfig} from '../types/FishcakeRepoConfig.js';

export const createFishcakeConfig = async ({
	packageManager,
}: FishcakeRepoConfig) => {
	await fs.mkdir(fishcakeRepositoryPath, {recursive: true});
	await fs.writeJson(`${fishcakeRepositoryPath}/config.json`, {packageManager});
	await addToGitIgnore();

	return true;
};
