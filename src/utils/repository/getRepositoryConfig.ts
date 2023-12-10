import {fs} from 'zx';
import {manjaroRepositoryPath} from '../manjaroPath.js';
import type {RepoConfig} from '../../types/Repo.js';

export const getRepositoryConfig = async (): Promise<RepoConfig> =>
	await fs.readJson(`${manjaroRepositoryPath}/config.json`);
