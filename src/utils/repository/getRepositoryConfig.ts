import {fs} from 'zx';
import {mansaRepositoryPath} from '../mansaPath.js';
import type {RepoConfig} from '../../types/Repo.js';

export const getRepositoryConfig = async (): Promise<RepoConfig> =>
	await fs.readJson(`${mansaRepositoryPath}/config.json`);
