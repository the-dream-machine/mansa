import {fs} from 'zx';
import {addToGitIgnore} from '../scripts/addToGitIgnore.js';

import {jojiRepositoryPath} from './jojiPath.js';
import type {RepoConfig} from '../types/Repo.js';

export const createJojiConfig = async ({packageManager}: RepoConfig) => {
	await fs.mkdir(jojiRepositoryPath, {recursive: true});
	await fs.writeJson(`${jojiRepositoryPath}/config.json`, {packageManager});
	await addToGitIgnore();

	return true;
};
