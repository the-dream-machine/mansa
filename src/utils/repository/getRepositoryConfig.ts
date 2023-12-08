import {fs} from 'zx';
import {jojiRepositoryPath} from '../jojiPath.js';
import type {RepoConfig} from '../../types/Repo.js';

export const getRepositoryConfig = async (): Promise<RepoConfig> =>
	await fs.readJson(`${jojiRepositoryPath}/config.json`);
