import {fs} from 'zx';
import {fishcakeRepositoryPath} from '../fishcakePath.js';
import type {RepoConfig} from '../../types/Repo.js';

export const getRepositoryConfig = async (): Promise<RepoConfig> =>
	await fs.readJson(`${fishcakeRepositoryPath}/config.json`);
