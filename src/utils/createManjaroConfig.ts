import {fs} from 'zx';
import {addToGitIgnore} from '../scripts/addToGitIgnore.js';

import {manjaroRepositoryPath} from './manjaroPath.js';
import type {RepoConfig} from '../types/Repo.js';

export const createManjaroConfig = async ({packageManager}: RepoConfig) => {
	await fs.mkdir(manjaroRepositoryPath, {recursive: true});
	await fs.writeJson(`${manjaroRepositoryPath}/config.json`, {packageManager});
	await addToGitIgnore();

	return true;
};
