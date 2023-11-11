import {fs} from 'zx';
import {addToGitIgnore} from '../scripts/addToGitIgnore.js';

import {fishcakeRepoPath} from './fishcakePath.js';
import type {FishcakeRepoConfig} from '../types/FishcakeRepoConfig.js';

export const createFishcakeConfig = async ({
	packageManager,
}: FishcakeRepoConfig) => {
	await fs.mkdir(fishcakeRepoPath, {recursive: true});
	await fs.writeJson(`${fishcakeRepoPath}/config.json`, {packageManager});
	await addToGitIgnore();

	return true;
};
